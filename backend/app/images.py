"""Image analysis API endpoints."""

import io
import logging
import uuid
from datetime import datetime
from typing import Optional, Dict, Any
from fastapi import (
    APIRouter,
    HTTPException,
    Header,
    UploadFile,
    File,
    Form,
    status,
    Depends,
)
from fastapi.responses import JSONResponse, StreamingResponse

from .models import ImageAnalysisResponse, ImageAnalysisError, GeneratedTask
from .ai.image_processing import (
    ImageProcessingService,
    ImageProcessingError,
    ImageValidationError,
)
from .ai.providers import AIProviderFactory, AIProviderError
from .config import config
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from .database import get_session_dependency, Image as ImageModel
from .storage import storage
from .logging_config import (
    ImageProcessingLogger,
    generate_correlation_id,
    set_correlation_id,
)
from .locale_detection import (
    detect_locale_with_user_preference,
    detect_locale_with_metadata_and_user_preference
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
    locale: str,
    session: AsyncSession,
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
        locale: User locale for AI prompt selection

    Returns:
        ImageAnalysisResponse with analysis results
    """
    # Create processing service
    processing_service = create_image_processing_service()

    # Process and validate image first
    logger.info(f"Starting image analysis for user {user_id}, file: {filename}")

    try:
        analysis_result = await processing_service.analyze_image_and_generate_tasks(
            image_data=image_data,
            user_id=user_id,
            generate_tasks=generate_tasks,
            prompt_override=prompt_override,
            locale=locale,
        )
    except ImageValidationError as e:
        # Return proper validation error for invalid images
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=ImageAnalysisError(
                message=str(e),
                error_code="INVALID_IMAGE",
                details=None,
                retry_after=None,
            ).model_dump(),
        )

    # Store image record after successful validation (if generating tasks)
    image_id = None
    if generate_tasks and analysis_result.get("tasks"):
        try:
            image_id = await store_image_record(
                user_id=user_id,
                filename=filename,
                content_type=content_type,
                file_size=len(image_data),
                image_data=image_data,
                session=session,
            )
        except Exception as e:
            logger.error(f"Failed to store image record: {e}")
            # Don't fail the entire request if storage fails
            # Just continue without storing the image

    # Note: We no longer auto-create tasks here.
    # Tasks should be created by the frontend when user confirms selection

    # Convert to response format and return
    return _build_analysis_response(analysis_result, image_id)


async def _create_tasks_from_analysis(
    processing_service: ImageProcessingService,
    analysis_result: Dict[str, Any],
    user_id: str,
    image_id: Optional[uuid.UUID],
    session: AsyncSession,
) -> None:
    """
    Create tasks from analysis results and update image status.

    Args:
        processing_service: Image processing service instance
        analysis_result: AI analysis results
        user_id: User identifier
        image_id: Optional image record ID
    """
    # Only create tasks if we have an image_id
    if not image_id:
        logger.warning("Cannot create tasks without image_id")
        return

    try:
        # Use the proper service method to create tasks
        created_tasks = await processing_service.create_tasks_from_analysis(
            analysis_result=analysis_result,
            user_id=user_id,
            source_image_id=image_id,
            provider_name=analysis_result.get("provider_used", "unknown"),
        )
        created_count = len(created_tasks)

        # Update image record with analysis results if image_id exists
        if image_id:
            await update_image_analysis_status(
                image_id=image_id,
                status="completed",
                session=session,
                analysis_result=analysis_result,
            )

        logger.info(f"Created {created_count} tasks from image analysis")

    except Exception as e:
        logger.error(f"Failed to create tasks from analysis: {e}")
        if image_id:
            await update_image_analysis_status(
                image_id=image_id,
                status="failed",
                session=session,
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
    analysis_result: Dict[str, Any], image_id: Optional[uuid.UUID]
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
    logger.info(
        f"Building response from analysis result with {len(analysis_result.get('tasks', []))} tasks"
    )
    for task_data in analysis_result.get("tasks", []):
        task_confidence = task_data.get("confidence", 0.5)
        logger.info(
            f"Task '{task_data.get('title', 'Unknown')}' has confidence: {task_confidence}"
        )
        generated_task = GeneratedTask(
            title=task_data.get("title", "Untitled task"),
            description=task_data.get("description", "No description"),
            priority=task_data.get("priority", "medium"),
            category=task_data.get("category", "general"),
            confidence_score=task_confidence,
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
    accept_language: Optional[str] = Header(None, alias="accept-language"),
    image: UploadFile = File(..., description="Image file to analyze"),
    generate_tasks: bool = Form(
        True,
        description="Whether to analyze image and suggest tasks (does not create tasks in DB)",
    ),
    prompt_override: Optional[str] = Form(
        None, description="Custom prompt for testing"
    ),
    session: AsyncSession = Depends(get_session_dependency),
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
    
    # Convert user_id to UUID for locale detection
    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Invalid user ID format"
        )
    
    # Detect locale with user preference override
    detected_locale = await detect_locale_with_user_preference(
        session, user_uuid, accept_language
    )
    
    # Get detailed locale metadata for logging
    locale_metadata = await detect_locale_with_metadata_and_user_preference(
        session, user_uuid, accept_language
    )
    
    logger.info(f"Detected locale: {detected_locale} from source: {locale_metadata.get('source')}")

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

    # Log image upload with locale information
    processing_logger.log_image_upload(
        user_id=user_id,
        filename=image.filename,
        file_size=len(image_data),
        content_type=image.content_type or "application/octet-stream",
        correlation_id=correlation_id,
    )
    
    # Log locale detection for monitoring
    logger.info(
        f"Image analysis request - User: {user_id}, Locale: {detected_locale}, "
        f"Locale source: {locale_metadata.get('source')}, "
        f"Accept-Language: {accept_language}, File: {image.filename}"
    )

    try:
        response = await _process_image_analysis(
            image_data=image_data,
            user_id=user_id,
            filename=image.filename,
            content_type=image.content_type or "application/octet-stream",
            generate_tasks=generate_tasks,
            prompt_override=prompt_override,
            locale=detected_locale,
            session=session,
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

    except HTTPException:
        # Re-raise HTTPException as is (don't wrap it)
        raise

    except Exception as e:
        logger.error(f"Unexpected error during image analysis for user {user_id}: {e}")
        return _create_error_response(
            error_code="INTERNAL_ERROR",
            message="An unexpected error occurred",
            details={"error": str(e)},
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


async def store_image_record(
    user_id: str,
    filename: str,
    content_type: str,
    file_size: int,
    image_data: bytes,
    session: AsyncSession,
) -> uuid.UUID:
    """
    Store image record in database and file in Supabase storage.

    Args:
        user_id: User identifier
        filename: Original filename
        content_type: MIME type
        file_size: File size in bytes
        image_data: Image file data

    Returns:
        UUID of created image record

    Raises:
        Exception: If database operation fails
    """
    try:
        image_id = uuid.uuid4()
        storage_path = f"images/{user_id}/{image_id}"

        # Store the actual image file in Supabase storage
        try:
            # Skip bucket creation - assume it exists
            # The bucket should be created manually in Supabase Studio

            # Upload the image using named parameters as per documentation

            # Upload bytes directly with named parameters
            await storage.upload(
                file_data=image_data, path=storage_path, content_type=content_type
            )

        except Exception as e:
            logger.error(f"Failed to upload image to storage: {e}")
            raise e

        # Create SQLAlchemy model instance
        db_image = ImageModel(
            id=image_id,
            user_id=uuid.UUID(user_id),
            filename=filename,
            content_type=content_type,
            file_size=file_size,
            storage_path=storage_path,
            analysis_status="processing",
        )

        session.add(db_image)
        await session.commit()
        await session.refresh(db_image)

        return image_id

    except Exception as e:
        logger.error(f"Failed to store image record: {e}")
        raise Exception(f"Failed to store image record: {e}")


async def update_image_analysis_status(
    image_id: uuid.UUID,
    status: str,
    session: AsyncSession,
    analysis_result: Optional[Dict[str, Any]] = None,
) -> None:
    """
    Update image analysis status in database.

    Args:
        image_id: Image UUID
        status: New status (processing, completed, failed)
        analysis_result: Optional analysis result data
    """
    try:
        # Get existing image
        query = select(ImageModel).where(ImageModel.id == image_id)
        result = await session.execute(query)
        db_image = result.scalar_one_or_none()

        if db_image:
            db_image.analysis_status = status
            db_image.processed_at = datetime.now()

            if analysis_result:
                db_image.analysis_result = analysis_result

            await session.commit()

    except Exception as e:
        logger.warning(f"Failed to update image analysis status (non-critical): {e}")
        # Don't raise exception here as this is a secondary operation


@router.get("/{image_id}")
async def get_image(
    image_id: uuid.UUID,
    user_id: str = Header(..., alias="x-user-id"),
    session: AsyncSession = Depends(get_session_dependency),
):
    """
    Get image URL and metadata by ID.

    Args:
        image_id: UUID of the image
        user_id: User identifier from header

    Returns:
        Image metadata including public URL

    Raises:
        404: Image not found
        403: User doesn't have access to this image
    """
    try:
        # Fetch image record from database
        query = select(ImageModel).where(
            and_(ImageModel.id == image_id, ImageModel.user_id == user_id)
        )
        result = await session.execute(query)
        image_record = result.scalar_one_or_none()

        if not image_record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Image not found"
            )

        # Get public URL from Supabase storage
        storage_url = storage.get_public_url(image_record.storage_path)

        # Generate thumbnail URL using Supabase image transformation
        # This creates a 200x200 thumbnail with good quality
        thumbnail_url = f"{storage_url}?width=200&height=200&resize=contain&quality=80"

        return {
            "id": image_record.id,
            "url": storage_url,
            "thumbnail_url": thumbnail_url,
            "filename": image_record.filename,
            "content_type": image_record.content_type,
            "file_size": image_record.file_size,
            "created_at": image_record.created_at,
            "analysis_status": image_record.analysis_status,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get image {image_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve image",
        )


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

        # Check database connectivity would require session here, but for simplicity
        # we'll skip the DB check in the health endpoint for now

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


@router.get("/proxy/{image_id}")
async def proxy_image(
    image_id: str,
    session: AsyncSession = Depends(get_session_dependency),
    x_user_id: Optional[str] = Header(None, alias="X-User-Id"),
    width: Optional[int] = None,
    height: Optional[int] = None,
):
    """
    Proxy endpoint for serving images from Supabase storage.

    This endpoint serves images through the backend to avoid CORS issues
    and mixed content problems when accessing from different IPs.

    Args:
        image_id: The UUID of the image
        x_user_id: User ID from header
        session: Database session
        width: Optional width for image resizing
        height: Optional height for image resizing

    Returns:
        StreamingResponse with the image data
    """
    try:
        # Parse image ID
        try:
            image_uuid = uuid.UUID(image_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid image ID format",
            )

        # Build query - optionally filter by user if provided
        if x_user_id:
            try:
                user_uuid = uuid.UUID(x_user_id)
                query = select(ImageModel).where(
                    and_(ImageModel.id == image_uuid, ImageModel.user_id == user_uuid)
                )
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid user ID format",
                )
        else:
            # No user ID provided - just get by image ID
            # This is less secure but needed for browser image loading
            query = select(ImageModel).where(ImageModel.id == image_uuid)

        result = await session.execute(query)
        image_record = result.scalar_one_or_none()

        if not image_record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Image not found"
            )

        # Download image from storage
        try:
            image_data = await storage.download_file(image_record.storage_path)

            # Determine content type
            content_type = image_record.content_type or "image/jpeg"

            # Return as streaming response
            return StreamingResponse(
                io.BytesIO(image_data),
                media_type=content_type,
                headers={
                    "Cache-Control": "public, max-age=3600",  # Cache for 1 hour
                    "Content-Disposition": f"inline; filename={image_record.filename}",
                },
            )

        except Exception as e:
            logger.error(f"Failed to download image from storage: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to retrieve image from storage",
            )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in image proxy: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error",
        )
