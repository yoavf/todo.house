from fastapi import APIRouter, HTTPException, Header, Query, Depends
from typing import List, Optional, Sequence
from datetime import datetime
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from .models import (
    Task,
    TaskCreate,
    TaskUpdate,
    TaskStatus,
    SnoozeRequest,
    AITaskCreate,
    TaskSource,
)
from .database import get_session_dependency, Task as TaskModel, Image as ImageModel
from .services.task_service import TaskService
from .storage import storage

router = APIRouter(prefix="/api/tasks", tags=["tasks"])


def get_user_uuid(user_id: str = Header(..., alias="x-user-id")) -> uuid.UUID:
    """Convert user_id header to UUID"""
    try:
        return uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID format")


async def populate_task_image_urls(
    tasks: Sequence[TaskModel], session: AsyncSession
) -> List[Task]:
    """
    Populate image URLs for tasks that have source_image_id.

    Args:
        tasks: List of task models from database
        session: Database session

    Returns:
        List of Task models with populated image URLs
    """
    # Get all unique image IDs
    image_ids = [task.source_image_id for task in tasks if task.source_image_id]

    if not image_ids:
        # No images to fetch, return tasks as-is
        return [Task.model_validate(task) for task in tasks]

    # Fetch all images in one query
    query = select(ImageModel).where(ImageModel.id.in_(image_ids))
    result = await session.execute(query)
    images = {img.id: img for img in result.scalars()}

    # Convert tasks and populate image URLs
    task_models = []
    for task in tasks:
        task_dict = Task.model_validate(task).model_dump()

        if task.source_image_id and task.source_image_id in images:
            image = images[task.source_image_id]
            # Get public URLs from storage
            task_dict["image_url"] = storage.get_public_url(image.storage_path)
            # For now, use the same URL for thumbnail (could be optimized later)
            task_dict["thumbnail_url"] = storage.get_public_url(image.storage_path)

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
    session: AsyncSession = Depends(get_session_dependency),
):
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

    # Populate image URLs
    return await populate_task_image_urls(tasks, session)


@router.get("/active", response_model=List[Task])
async def get_active_tasks(
    user_uuid: uuid.UUID = Depends(get_user_uuid),
    session: AsyncSession = Depends(get_session_dependency),
):
    query = select(TaskModel).where(
        and_(TaskModel.user_id == user_uuid, TaskModel.status == TaskStatus.ACTIVE)
    )
    result = await session.execute(query)
    tasks = result.scalars().all()
    return await populate_task_image_urls(tasks, session)


@router.get("/snoozed", response_model=List[Task])
async def get_snoozed_tasks(
    user_uuid: uuid.UUID = Depends(get_user_uuid),
    session: AsyncSession = Depends(get_session_dependency),
):
    query = select(TaskModel).where(
        and_(TaskModel.user_id == user_uuid, TaskModel.status == TaskStatus.SNOOZED)
    )
    result = await session.execute(query)
    tasks = result.scalars().all()
    return await populate_task_image_urls(tasks, session)


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
    return db_task


@router.get("/{task_id}", response_model=Task)
async def get_task(
    task_id: int,
    user_uuid: uuid.UUID = Depends(get_user_uuid),
    session: AsyncSession = Depends(get_session_dependency),
):
    query = select(TaskModel).where(
        and_(TaskModel.id == task_id, TaskModel.user_id == user_uuid)
    )
    result = await session.execute(query)
    task = result.scalar_one_or_none()

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Populate image URLs for single task
    tasks_with_urls = await populate_task_image_urls([task], session)
    return tasks_with_urls[0]


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
    return db_task


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

    # If no date provided, snooze indefinitely (year 9999)
    snooze_until = snooze_request.snooze_until or datetime.max

    db_task.status = TaskStatus.SNOOZED
    db_task.snoozed_until = snooze_until

    await session.commit()
    await session.refresh(db_task)
    return db_task


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
    return db_task


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
