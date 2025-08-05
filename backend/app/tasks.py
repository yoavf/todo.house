from fastapi import APIRouter, HTTPException, Header, Query, Depends
from typing import List, Optional, Sequence, Dict
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.exc import SQLAlchemyError
from .models import (
    Task,
    TaskCreate,
    TaskUpdate,
    TaskStatus,
    SnoozeRequest,
    AITaskCreate,
    TaskSource,
    Location,
)
from .database import get_session_dependency, Task as TaskModel, Image as ImageModel
from .database.models import Location as LocationModel
from .services.task_service import TaskService
from .services.snooze_service import SnoozeService, SnoozeOption
from .logging_config import StructuredLogger
from .locale_detection import detect_locale_from_header

router = APIRouter(prefix="/api/tasks", tags=["tasks"])
logger = StructuredLogger(__name__)


def get_user_uuid(user_id: str = Header(..., alias="x-user-id")) -> uuid.UUID:
    """Convert user_id header to UUID"""
    try:
        return uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID format")


async def populate_task_related_data(
    tasks: Sequence[TaskModel], session: AsyncSession, locale_str: str = "en_US"
) -> List[Task]:
    """
    Populate image URLs, snooze options, and location data for tasks.

    This function:
    1. Fetches all unique images and locations in single database queries for performance
    2. Caches storage URLs to avoid duplicate API calls
    3. Calculates snooze options based on locale
    4. Handles database and storage errors gracefully

    Args:
        tasks: List of task models from database
        session: Database session
        locale_str: Locale string for calculating snooze options

    Returns:
        List of Task models with populated image URLs, snooze options, and location data.
        Tasks without images/locations or with errors will be returned without those fields.

    Error Handling:
        - Database query failures: Logs error and returns tasks without extra data
        - Storage URL generation failures: Logs warning and skips URL for that task
        - Individual task failures don't affect other tasks
    """
    # Get all unique image IDs
    image_ids = [task.source_image_id for task in tasks if task.source_image_id]

    # Get all unique location IDs
    location_ids = [task.location_id for task in tasks if task.location_id]

    # Fetch all images in one query with error handling
    images: Dict[uuid.UUID, ImageModel] = {}
    if image_ids:
        try:
            query = select(ImageModel).where(ImageModel.id.in_(image_ids))
            result = await session.execute(query)
            images = {img.id: img for img in result.scalars()}
        except SQLAlchemyError as e:
            logger.error(
                "Failed to fetch images from database",
                error_type=type(e).__name__,
                error_message=str(e),
                image_count=len(image_ids),
                task_count=len(tasks),
            )

    # Fetch all locations in one query with error handling
    locations: Dict[uuid.UUID, LocationModel] = {}
    if location_ids:
        try:
            location_query = select(LocationModel).where(
                LocationModel.id.in_(location_ids)
            )
            location_result = await session.execute(location_query)
            locations = {loc.id: loc for loc in location_result.scalars().all()}
        except SQLAlchemyError as e:
            logger.error(
                "Failed to fetch locations from database",
                error_type=type(e).__name__,
                error_message=str(e),
                location_count=len(location_ids),
                task_count=len(tasks),
            )

    # Cache for storage URLs to avoid duplicate calls

    # Calculate snooze options once for all tasks
    snooze_options = SnoozeService.calculate_snooze_options(locale_str=locale_str)
    # Convert datetime objects to ISO strings for JSON serialization
    serializable_snooze_options = {}
    for option, data in snooze_options.items():
        serializable_snooze_options[option.value] = {
            "date": data["date"].isoformat(),
            "label": data["label"],
            "description": data["description"],
        }

    # Convert tasks and populate image URLs, location data, and snooze options
    task_models = []
    for task in tasks:
        task_dict = Task.model_validate(task).model_dump()

        # Populate image URLs if available
        if task.source_image_id and task.source_image_id in images:
            image = images[task.source_image_id]

            # Use proxy endpoint instead of direct Supabase URL
            try:
                proxy_url = f"/api/images/proxy/{image.id}"
                task_dict["image_url"] = proxy_url
                task_dict["thumbnail_url"] = proxy_url

            except Exception as e:
                # Log error but don't fail the entire operation
                logger.warning(
                    "Failed to generate storage URL for image",
                    error_type=type(e).__name__,
                    error_message=str(e),
                    image_id=str(image.id),
                    storage_path=image.storage_path,
                    task_id=str(task.id),
                )
                # Task will be returned without image URLs

        # Populate location data if available
        if task.location_id and task.location_id in locations:
            task_dict["location"] = Location.model_validate(locations[task.location_id])

        # Add snooze options to all tasks
        task_dict["snooze_options"] = serializable_snooze_options

        task_models.append(Task(**task_dict))

    return task_models


# For now, we'll use a header for user_id (we'll add proper auth later)
@router.get("/", response_model=List[Task])
async def get_tasks(
    user_uuid: uuid.UUID = Depends(get_user_uuid),
    status: Optional[TaskStatus] = Query(None, description="Filter by status"),
    source: Optional[TaskSource] = Query(
        None, description="Filter by source (manual or ai_generated)"
    ),
    accept_language: Optional[str] = Header(None, alias="accept-language"),
    session: AsyncSession = Depends(get_session_dependency),
):
    # Detect locale from Accept-Language header
    detected_locale = detect_locale_from_header(accept_language)
    
    # Build query conditions
    conditions = [TaskModel.user_id == user_uuid]

    if status:
        conditions.append(TaskModel.status == status)

    if source:
        conditions.append(TaskModel.source == source)

    # Execute query
    query = select(TaskModel).where(and_(*conditions))
    result = await session.execute(query)
    tasks = result.scalars().all()

    # Log locale information for monitoring
    logger.info(
        f"Tasks request - User: {user_uuid}, Locale: {detected_locale}, "
        f"Accept-Language: {accept_language}, Tasks count: {len(tasks)}"
    )

    # Populate image URLs, location data, and snooze options
    # Convert locale to locale_str format expected by snooze service
    locale_str = f"{detected_locale}_US" if detected_locale == "en" else f"{detected_locale}_IL"
    return await populate_task_related_data(tasks, session, locale_str)


@router.get("/active", response_model=List[Task])
async def get_active_tasks(
    user_uuid: uuid.UUID = Depends(get_user_uuid),
    accept_language: Optional[str] = Header(None, alias="accept-language"),
    session: AsyncSession = Depends(get_session_dependency),
):
    # Detect locale from Accept-Language header
    detected_locale = detect_locale_from_header(accept_language)
    
    query = select(TaskModel).where(
        and_(TaskModel.user_id == user_uuid, TaskModel.status == TaskStatus.ACTIVE)
    )
    result = await session.execute(query)
    tasks = result.scalars().all()
    
    # Log locale information for monitoring
    logger.info(
        f"Active tasks request - User: {user_uuid}, Locale: {detected_locale}, "
        f"Accept-Language: {accept_language}, Tasks count: {len(tasks)}"
    )
    
    # Convert locale to locale_str format expected by snooze service
    locale_str = f"{detected_locale}_US" if detected_locale == "en" else f"{detected_locale}_IL"
    return await populate_task_related_data(tasks, session, locale_str)


@router.get("/snoozed", response_model=List[Task])
async def get_snoozed_tasks(
    user_uuid: uuid.UUID = Depends(get_user_uuid),
    accept_language: Optional[str] = Header(None, alias="accept-language"),
    session: AsyncSession = Depends(get_session_dependency),
):
    # Detect locale from Accept-Language header
    detected_locale = detect_locale_from_header(accept_language)
    
    query = select(TaskModel).where(
        and_(TaskModel.user_id == user_uuid, TaskModel.status == TaskStatus.SNOOZED)
    )
    result = await session.execute(query)
    tasks = result.scalars().all()
    
    # Log locale information for monitoring
    logger.info(
        f"Snoozed tasks request - User: {user_uuid}, Locale: {detected_locale}, "
        f"Accept-Language: {accept_language}, Tasks count: {len(tasks)}"
    )
    
    # Convert locale to locale_str format expected by snooze service
    locale_str = f"{detected_locale}_US" if detected_locale == "en" else f"{detected_locale}_IL"
    return await populate_task_related_data(tasks, session, locale_str)


@router.post("/", response_model=Task)
async def create_task(
    task: TaskCreate,
    user_uuid: uuid.UUID = Depends(get_user_uuid),
    session: AsyncSession = Depends(get_session_dependency),
):
    # Convert task_types enum list to string list for JSONB storage
    task_types_str = []
    if task.task_types:
        task_types_str = [tt.value for tt in task.task_types]

    # Create new task instance
    db_task = TaskModel(
        user_id=user_uuid,
        title=task.title,
        description=task.description,
        priority=task.priority,
        completed=task.completed,
        status=task.status,
        snoozed_until=task.snoozed_until,
        source=task.source,
        source_image_id=task.source_image_id,
        ai_confidence=task.ai_confidence,
        ai_provider=task.ai_provider,
        task_types=task_types_str,
        location_id=task.location_id,
        # Enhanced fields
        schedule=task.schedule,  # Will be a dict due to the validator
        show_after=task.show_after,
        content=task.content,  # Will be a dict due to the validator
        metrics=task.metrics,
        tags=task.tags,
    )

    session.add(db_task)
    await session.commit()
    await session.refresh(db_task)

    # Populate related data before returning
    tasks_with_data = await populate_task_related_data([db_task], session)
    return tasks_with_data[0]


@router.get("/{task_id}", response_model=Task)
async def get_task(
    task_id: int,
    user_uuid: uuid.UUID = Depends(get_user_uuid),
    accept_language: Optional[str] = Header(None, alias="accept-language"),
    session: AsyncSession = Depends(get_session_dependency),
):
    # Detect locale from Accept-Language header
    detected_locale = detect_locale_from_header(accept_language)
    
    query = select(TaskModel).where(
        and_(TaskModel.id == task_id, TaskModel.user_id == user_uuid)
    )
    result = await session.execute(query)
    task = result.scalar_one_or_none()

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Log locale information for monitoring
    logger.info(
        f"Single task request - User: {user_uuid}, Task: {task_id}, "
        f"Locale: {detected_locale}, Accept-Language: {accept_language}"
    )

    # Populate image URLs, location data, and snooze options for single task
    # Convert locale to locale_str format expected by snooze service
    locale_str = f"{detected_locale}_US" if detected_locale == "en" else f"{detected_locale}_IL"
    tasks_with_data = await populate_task_related_data([task], session, locale_str)
    return tasks_with_data[0]


@router.put("/{task_id}", response_model=Task)
async def update_task(
    task_id: int,
    task: TaskUpdate,
    user_uuid: uuid.UUID = Depends(get_user_uuid),
    session: AsyncSession = Depends(get_session_dependency),
):
    # Get existing task
    query = select(TaskModel).where(
        and_(TaskModel.id == task_id, TaskModel.user_id == user_uuid)
    )
    result = await session.execute(query)
    db_task = result.scalar_one_or_none()

    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Update fields
    task_data = task.model_dump(exclude_unset=True)

    for field, value in task_data.items():
        if field == "task_types" and value is not None:
            # Convert task_types enum list to string list for JSONB storage
            setattr(db_task, field, [tt.value for tt in value])
        elif field == "completed" and value is not None:
            # Handle status transitions
            setattr(db_task, field, value)
            if value:
                db_task.status = TaskStatus.COMPLETED
            else:
                db_task.status = TaskStatus.ACTIVE
                db_task.snoozed_until = None
        else:
            setattr(db_task, field, value)

    await session.commit()
    await session.refresh(db_task)

    # Populate related data before returning
    tasks_with_data = await populate_task_related_data([db_task], session)
    return tasks_with_data[0]


@router.delete("/{task_id}")
async def delete_task(
    task_id: int,
    user_uuid: uuid.UUID = Depends(get_user_uuid),
    session: AsyncSession = Depends(get_session_dependency),
):
    # Get existing task
    query = select(TaskModel).where(
        and_(TaskModel.id == task_id, TaskModel.user_id == user_uuid)
    )
    result = await session.execute(query)
    db_task = result.scalar_one_or_none()

    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")

    await session.delete(db_task)
    await session.commit()
    return {"message": "Task deleted successfully"}


@router.post("/{task_id}/snooze", response_model=Task)
async def snooze_task(
    task_id: int,
    snooze_request: SnoozeRequest,
    user_uuid: uuid.UUID = Depends(get_user_uuid),
    accept_language: Optional[str] = Header(None, alias="accept-language"),
    session: AsyncSession = Depends(get_session_dependency),
):
    # Detect locale from Accept-Language header
    detected_locale = detect_locale_from_header(accept_language)
    locale_str = f"{detected_locale}_US" if detected_locale == "en" else f"{detected_locale}_IL"
    
    # Get existing task
    query = select(TaskModel).where(
        and_(TaskModel.id == task_id, TaskModel.user_id == user_uuid)
    )
    result = await session.execute(query)
    db_task = result.scalar_one_or_none()

    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Determine snooze_until date
    if snooze_request.snooze_option:
        # Use predefined snooze option
        try:
            option = SnoozeOption(snooze_request.snooze_option)
            snooze_until = SnoozeService.get_snooze_date_by_option(
                option, locale_str=locale_str
            )
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid snooze option")
    elif snooze_request.snooze_until:
        # Use explicit date
        snooze_until = snooze_request.snooze_until
    else:
        # If no date provided, snooze indefinitely
        snooze_until = SnoozeService.get_snooze_date_by_option(
            SnoozeOption.LATER, locale_str=locale_str
        )

    # Log locale information for monitoring
    logger.info(
        f"Snooze task request - User: {user_uuid}, Task: {task_id}, "
        f"Locale: {detected_locale}, Accept-Language: {accept_language}, "
        f"Snooze until: {snooze_until}"
    )

    db_task.status = TaskStatus.SNOOZED
    db_task.snoozed_until = snooze_until

    await session.commit()
    await session.refresh(db_task)

    # Populate related data before returning
    tasks_with_data = await populate_task_related_data([db_task], session, locale_str)
    return tasks_with_data[0]


@router.post("/{task_id}/unsnooze", response_model=Task)
async def unsnooze_task(
    task_id: int,
    user_uuid: uuid.UUID = Depends(get_user_uuid),
    session: AsyncSession = Depends(get_session_dependency),
):
    # Get existing task
    query = select(TaskModel).where(
        and_(TaskModel.id == task_id, TaskModel.user_id == user_uuid)
    )
    result = await session.execute(query)
    db_task = result.scalar_one_or_none()

    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")

    db_task.status = TaskStatus.ACTIVE
    db_task.snoozed_until = None

    await session.commit()
    await session.refresh(db_task)

    # Populate related data before returning
    tasks_with_data = await populate_task_related_data([db_task], session)
    return tasks_with_data[0]


@router.post("/ai-generated", response_model=Task)
async def create_ai_task(
    task: AITaskCreate,
    user_uuid: uuid.UUID = Depends(get_user_uuid),
    session: AsyncSession = Depends(get_session_dependency),
):
    """Create a task from AI image analysis with automatic priority based on confidence"""
    created_task = await TaskService.create_single_ai_task(session, task, user_uuid)
    if not created_task:
        raise HTTPException(status_code=500, detail="Failed to create AI task")
    return created_task


@router.get("/ai-generated/with-images", response_model=List[Task])
async def get_ai_tasks_with_images(
    user_uuid: uuid.UUID = Depends(get_user_uuid),
    session: AsyncSession = Depends(get_session_dependency),
):
    """Get all AI-generated tasks with their source image details"""
    # Note: For now, return tasks without image joins
    # TODO: Add proper join with Image model when needed
    query = select(TaskModel).where(
        and_(
            TaskModel.user_id == user_uuid, TaskModel.source == TaskSource.AI_GENERATED
        )
    )
    result = await session.execute(query)
    tasks = result.scalars().all()
    return tasks
