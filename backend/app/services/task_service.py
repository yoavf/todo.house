from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from ..models import TaskPriority, AITaskCreate
from ..database import Task as TaskModel


class TaskService:
    """Service for handling task creation and management logic"""

    @staticmethod
    def determine_priority_from_confidence(confidence: float) -> TaskPriority:
        """
        Determine task priority based on AI confidence score.

        Higher confidence scores indicate more certain/urgent issues:
        - >= 0.8: High priority (very confident about the issue)
        - >= 0.6: Medium priority (moderately confident)
        - < 0.6: Low priority (less certain, needs verification)
        """
        if confidence >= 0.8:
            return TaskPriority.HIGH
        elif confidence >= 0.6:
            return TaskPriority.MEDIUM
        else:
            return TaskPriority.LOW

    @staticmethod
    async def create_ai_tasks(
        session: AsyncSession, tasks: List[AITaskCreate], user_id: str
    ) -> List[TaskModel]:
        """
        Create multiple AI-generated tasks with automatic prioritization.

        Args:
            session: Database session
            tasks: List of AI task creation models
            user_id: User ID to assign tasks to

        Returns:
            List of created task ORM instances
        """
        created_tasks = []

        for task in tasks:
            # Convert task_types enum list to string list for JSONB storage
            task_types_str = []
            if task.task_types:
                task_types_str = [tt.value for tt in task.task_types]

            # Override priority based on AI confidence if not already set
            priority = task.priority
            if task.priority == TaskPriority.MEDIUM:  # Default value
                priority = TaskService.determine_priority_from_confidence(
                    task.ai_confidence
                )

            # Create SQLAlchemy model instance
            db_task = TaskModel(
                user_id=user_id,
                title=task.title,
                description=task.description,
                priority=priority,
                completed=task.completed,
                status=task.status,
                snoozed_until=task.snoozed_until,
                source=task.source,
                source_image_id=task.source_image_id,
                ai_confidence=task.ai_confidence,
                ai_provider=task.ai_provider,
                task_types=task_types_str,
            )

            session.add(db_task)
            created_tasks.append(db_task)

        # Commit all tasks at once
        await session.commit()
        
        # Refresh to get IDs and timestamps
        for db_task in created_tasks:
            await session.refresh(db_task)

        return created_tasks

    @staticmethod
    async def create_single_ai_task(
        session: AsyncSession, task: AITaskCreate, user_id: str
    ) -> Optional[TaskModel]:
        """
        Create a single AI-generated task with automatic prioritization.

        Args:
            session: Database session
            task: AI task creation model
            user_id: User ID to assign task to

        Returns:
            Created task ORM instance
        """
        results = await TaskService.create_ai_tasks(session, [task], user_id)
        return results[0] if results else None
