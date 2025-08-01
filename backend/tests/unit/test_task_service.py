"""Unit tests for TaskService with AI integration."""

import uuid
import pytest
from unittest.mock import AsyncMock, MagicMock
from app.services.task_service import TaskService
from app.models import AITaskCreate, TaskPriority, TaskSource
from app.database import Task as TaskModel


class TestTaskService:
    """Test cases for TaskService functionality."""

    def test_determine_priority_from_confidence_high(self):
        """Test that high confidence (>= 0.8) results in high priority."""
        assert TaskService.determine_priority_from_confidence(0.8) == TaskPriority.HIGH
        assert TaskService.determine_priority_from_confidence(0.9) == TaskPriority.HIGH
        assert TaskService.determine_priority_from_confidence(1.0) == TaskPriority.HIGH

    def test_determine_priority_from_confidence_medium(self):
        """Test that medium confidence (0.6-0.79) results in medium priority."""
        assert (
            TaskService.determine_priority_from_confidence(0.6) == TaskPriority.MEDIUM
        )
        assert (
            TaskService.determine_priority_from_confidence(0.7) == TaskPriority.MEDIUM
        )
        assert (
            TaskService.determine_priority_from_confidence(0.79) == TaskPriority.MEDIUM
        )

    def test_determine_priority_from_confidence_low(self):
        """Test that low confidence (< 0.6) results in low priority."""
        assert TaskService.determine_priority_from_confidence(0.0) == TaskPriority.LOW
        assert TaskService.determine_priority_from_confidence(0.3) == TaskPriority.LOW
        assert TaskService.determine_priority_from_confidence(0.59) == TaskPriority.LOW

    @pytest.mark.asyncio
    async def test_create_ai_tasks_single(self):
        """Test creating a single AI-generated task."""
        # Create a mock session
        mock_session = AsyncMock()
        mock_session.add = MagicMock()
        mock_session.commit = AsyncMock()
        mock_session.refresh = AsyncMock()

        # Create test task
        task = AITaskCreate(
            title="Fix leaky faucet",
            description="Kitchen faucet is dripping",
            source=TaskSource.AI_GENERATED,
            source_image_id=str(uuid.uuid4()),
            ai_confidence=0.85,
            ai_provider="gemini",
        )

        # Execute
        result = await TaskService.create_ai_tasks(mock_session, [task], uuid.uuid4())

        # Verify
        assert len(result) == 1
        assert isinstance(result[0], TaskModel)

        # Verify database calls
        mock_session.add.assert_called_once()
        mock_session.commit.assert_called_once()

        # Check the task that was added
        added_task = mock_session.add.call_args[0][0]
        assert added_task.title == "Fix leaky faucet"
        assert (
            added_task.priority == TaskPriority.HIGH
        )  # Should be high due to confidence 0.85
        assert added_task.ai_confidence == 0.85

    @pytest.mark.asyncio
    async def test_create_ai_tasks_multiple(self):
        """Test creating multiple AI-generated tasks with different confidence levels."""
        # Create a mock session
        mock_session = AsyncMock()
        mock_session.add = MagicMock()
        mock_session.commit = AsyncMock()
        mock_session.refresh = AsyncMock()

        # Create test tasks with different confidence levels
        tasks = [
            AITaskCreate(
                title="Task 1",
                description="High confidence task",
                source=TaskSource.AI_GENERATED,
                source_image_id=str(uuid.uuid4()),
                ai_confidence=0.9,
                ai_provider="gemini",
            ),
            AITaskCreate(
                title="Task 2",
                description="Medium confidence task",
                source=TaskSource.AI_GENERATED,
                source_image_id=str(uuid.uuid4()),
                ai_confidence=0.7,
                ai_provider="gemini",
            ),
            AITaskCreate(
                title="Task 3",
                description="Low confidence task",
                source=TaskSource.AI_GENERATED,
                source_image_id=str(uuid.uuid4()),
                ai_confidence=0.4,
                ai_provider="gemini",
            ),
        ]

        # Execute
        result = await TaskService.create_ai_tasks(mock_session, tasks, uuid.uuid4())

        # Verify
        assert len(result) == 3

        # Verify database calls
        assert mock_session.add.call_count == 3
        mock_session.commit.assert_called_once()

        # Check priorities set on added tasks
        added_tasks = [call[0][0] for call in mock_session.add.call_args_list]
        assert added_tasks[0].priority == TaskPriority.HIGH
        assert added_tasks[1].priority == TaskPriority.MEDIUM
        assert added_tasks[2].priority == TaskPriority.LOW

    @pytest.mark.asyncio
    async def test_create_ai_tasks_respects_explicit_priority(self):
        """Test that explicitly set priority is not overridden by confidence."""
        # Create a mock session
        mock_session = AsyncMock()
        mock_session.add = MagicMock()
        mock_session.commit = AsyncMock()
        mock_session.refresh = AsyncMock()

        # Create task with high confidence but explicit low priority
        task = AITaskCreate(
            title="Non-urgent task",
            description="High confidence but low priority",
            priority=TaskPriority.LOW,  # Explicitly set
            source=TaskSource.AI_GENERATED,
            source_image_id=str(uuid.uuid4()),
            ai_confidence=0.9,  # High confidence
            ai_provider="gemini",
        )

        # Execute
        await TaskService.create_ai_tasks(mock_session, [task], uuid.uuid4())

        # Verify the explicit priority was kept
        added_task = mock_session.add.call_args[0][0]
        assert added_task.priority == TaskPriority.LOW

    @pytest.mark.asyncio
    async def test_create_single_ai_task(self):
        """Test the convenience method for creating a single task."""
        # Create a mock session
        mock_session = AsyncMock()
        mock_session.add = MagicMock()
        mock_session.commit = AsyncMock()
        mock_session.refresh = AsyncMock()

        task = AITaskCreate(
            title="Single task",
            description="Test single task creation",
            source=TaskSource.AI_GENERATED,
            source_image_id=str(uuid.uuid4()),
            ai_confidence=0.75,
            ai_provider="gemini",
        )

        result = await TaskService.create_single_ai_task(
            mock_session, task, uuid.uuid4()
        )

        assert result is not None
        assert isinstance(result, TaskModel)

        # Should have added exactly one task
        mock_session.add.assert_called_once()
        added_task = mock_session.add.call_args[0][0]
        assert added_task.title == "Single task"
        assert added_task.priority == TaskPriority.MEDIUM  # 0.75 confidence = medium
