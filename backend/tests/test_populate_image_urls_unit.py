"""Unit tests for populate_task_image_urls function."""

import pytest
import uuid
from unittest.mock import Mock, AsyncMock, patch
from sqlalchemy.exc import SQLAlchemyError
from datetime import datetime

from app.tasks import populate_task_image_urls
from app.models import Task, TaskStatus, TaskPriority, TaskSource


class MockTaskModel:
    """Mock TaskModel for testing."""

    def __init__(self, id=None, title="Test Task", source_image_id=None):
        self.id = id if id is not None else 1
        self.title = title
        self.source_image_id = source_image_id
        self.description = "Test description"
        self.status = TaskStatus.ACTIVE
        self.priority = TaskPriority.MEDIUM
        self.source = TaskSource.MANUAL
        self.user_id = uuid.uuid4()
        self.created_at = datetime.now()
        self.updated_at = datetime.now()
        self.due_date = None
        self.completed_at = None
        self.deleted_at = None
        self.archived_at = None
        self.snoozed_until = None
        self.task_types = []
        self.content = None
        self.schedule = None


class MockImageModel:
    """Mock ImageModel for testing."""

    def __init__(self, id, storage_path):
        self.id = id
        self.storage_path = storage_path


@pytest.mark.unit
async def test_populate_task_image_urls_no_images():
    """Test populate_task_image_urls with tasks that have no images."""
    # Create tasks without image IDs
    tasks = [MockTaskModel(id=1, title="Task 1"), MockTaskModel(id=2, title="Task 2")]

    session = AsyncMock()

    result = await populate_task_image_urls(tasks, session)

    # Should return tasks without any image URLs
    assert len(result) == 2
    assert all(isinstance(task, Task) for task in result)
    assert all(task.image_url is None for task in result)
    assert all(task.thumbnail_url is None for task in result)

    # Should not execute any database queries
    session.execute.assert_not_called()


@pytest.mark.unit
async def test_populate_task_image_urls_with_images():
    """Test populate_task_image_urls with tasks that have images."""
    image_id1 = uuid.uuid4()
    image_id2 = uuid.uuid4()

    # Create tasks with image IDs
    tasks = [
        MockTaskModel(id=1, title="Task 1", source_image_id=image_id1),
        MockTaskModel(id=2, title="Task 2", source_image_id=image_id2),
        MockTaskModel(id=3, title="Task 3"),  # No image
    ]

    # Mock images
    images = [
        MockImageModel(id=image_id1, storage_path="path/to/image1.jpg"),
        MockImageModel(id=image_id2, storage_path="path/to/image2.jpg"),
    ]

    # Mock session
    session = AsyncMock()
    mock_result = Mock()
    mock_result.scalars.return_value = images
    session.execute.return_value = mock_result

    # No need to mock storage anymore - the function uses proxy URLs
    result = await populate_task_image_urls(tasks, session)

    # Verify results
    assert len(result) == 3
    assert result[0].image_url == f"/api/images/proxy/{image_id1}"
    assert result[0].thumbnail_url == f"/api/images/proxy/{image_id1}"
    assert result[1].image_url == f"/api/images/proxy/{image_id2}"
    assert result[1].thumbnail_url == f"/api/images/proxy/{image_id2}"
    assert result[2].image_url is None
    assert result[2].thumbnail_url is None


@pytest.mark.unit
async def test_populate_task_image_urls_database_error():
    """Test populate_task_image_urls handles database errors gracefully."""
    image_id = uuid.uuid4()
    tasks = [MockTaskModel(id=1, title="Task 1", source_image_id=image_id)]

    # Mock session to raise an error
    session = AsyncMock()
    session.execute.side_effect = SQLAlchemyError("Database connection failed")

    with patch("app.tasks.logger") as mock_logger:
        result = await populate_task_image_urls(tasks, session)

    # Should return tasks without URLs
    assert len(result) == 1
    assert result[0].image_url is None
    assert result[0].thumbnail_url is None

    # Should log the error
    mock_logger.error.assert_called_once()
    error_call = mock_logger.error.call_args
    assert "Failed to fetch images from database" in error_call[0][0]
    assert error_call[1]["error_type"] == "SQLAlchemyError"


@pytest.mark.unit
async def test_populate_task_image_urls_storage_error():
    """Test populate_task_image_urls handles storage errors gracefully."""
    image_id = uuid.uuid4()
    tasks = [MockTaskModel(id=1, title="Task 1", source_image_id=image_id)]

    # Mock successful database query
    images = [MockImageModel(id=image_id, storage_path="path/to/image.jpg")]
    session = AsyncMock()
    mock_result = Mock()
    mock_result.scalars.return_value = images
    session.execute.return_value = mock_result

    # The current implementation uses proxy URLs which don't raise exceptions
    # It should always generate the proxy URL successfully
    result = await populate_task_image_urls(tasks, session)

    # Should return task with proxy URLs (no storage errors anymore)
    assert len(result) == 1
    assert result[0].image_url == f"/api/images/proxy/{image_id}"
    assert result[0].thumbnail_url == f"/api/images/proxy/{image_id}"


@pytest.mark.unit
async def test_populate_task_image_urls_caching():
    """Test that URL caching works correctly for duplicate storage paths."""
    image_id1 = uuid.uuid4()
    image_id2 = uuid.uuid4()
    shared_path = "path/to/shared_image.jpg"

    # Create tasks with images that share the same storage path
    tasks = [
        MockTaskModel(id=1, title="Task 1", source_image_id=image_id1),
        MockTaskModel(id=2, title="Task 2", source_image_id=image_id2),
    ]

    # Mock images with same storage path
    images = [
        MockImageModel(id=image_id1, storage_path=shared_path),
        MockImageModel(id=image_id2, storage_path=shared_path),
    ]

    # Mock session
    session = AsyncMock()
    mock_result = Mock()
    mock_result.scalars.return_value = images
    session.execute.return_value = mock_result

    # No need to mock storage anymore - the function uses proxy URLs
    result = await populate_task_image_urls(tasks, session)

    # Verify both tasks have their own proxy URLs (based on image ID, not storage path)
    assert result[0].image_url == f"/api/images/proxy/{image_id1}"
    assert result[1].image_url == f"/api/images/proxy/{image_id2}"
