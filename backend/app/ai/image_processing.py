"""Image processing and validation services."""

import io
import logging
import asyncio
import time
from typing import Tuple, Dict, Any, Optional, List
from PIL import Image

from ..config import config
from .providers import (
    AIProvider,
    AIProviderError,
    AIProviderRateLimitError,
    AIProviderAPIError,
)
from ..models import AITaskCreate, TaskSource, TaskType
from ..logging_config import ImageProcessingLogger

logger = logging.getLogger(__name__)


class ImageValidationError(Exception):
    """Exception raised when image validation fails."""

    pass


class ImagePreprocessor:
    """Service for image validation and preprocessing."""

    def __init__(self):
        self.config = config.image

    async def validate_and_preprocess(
        self, image_data: bytes
    ) -> Tuple[bytes, Dict[str, Any]]:
        """
        Validate and preprocess image for AI analysis.

        Args:
            image_data: Raw image bytes

        Returns:
            Tuple of (processed_image_data, metadata)

        Raises:
            ImageValidationError: If image validation fails
        """
        # Validation
        original_size = len(image_data)
        if original_size > self.config.max_image_size_mb * 1024 * 1024:
            raise ImageValidationError(
                f"Image too large: {original_size / (1024 * 1024):.1f}MB "
                f"(max: {self.config.max_image_size_mb}MB)"
            )

        # Load and validate image
        try:
            image = Image.open(io.BytesIO(image_data))
            format_type = image.format.lower() if image.format else "unknown"
            content_type = f"image/{format_type}"

            if content_type not in self.config.supported_formats:
                raise ImageValidationError(
                    f"Unsupported format: {format_type}. "
                    f"Supported: {', '.join(self.config.supported_formats)}"
                )

        except Exception as e:
            if isinstance(e, ImageValidationError):
                raise
            raise ImageValidationError(f"Invalid image file: {str(e)}")

        # Preprocess for AI
        processed_data = self._compress_for_ai(image)

        metadata = {
            "original_size": original_size,
            "processed_size": len(processed_data),
            "original_format": format_type,
            "dimensions": image.size,
            "compression_ratio": len(processed_data) / original_size
            if original_size > 0
            else 0,
            "content_type": content_type,
        }

        return processed_data, metadata

    def _compress_for_ai(self, image: Image.Image) -> bytes:
        """
        Compress image for AI processing while maintaining quality.

        Args:
            image: PIL Image object

        Returns:
            Compressed image bytes
        """
        # Resize if too large
        max_dimension = 1024
        if max(image.size) > max_dimension:
            image.thumbnail((max_dimension, max_dimension), Image.Resampling.LANCZOS)

        # Convert to RGB if necessary
        if image.mode in ("RGBA", "P"):
            image = image.convert("RGB")

        # Compress to target size
        output = io.BytesIO()
        quality = self.config.image_compression_quality

        while quality > 20:  # Don't go below 20% quality
            output.seek(0)
            output.truncate()
            image.save(output, format="JPEG", quality=quality, optimize=True)

            if len(output.getvalue()) <= self.config.max_ai_image_size_kb * 1024:
                break
            quality -= 10

        return output.getvalue()


class ImageProcessingError(Exception):
    """Base exception for image processing errors."""

    pass


class ImageProcessingService:
    """Main service for orchestrating image processing and AI analysis."""

    # Confidence calculation constants
    MAX_TASK_COUNT_SCORE_THRESHOLD = 5.0  # Max score at 5+ tasks
    DESCRIPTION_LENGTH_HIGH = 50  # High quality description threshold
    DESCRIPTION_LENGTH_MEDIUM = 20  # Medium quality description threshold

    # Retry logic constants
    EXPONENTIAL_BACKOFF_FACTOR = 1.5  # Backoff factor for API errors
    MAX_API_ERROR_DELAY = 10.0  # Maximum delay for API errors (seconds)

    # Validation constants
    MAX_TITLE_LENGTH = 50  # Maximum task title length (characters)

    def __init__(self, ai_provider: Optional[AIProvider] = None):
        """
        Initialize image processing service.

        Args:
            ai_provider: AI provider instance for image analysis
        """
        self.preprocessor = ImagePreprocessor()
        self.ai_provider = ai_provider
        self.max_retries = 3
        self.base_retry_delay = 1.0  # seconds
        self.max_retry_delay = 30.0  # seconds
        self.processing_logger = ImageProcessingLogger()

    async def analyze_image_and_generate_tasks(
        self,
        image_data: bytes,
        user_id: str,
        generate_tasks: bool = True,
        prompt_override: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Main orchestration method for complete image analysis.

        Args:
            image_data: Raw image bytes
            user_id: User identifier
            generate_tasks: Whether to generate tasks from analysis
            prompt_override: Optional custom prompt for testing

        Returns:
            Dictionary containing analysis results with structure:
            {
                "image_metadata": Dict[str, Any],
                "analysis_summary": str,
                "tasks": List[Dict[str, Any]],
                "processing_time": float,
                "provider_used": str,
                "ai_confidence": Optional[float],
                "retry_count": int
            }

        Raises:
            ImageProcessingError: If processing fails after all retries
            ImageValidationError: If image validation fails
        """
        start_time = time.time()
        retry_count = 0

        try:
            # Step 1: Validate and preprocess image
            logger.info(f"Starting image analysis for user {user_id}")
            
            try:
                processed_data, metadata = await self.preprocessor.validate_and_preprocess(
                    image_data
                )
                
                # Log successful validation
                self.processing_logger.log_image_validation(
                    user_id=user_id,
                    validation_result="success",
                    original_size=metadata["original_size"],
                    processed_size=metadata["processed_size"],
                    compression_ratio=metadata.get("compression_ratio")
                )
                
                logger.info(
                    f"Image preprocessed: {metadata['original_size']} -> {metadata['processed_size']} bytes"
                )
            except ImageValidationError as e:
                # Log validation failure
                self.processing_logger.log_image_validation(
                    user_id=user_id,
                    validation_result="failed",
                    original_size=len(image_data),
                    error_message=str(e)
                )
                raise

            # Step 2: Generate AI analysis (if provider available and tasks requested)
            analysis_result = None
            if self.ai_provider and generate_tasks:
                # Log AI request start
                prompt = prompt_override or self.generate_prompt()
                self.processing_logger.log_ai_request_start(
                    user_id=user_id,
                    provider=self.ai_provider.get_provider_name(),
                    model=getattr(self.ai_provider, 'model', 'unknown'),
                    image_size=len(processed_data),
                    prompt_length=len(prompt)
                )
                
                analysis_result = await self._analyze_with_retry(processed_data, prompt)
                retry_count = analysis_result.get("retry_count", 0)
                
                # Log AI request completion
                self.processing_logger.log_ai_request_complete(
                    user_id=user_id,
                    provider=self.ai_provider.get_provider_name(),
                    model=getattr(self.ai_provider, 'model', 'unknown'),
                    processing_time=analysis_result.get("processing_time", 0.0),
                    tokens_used=analysis_result.get("tokens_used"),
                    cost_estimate=analysis_result.get("cost_estimate"),
                    tasks_generated=len(analysis_result.get("tasks", [])),
                    retry_count=retry_count,
                    success=True
                )

            # Step 3: Process results
            processing_time = time.time() - start_time

            if analysis_result:
                tasks = analysis_result.get("tasks", [])
                # Log task confidence values for debugging
                for i, task in enumerate(tasks):
                    logger.info(f"Task {i}: '{task.get('title', 'Unknown')}' has confidence: {task.get('confidence', 'MISSING')}")
                
                result = {
                    "image_metadata": metadata,
                    "analysis_summary": analysis_result.get(
                        "analysis_summary", "No analysis available"
                    ),
                    "tasks": tasks,
                    "processing_time": processing_time,
                    "provider_used": analysis_result.get("provider", "none"),
                    "ai_confidence": self._calculate_confidence(analysis_result),
                    "retry_count": retry_count,
                }
            else:
                result = {
                    "image_metadata": metadata,
                    "analysis_summary": "Image processed but no AI analysis performed",
                    "tasks": [],
                    "processing_time": processing_time,
                    "provider_used": "none",
                    "ai_confidence": None,
                    "retry_count": 0,
                }

            # Log pipeline completion
            self.processing_logger.log_processing_pipeline_complete(
                user_id=user_id,
                total_processing_time=processing_time,
                tasks_generated=len(result["tasks"]),
                success=True
            )

            logger.info(
                f"Image analysis completed in {processing_time:.2f}s with {len(result['tasks'])} tasks"
            )
            return result

        except ImageValidationError:
            # Re-raise validation errors without wrapping
            raise
        except Exception as e:
            processing_time = time.time() - start_time
            
            # Log pipeline failure
            self.processing_logger.log_processing_pipeline_complete(
                user_id=user_id,
                total_processing_time=processing_time,
                tasks_generated=0,
                success=False,
                error_message=str(e)
            )
            
            logger.error(f"Image processing failed after {processing_time:.2f}s: {e}")
            raise ImageProcessingError(f"Image processing failed: {str(e)}") from e

    async def _analyze_with_retry(
        self, image_data: bytes, prompt: str
    ) -> Dict[str, Any]:
        """
        Analyze image with AI provider using retry logic.

        Args:
            image_data: Preprocessed image bytes
            prompt: Analysis prompt

        Returns:
            AI analysis result with retry count

        Raises:
            ImageProcessingError: If all retries fail
        """
        if self.ai_provider is None:
            raise ImageProcessingError("AI provider is not configured")

        last_exception: Optional[Exception] = None

        for attempt in range(self.max_retries + 1):  # +1 for initial attempt
            try:
                logger.info(f"AI analysis attempt {attempt + 1}/{self.max_retries + 1}")
                result = await self.ai_provider.analyze_image(image_data, prompt)
                result["retry_count"] = attempt
                return result

            except AIProviderRateLimitError as e:
                last_exception = e
                if attempt < self.max_retries:
                    # Use retry_after from exception if available, otherwise exponential backoff
                    delay = (
                        e.retry_after
                        if e.retry_after
                        else min(
                            self.base_retry_delay * (2**attempt), self.max_retry_delay
                        )
                    )
                    logger.warning(
                        f"Rate limit hit, retrying in {delay}s (attempt {attempt + 1})"
                    )
                    await asyncio.sleep(delay)
                else:
                    logger.error(
                        f"Rate limit exceeded after {self.max_retries} retries"
                    )

            except AIProviderAPIError as e:
                last_exception = e
                if attempt < self.max_retries:
                    # Shorter delay for API errors
                    delay = min(
                        self.base_retry_delay
                        * (self.EXPONENTIAL_BACKOFF_FACTOR**attempt),
                        self.MAX_API_ERROR_DELAY,
                    )
                    logger.warning(
                        f"API error, retrying in {delay}s (attempt {attempt + 1}): {e}"
                    )
                    await asyncio.sleep(delay)
                else:
                    logger.error(
                        f"API error persisted after {self.max_retries} retries"
                    )

            except AIProviderError as e:
                last_exception = e
                # Don't retry for general provider errors
                logger.error(f"AI provider error (no retry): {e}")
                break

            except Exception as e:
                last_exception = e
                logger.error(f"Unexpected error during AI analysis: {e}")
                break

        # All retries failed
        error_msg = f"AI analysis failed after {self.max_retries} retries"
        if last_exception:
            error_msg += f": {str(last_exception)}"
        raise ImageProcessingError(error_msg)

    def _calculate_confidence(self, analysis_result: Dict[str, Any]) -> Optional[float]:
        """
        Calculate confidence score based on AI analysis result.

        Args:
            analysis_result: AI provider response

        Returns:
            Confidence score between 0.0 and 1.0, or None if not calculable
        """
        try:
            tasks = analysis_result.get("tasks", [])
            if not tasks:
                return 0.0

            # Simple confidence calculation based on:
            # - Number of tasks found (more tasks = higher confidence in analysis)
            # - Presence of detailed descriptions
            # - Specific priority assignments

            task_count_score = min(
                len(tasks) / self.MAX_TASK_COUNT_SCORE_THRESHOLD, 1.0
            )  # Max score at 5+ tasks

            detail_scores = []
            for task in tasks:
                detail_score = 0.0

                # Check for detailed description
                description = task.get("description", "")
                if len(description) > self.DESCRIPTION_LENGTH_HIGH:
                    detail_score += 0.3
                elif len(description) > self.DESCRIPTION_LENGTH_MEDIUM:
                    detail_score += 0.2
                elif len(description) > 0:
                    detail_score += 0.1

                # Check for specific priority
                priority = task.get("priority", "").lower()
                if priority in ["high", "medium", "low"]:
                    detail_score += 0.2

                # Check for category
                category = task.get("category", "")
                if category and len(category) > 0:
                    detail_score += 0.2

                # Check for reasoning
                reasoning = task.get("reasoning", "")
                if len(reasoning) > 20:
                    detail_score += 0.3
                elif len(reasoning) > 0:
                    detail_score += 0.1

                detail_scores.append(min(detail_score, 1.0))

            avg_detail_score = (
                sum(detail_scores) / len(detail_scores) if detail_scores else 0.0
            )

            # Weighted combination
            confidence = (task_count_score * 0.4) + (avg_detail_score * 0.6)
            return round(confidence, 3)

        except Exception as e:
            logger.warning(f"Failed to calculate confidence score: {e}")
            return None

    def generate_prompt(self, context: Optional[Dict[str, Any]] = None) -> str:
        """
        Generate AI prompt based on context and requirements.

        Args:
            context: Optional context for prompt customization

        Returns:
            Generated prompt string
        """
        # Base prompt for home maintenance task identification
        base_prompt = """You are a home maintenance expert analyzing an image to identify maintenance tasks.

Analyze this image and identify specific, actionable home maintenance tasks based on what you observe.

For each task you identify:
1. Provide a clear, specific title (max 50 characters)
2. Include a detailed description explaining what needs to be done and why
3. Assign a priority level (high, medium, low) based on urgency and safety
4. Suggest a category (cleaning, repair, maintenance, safety, etc.)
5. Assign one or more task_types from this list that best describe the task:
   - interior: Tasks related to inside the home
   - exterior: Tasks related to outside the home
   - electricity: Electrical work or issues
   - plumbing: Plumbing related tasks
   - appliances: Appliance maintenance or repair
   - maintenance: Regular upkeep and preventive care
   - repair: Fixing broken or damaged items

Focus on:
- Visible maintenance needs (dirt, wear, damage)
- Safety concerns
- Preventive maintenance opportunities
- Seasonal considerations

Include a reasoning field for each task explaining why it was identified.

For each task, provide a confidence score (0.0 to 1.0) indicating how certain you are:
- 0.8-1.0: Very confident - clear visual evidence of the issue
- 0.5-0.7: Moderately confident - likely issue but some uncertainty
- 0.2-0.4: Low confidence - possible issue but hard to determine from image

If you cannot identify any maintenance tasks, provide an empty tasks array with an explanation in the analysis_summary."""

        # Add context-specific modifications if provided
        if context:
            room_type = context.get("room_type")
            if room_type:
                base_prompt += f"\n\nNote: This image is from a {room_type}. Focus on maintenance tasks specific to this area."

            focus_areas = context.get("focus_areas")
            if focus_areas:
                areas_str = ", ".join(focus_areas)
                base_prompt += f"\n\nPay special attention to: {areas_str}"

        return base_prompt.strip()

    def validate_ai_response(self, response: Dict[str, Any]) -> List[str]:
        """
        Validate AI response structure and content.

        Args:
            response: AI provider response

        Returns:
            List of validation errors (empty if valid)
        """
        errors = []

        # Check required fields
        if "analysis_summary" not in response:
            errors.append("Missing analysis_summary field")

        if "tasks" not in response:
            errors.append("Missing tasks field")
        elif not isinstance(response["tasks"], list):
            errors.append("Tasks field must be a list")
        else:
            # Validate each task
            for i, task in enumerate(response["tasks"]):
                if not isinstance(task, dict):
                    errors.append(f"Task {i} must be a dictionary")
                    continue

                # Required task fields
                required_fields = ["title", "description", "priority", "category"]
                for field in required_fields:
                    if field not in task:
                        errors.append(f"Task {i} missing required field: {field}")
                    elif not isinstance(task[field], str):
                        errors.append(f"Task {i} field '{field}' must be a string")

                # Validate priority values
                if (
                    "priority" in task
                    and isinstance(task["priority"], str)
                    and task["priority"].lower() not in ["high", "medium", "low"]
                ):
                    errors.append(f"Task {i} has invalid priority: {task['priority']}")

                # Validate title length
                if "title" in task and len(task["title"]) > self.MAX_TITLE_LENGTH:
                    errors.append(
                        f"Task {i} title too long (max {self.MAX_TITLE_LENGTH} characters)"
                    )

        return errors

    async def create_tasks_from_analysis(
        self,
        analysis_result: Dict[str, Any],
        user_id: str,
        source_image_id: str,
        provider_name: str,
    ) -> List[Dict[str, Any]]:
        """
        Create tasks in the database from AI analysis results.

        Args:
            analysis_result: AI analysis result containing tasks
            user_id: User ID to assign tasks to
            source_image_id: UUID of the source image
            provider_name: Name of the AI provider used

        Returns:
            List of created task records
        """
        tasks_data = analysis_result.get("tasks", [])
        if not tasks_data:
            return []

        ai_confidence = self._calculate_confidence(analysis_result)
        ai_tasks = []

        for task_data in tasks_data:
            # Parse task types
            task_types_raw = task_data.get("task_types", [])
            task_types = []
            for tt in task_types_raw:
                try:
                    task_types.append(TaskType(tt))
                except ValueError:
                    logger.warning(
                        f"Invalid task type '{tt}', skipping. Valid types are: {[t.value for t in TaskType]}"
                    )
            
            # Create AITaskCreate model
            ai_task = AITaskCreate(
                title=task_data["title"],
                description=task_data["description"],
                priority=task_data.get("priority", "medium").lower(),
                task_types=task_types,
                source=TaskSource.AI_GENERATED,
                source_image_id=source_image_id,
                ai_confidence=task_data.get("confidence", ai_confidence or 0.5),  # Use task-specific confidence if available
                ai_provider=provider_name,
            )
            ai_tasks.append(ai_task)

        # Use TaskService to create tasks with proper prioritization
        # Note: We need a session here, but we don't have access to it in this context
        # This would need to be refactored to pass session from the caller
        # For now, return the task data without creating in DB
        created_tasks: List[Dict[str, Any]] = []
        for task in ai_tasks:
            created_tasks.append(task.model_dump())

        # Log task creation
        self.processing_logger.log_task_creation(
            user_id=user_id,
            tasks_created=len(created_tasks),
            source_image_id=source_image_id,
            ai_confidence=ai_confidence,
            provider=provider_name
        )

        logger.info(
            f"Created {len(created_tasks)} tasks from AI analysis for user {user_id}"
        )
        return created_tasks
