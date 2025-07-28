"""Image analysis API endpoints."""

import logging
import uuid
from datetime import datetime
from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Header, UploadFile, File, Form, status
from fastapi.responses import JSONResponse

from .models import ImageAnalysisResponse, ImageAnalysisError, GeneratedTask
from .ai.image_processing import (
    ImageProcessingService,
    ImageProcessingError,
    ImageValidationError,
)
from .ai.providers import AIProviderFactory, AIProviderError
from .config import config
from .database import supabase
from .logging_config import (
    ImageProcessingLogger,
    generate_correlation_id,
    set_correlation_id
)

logger = logging.getLogger(__name__)
processing_logger = ImageProcessingLogger()

router = APIRouter(prefix="/api/images", tags=["images"])


async def _process_image_analysis(
    image_data: bytes,
    user_id: str,
    filename: str,
    content_type: str,
    generate_tasks: bool,
    prompt_override: Optional[str],
) -> ImageAnalysisResponse:
    """
    Process image analysis workflow.
    
    Args:
        image_data: Raw image bytes
        user_id: User identifier
        filename: Original filename
        content_type: MIME type
        generate_tasks: Whether to generate tasks
        prompt_override: Optional custom prompt
        
    Returns:
        ImageAnalysisResponse with analysis results
    """
    # Create processing service
    processing_service = create_image_processing_service()

    # Store image record first (if generating tasks)
    image_id = None
    if generate_tasks:
        try:
            image_id = await store_image_record(
                user_id=user_id,
                filename=filename,
                content_type=content_type,
                file_size=len(image_data),
            )
        except Exception as e:
            logger.warning(f"Failed to store image record, continuing without: {e}")
            # Continue without storing image record - analysis can still work

    # Process image
    logger.info(f"Starting image analysis for user {user_id}, file: {filename}")

    analysis_result = await processing_service.analyze_image_and_generate_tasks(
        image_data=image_data,
        user_id=user_id,
        generate_tasks=generate_tasks,
        prompt_override=prompt_override,
    )

    # Create tasks if requested and analysis was successful
    if generate_tasks and analysis_result.get("tasks"):
        try:
            await _create_tasks_from_analysis(
                processing_service=processing_service,
                analysis_result=analysis_result,
                user_id=user_id,
                image_id=image_id,
            )
        except Exception as e:
            logger.warning(f"Failed to create tasks from analysis: {e}")
            # Continue - we can still return the analysis results

    # Convert to response format and return
    return _build_analysis_response(analysis_result, image_id)


async def _create_tasks_from_analysis(
    processing_service: ImageProcessingService,
    analysis_result: Dict[str, Any],
    user_id: str,
    image_id: Optional[str],
) -> None:
    """
    Create tasks from analysis results and update image status.
    
    Args:
        processing_service: Image processing service instance
        analysis_result: AI analysis results
        user_id: User identifier
        image_id: Optional image record ID
    """
    try:
        # Create basic tasks using simple database insertion
        tasks_data = analysis_result.get("tasks", [])
        created_count = 0
        
        for task_data in tasks_data:
            try:
                # Create basic task data
                basic_task = {
                    "title": task_data.get("title", "Untitled task"),
                    "description": task_data.get("description", "No description"),
                    "user_id": user_id,
                    "completed": False,
                }
                
                # Insert directly into database
                response = supabase.table("tasks").insert(basic_task).execute()
                if response.data:
                    created_count += 1
                    
            except Exception as task_error:
                logger.warning(f"Failed to create individual task: {task_error}")
                continue

        # Update image record with analysis results if image_id exists
        if image_id:
            await update_image_analysis_status(
                image_id=image_id,
                status="completed",
                analysis_result=analysis_result,
            )

        logger.info(f"Created {created_count} tasks from image analysis")

    except Exception as e:
        logger.error(f"Failed to create tasks from analysis: {e}")
        if image_id:
            await update_image_analysis_status(
                image_id=image_id,
                status="failed",
                analysis_result={"error": str(e)},
            )
        # Don't re-raise - analysis is still valuable even if task creation fails


def _create_error_response(
    error_code: str,
    message: str,
    details: Dict[str, Any],
    status_code: int,
    retry_after: Optional[int] = None,
) -> JSONResponse:
    """
    Create a standardized error response.
    
    Args:
        error_code: Error code identifier
        message: Human-readable error message
        details: Additional error details
        status_code: HTTP status code
        retry_after: Optional retry delay in seconds
        
    Returns:
        JSONResponse with error details
    """
    error_response = ImageAnalysisError(
        error_code=error_code,
        message=message,
        details=details,
        retry_after=retry_after,
    )
    return JSONResponse(
        status_code=status_code,
        content=error_response.model_dump(),
    )


def _build_analysis_response(
    analysis_result: Dict[str, Any], image_id: Optional[str]
) -> ImageAnalysisResponse:
    """
    Build the final analysis response from results.
    
    Args:
        analysis_result: AI analysis results
        image_id: Optional image record ID
        
    Returns:
        Formatted ImageAnalysisResponse
    """
    # Convert tasks to response format
    generated_tasks = []
    for task_data in analysis_result.get("tasks", []):
        generated_task = GeneratedTask(
            title=task_data.get("title", "Untitled task"),
            description=task_data.get("description", "No description"),
            priority=task_data.get("priority", "medium"),
            category=task_data.get("category", "general"),
            confidence_score=analysis_result.get("ai_confidence", 0.5),
        )
        generated_tasks.append(generated_task)

    return ImageAnalysisResponse(
        image_id=image_id,
        tasks=generated_tasks,
        analysis_summary=analysis_result.get(
            "analysis_summary", "No analysis available"
        ),
        processing_time=analysis_result.get("processing_time", 0.0),
        provider_used=analysis_result.get("provider_used", "none"),
        image_metadata=analysis_result.get("image_metadata", {}),
        retry_count=analysis_result.get("retry_count", 0),
    )


def create_image_processing_service() -> ImageProcessingService:
    """Create and configure image processing service with AI provider."""
    try:
        # Create AI provider if configured
        ai_provider = None
        if config.ai.gemini_api_key:
            ai_provider = AIProviderFactory.create_provider(
                config.ai.default_provider,
                api_key=config.ai.gemini_api_key,
                model=config.ai.gemini_model,
            )

        return ImageProcessingService(ai_provider=ai_provider)
    except Exception as e:
        logger.error(f"Failed to create image processing service: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Image processing service is not available",
        )


@router.post("/analyze", response_model=ImageAnalysisResponse)
async def analyze_image(
    user_id: str = Header(..., alias="x-user-id"),
    image: UploadFile = File(..., description="Image file to analyze"),
    generate_tasks: bool = Form(
        True, description="Whether to generate tasks from analysis"
    ),
    prompt_override: Optional[str] = Form(
        None, description="Custom prompt for testing"
    ),
):
    """
    Analyze an uploaded image and optionally generate maintenance tasks.

    This endpoint accepts image uploads, validates and preprocesses them,
    analyzes them using AI to identify maintenance needs, and optionally
    creates tasks in the user's task list.

    **Supported formats**: JPEG, PNG, WebP
    **Maximum file size**: 10MB
    **Processing**: Images are compressed for AI analysis to reduce costs

    Args:
        user_id: User identifier from header
        image: Image file to analyze
        generate_tasks: Whether to create tasks from the analysis
        prompt_override: Optional custom prompt for testing purposes

    Returns:
        ImageAnalysisResponse containing analysis results and generated tasks

    Raises:
        400: Invalid image format or size
        413: Image too large
        422: Invalid request parameters
        503: AI service unavailable
        500: Internal processing error
    """
    # Generate correlation ID for request tracking
    correlation_id = generate_correlation_id()
    set_correlation_id(correlation_id)
    
    # Validate file upload
    if not image.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="No file uploaded"
        )

    # Check file size before reading
    if (
        hasattr(image, "size")
        and image.size
        and image.size > config.image.max_image_size_mb * 1024 * 1024
    ):
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Maximum size: {config.image.max_image_size_mb}MB",
        )

    # Read image data
    image_data = await image.read()

    if len(image_data) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Empty file uploaded"
        )

    # Log image upload
    processing_logger.log_image_upload(
        user_id=user_id,
        filename=image.filename,
        file_size=len(image_data),
        content_type=image.content_type or "application/octet-stream",
        correlation_id=correlation_id
    )

    try:
        response = await _process_image_analysis(
            image_data=image_data,
            user_id=user_id,
            filename=image.filename,
            content_type=image.content_type or "application/octet-stream",
            generate_tasks=generate_tasks,
            prompt_override=prompt_override,
        )
        
        logger.info(f"Image analysis completed successfully for user {user_id}")
        return response

    except ImageValidationError as e:
        logger.warning(f"Image validation failed for user {user_id}: {e}")
        error_response = ImageAnalysisError(
            error_code="INVALID_IMAGE",
            message=str(e),
            details={"filename": image.filename, "content_type": image.content_type},
            retry_after=None,
        )
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST, content=error_response.model_dump()
        )

    except AIProviderError as e:
        logger.error(f"AI provider error for user {user_id}: {e}")
        return _create_error_response(
            error_code="AI_PROVIDER_ERROR",
            message="AI analysis service is temporarily unavailable",
            details={"provider_error": str(e)},
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            retry_after=60,
        )

    except ImageProcessingError as e:
        logger.error(f"Image processing error for user {user_id}: {e}")
        return _create_error_response(
            error_code="PROCESSING_ERROR",
            message="Failed to process image",
            details={"processing_error": str(e)},
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    except Exception as e:
        logger.error(f"Unexpected error during image analysis for user {user_id}: {e}")
        return _create_error_response(
            error_code="INTERNAL_ERROR",
            message="An unexpected error occurred",
            details={"error": str(e)},
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


async def store_image_record(
    user_id: str, filename: str, content_type: str, file_size: int
) -> str:
    """
    Store image record in database.

    Args:
        user_id: User identifier
        filename: Original filename
        content_type: MIME type
        file_size: File size in bytes

    Returns:
        UUID of created image record

    Raises:
        Exception: If database operation fails
    """
    try:
        image_id = str(uuid.uuid4())

        image_data = {
            "id": image_id,
            "user_id": user_id,
            "filename": filename,
            "content_type": content_type,
            "file_size": file_size,
            "storage_path": f"images/{user_id}/{image_id}",  # Placeholder path
            "analysis_status": "processing",
        }

        response = supabase.table("images").insert(image_data).execute()

        if not response.data:
            raise Exception("Failed to store image record - no data returned")

        return image_id

    except Exception as e:
        logger.error(f"Failed to store image record: {e}")
        raise Exception(f"Failed to store image record: {e}")


async def update_image_analysis_status(
    image_id: str, status: str, analysis_result: Optional[Dict[str, Any]] = None
) -> None:
    """
    Update image analysis status in database.

    Args:
        image_id: Image UUID
        status: New status (processing, completed, failed)
        analysis_result: Optional analysis result data
    """
    try:
        update_data: Dict[str, Any] = {
            "analysis_status": status,
            "processed_at": datetime.now().isoformat(),
        }

        if analysis_result:
            update_data["analysis_result"] = analysis_result

        supabase.table("images").update(update_data).eq("id", image_id).execute()

    except Exception as e:
        logger.warning(f"Failed to update image analysis status (non-critical): {e}")
        # Don't raise exception here as this is a secondary operation


@router.get("/health")
async def health_check():
    """
    Health check endpoint for image analysis service.

    Returns:
        Service health status and configuration
    """
    try:
        # Check AI provider configuration
        ai_configured = bool(config.ai.gemini_api_key)

        # Check database connectivity
        supabase.table("images").select("count", count="exact").limit(1).execute()

        return {
            "status": "healthy",
            "ai_provider_configured": ai_configured,
            "default_provider": config.ai.default_provider,
            "supported_formats": config.image.supported_formats,
            "max_image_size_mb": config.image.max_image_size_mb,
            "database": "connected",
        }

    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"status": "unhealthy", "error": str(e)},
        )
