"""Image processing and validation services."""

import io
import logging
from typing import Tuple, Dict, Any, Optional
from PIL import Image

from ..config import config

logger = logging.getLogger(__name__)


class ImageValidationError(Exception):
    """Exception raised when image validation fails."""
    pass


class ImagePreprocessor:
    """Service for image validation and preprocessing."""
    
    def __init__(self):
        self.config = config.image
    
    async def validate_and_preprocess(self, image_data: bytes) -> Tuple[bytes, Dict[str, Any]]:
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
                f"Image too large: {original_size / (1024*1024):.1f}MB "
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
            "compression_ratio": len(processed_data) / original_size if original_size > 0 else 0,
            "content_type": content_type
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
        if image.mode in ('RGBA', 'P'):
            image = image.convert('RGB')
        
        # Compress to target size
        output = io.BytesIO()
        quality = self.config.image_compression_quality
        
        while quality > 20:  # Don't go below 20% quality
            output.seek(0)
            output.truncate()
            image.save(output, format='JPEG', quality=quality, optimize=True)
            
            if len(output.getvalue()) <= self.config.max_ai_image_size_kb * 1024:
                break
            quality -= 10
        
        return output.getvalue()


class ImageProcessingService:
    """Main service for orchestrating image processing and AI analysis."""
    
    def __init__(self, ai_provider=None):
        """
        Initialize image processing service.
        
        Args:
            ai_provider: AI provider instance (will be injected in later tasks)
        """
        self.preprocessor = ImagePreprocessor()
        self.ai_provider = ai_provider
    
    async def analyze_image_and_generate_tasks(
        self, 
        image_data: bytes, 
        user_id: str,
        generate_tasks: bool = True
    ) -> Dict[str, Any]:
        """
        Main orchestration method for complete image analysis.
        
        This is a placeholder implementation that will be completed in later tasks.
        
        Args:
            image_data: Raw image bytes
            user_id: User identifier
            generate_tasks: Whether to generate tasks from analysis
            
        Returns:
            Dictionary containing analysis results
        """
        # Validate and preprocess image
        processed_data, metadata = await self.preprocessor.validate_and_preprocess(image_data)
        
        # Placeholder response structure
        return {
            "image_metadata": metadata,
            "analysis_summary": "Image processing service placeholder",
            "tasks": [],
            "processing_time": 0.0,
            "provider_used": "none"
        }
    
    def generate_prompt(self, context: Optional[Dict[str, Any]] = None) -> str:
        """
        Generate AI prompt based on context and requirements.
        
        Args:
            context: Optional context for prompt customization
            
        Returns:
            Generated prompt string
        """
        base_prompt = """
You are a home maintenance expert analyzing an image to identify maintenance tasks.

Analyze this image and identify specific, actionable home maintenance tasks based on what you observe.

For each task you identify:
1. Provide a clear, specific title (max 50 characters)
2. Include a detailed description explaining what needs to be done and why
3. Assign a priority level (high, medium, low) based on urgency and safety
4. Suggest a category (cleaning, repair, maintenance, safety, etc.)

Focus on:
- Visible maintenance needs (dirt, wear, damage)
- Safety concerns
- Preventive maintenance opportunities
- Seasonal considerations

Return your response as a JSON array of tasks with this structure:
{
  "tasks": [
    {
      "title": "Task title",
      "description": "Detailed description",
      "priority": "high|medium|low",
      "category": "category name",
      "reasoning": "Why this task is needed"
    }
  ],
  "analysis_summary": "Brief summary of what you observed in the image"
}

If you cannot identify any maintenance tasks, return an empty tasks array with an explanation in the analysis_summary.
        """.strip()
        
        return base_prompt