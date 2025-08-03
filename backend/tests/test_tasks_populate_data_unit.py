"""Unit tests specifically for populate_task_related_data function."""

import uuid
import pytest
from unittest.mock import Mock, AsyncMock, patch
from sqlalchemy.exc import SQLAlchemyError
from datetime import datetime

from app.tasks import populate_task_related_data
from app.models import TaskStatus, TaskPriority, TaskSource


class MockTaskModel:
    """Mock TaskModel for testing."""
    
    def __init__(self, id=1, title="Test Task", source_image_id=None, location_id=None, **kwargs):
        self.id = id
        self.title = title
        self.source_image_id = source_image_id
        self.location_id = location_id
        self.description = kwargs.get('description', "Test description")
        self.status = kwargs.get('status', TaskStatus.ACTIVE)
        self.priority = kwargs.get('priority', TaskPriority.MEDIUM)
        self.source = kwargs.get('source', TaskSource.MANUAL)
        self.user_id = kwargs.get('user_id', uuid.uuid4())
        self.created_at = kwargs.get('created_at', datetime.now())
        self.updated_at = kwargs.get('updated_at', datetime.now())
        self.completed = kwargs.get('completed', False)
        self.snoozed_until = kwargs.get('snoozed_until', None)
        self.task_types = kwargs.get('task_types', [])
        self.ai_confidence = kwargs.get('ai_confidence', None)
        self.ai_provider = kwargs.get('ai_provider', None)
        # Enhanced fields
        self.schedule = kwargs.get('schedule', None)
        self.show_after = kwargs.get('show_after', None)
        self.content = kwargs.get('content', None)
        self.metrics = kwargs.get('metrics', None)
        self.tags = kwargs.get('tags', None)


class MockImageModel:
    """Mock ImageModel for testing."""
    
    def __init__(self, id, storage_path):
        self.id = id
        self.storage_path = storage_path


class MockLocationModel:
    """Mock LocationModel for testing."""
    
    def __init__(self, id, name, user_id, **kwargs):
        self.id = id
        self.name = name
        self.user_id = user_id
        self.description = kwargs.get('description')
        self.is_active = kwargs.get('is_active', True)
        self.is_default = kwargs.get('is_default', False)
        self.location_metadata = kwargs.get('location_metadata')
        self.created_at = kwargs.get('created_at', datetime.now())
        self.updated_at = kwargs.get('updated_at', datetime.now())


@pytest.mark.unit
class TestPopulateTaskRelatedData:
    """Test populate_task_related_data function."""

    async def test_with_locations_success(self):
        """Test populating tasks with location data."""
        location_id = uuid.uuid4()
        user_id = uuid.uuid4()
        
        # Create tasks with location
        tasks = [
            MockTaskModel(id=1, title="Task 1", location_id=location_id, user_id=user_id),
            MockTaskModel(id=2, title="Task 2", location_id=None, user_id=user_id),
        ]
        
        # Mock location
        location = MockLocationModel(
            id=location_id,
            name="Kitchen",
            user_id=user_id,
            description="Main kitchen area"
        )
        
        # Mock session
        session = AsyncMock()
        
        # Mock location query result
        location_result = Mock()
        location_result.scalars.return_value.all.return_value = [location]
        
        # Set up execute to return location result when querying locations
        session.execute.return_value = location_result
        
        result = await populate_task_related_data(tasks, session)
        
        # Verify results
        assert len(result) == 2
        assert result[0].location is not None
        assert result[0].location.name == "Kitchen"
        assert result[0].location.description == "Main kitchen area"
        assert result[1].location is None

    async def test_location_database_error(self):
        """Test handling of location database errors."""
        location_id = uuid.uuid4()
        tasks = [MockTaskModel(id=1, title="Task 1", location_id=location_id)]
        
        # Mock session to raise error for location query
        session = AsyncMock()
        session.execute.side_effect = SQLAlchemyError("Database connection failed")
        
        with patch("app.tasks.logger") as mock_logger:
            result = await populate_task_related_data(tasks, session)
        
        # Should return tasks without location data
        assert len(result) == 1
        assert result[0].location is None
        
        # Should log the error
        mock_logger.error.assert_called()
        error_call = mock_logger.error.call_args
        assert "Failed to fetch locations from database" in error_call[0][0]

    async def test_mixed_images_and_locations(self):
        """Test tasks with both images and locations."""
        image_id = uuid.uuid4()
        location_id = uuid.uuid4()
        user_id = uuid.uuid4()
        
        tasks = [
            MockTaskModel(
                id=1,
                title="Task with both",
                source_image_id=image_id,
                location_id=location_id,
                user_id=user_id
            ),
            MockTaskModel(
                id=2,
                title="Task with image only",
                source_image_id=image_id,
                location_id=None,
                user_id=user_id
            ),
            MockTaskModel(
                id=3,
                title="Task with location only",
                source_image_id=None,
                location_id=location_id,
                user_id=user_id
            ),
        ]
        
        # Mock image and location
        image = MockImageModel(id=image_id, storage_path="path/to/image.jpg")
        location = MockLocationModel(id=location_id, name="Garden", user_id=user_id)
        
        # Mock session with different results for each query
        session = AsyncMock()
        
        # First call for images
        image_result = Mock()
        image_result.scalars.return_value = [image]
        
        # Second call for locations
        location_result = Mock()
        location_result.scalars.return_value.all.return_value = [location]
        
        session.execute.side_effect = [image_result, location_result]
        
        # Mock storage
        with patch("app.tasks.storage") as mock_storage:
            mock_storage.get_public_url.return_value = "https://storage.example.com/path/to/image.jpg"
            
            result = await populate_task_related_data(tasks, session)
        
        # Verify task with both
        assert result[0].image_url == "https://storage.example.com/path/to/image.jpg"
        assert result[0].location.name == "Garden"
        
        # Verify task with image only
        assert result[1].image_url == "https://storage.example.com/path/to/image.jpg"
        assert result[1].location is None
        
        # Verify task with location only
        assert result[2].image_url is None
        assert result[2].location.name == "Garden"

    async def test_empty_task_list(self):
        """Test with empty task list."""
        session = AsyncMock()
        result = await populate_task_related_data([], session)
        
        assert result == []
        # Should not execute any queries
        session.execute.assert_not_called()

    async def test_all_fields_populated(self):
        """Test task with all fields including enhanced fields."""
        task = MockTaskModel(
            id=1,
            title="Complete Task",
            description="Full description",
            priority=TaskPriority.HIGH,
            status=TaskStatus.ACTIVE,
            source=TaskSource.AI_GENERATED,
            source_image_id=uuid.uuid4(),
            ai_confidence=0.95,
            ai_provider="gemini",
            task_types=["maintenance", "plumbing"],
            schedule={"type": "once", "date": "2024-12-25"},
            content={"type": "checklist", "items": []},
            metrics={"effort": 5},
            tags=["urgent", "outdoor"]
        )
        
        session = AsyncMock()
        # Mock empty results for image query
        mock_result = Mock()
        mock_result.scalars.return_value = []
        session.execute.return_value = mock_result
        
        result = await populate_task_related_data([task], session)
        
        assert len(result) == 1
        assert result[0].title == "Complete Task"
        assert result[0].priority == TaskPriority.HIGH
        assert result[0].ai_confidence == 0.95
        assert result[0].tags == ["urgent", "outdoor"]