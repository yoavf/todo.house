import pytest
from datetime import datetime, timezone, timedelta
from pydantic import ValidationError

from app.models import TaskStatus, TaskBase, TaskCreate, TaskUpdate, Task, SnoozeRequest


class TestTaskStatus:
    """Test the TaskStatus enum."""
    
    @pytest.mark.unit
    def test_task_status_values(self):
        """Test that TaskStatus has the correct values."""
        assert TaskStatus.ACTIVE.value == "active"
        assert TaskStatus.SNOOZED.value == "snoozed"
        assert TaskStatus.COMPLETED.value == "completed"
    
    @pytest.mark.unit
    def test_task_status_members(self):
        """Test that all expected status members exist."""
        assert hasattr(TaskStatus, "ACTIVE")
        assert hasattr(TaskStatus, "SNOOZED")
        assert hasattr(TaskStatus, "COMPLETED")


class TestTaskBase:
    """Test the TaskBase Pydantic model."""
    
    @pytest.mark.unit
    def test_task_base_valid(self):
        """Test creating a valid TaskBase instance."""
        task = TaskBase(
            title="Test Task",
            description="A test description",
            completed=False,
            status=TaskStatus.ACTIVE,
            snoozed_until=None
        )
        assert task.title == "Test Task"
        assert task.description == "A test description"
        assert task.completed is False
        assert task.status == TaskStatus.ACTIVE
        assert task.snoozed_until is None
    
    @pytest.mark.unit
    def test_task_base_minimal(self):
        """Test creating TaskBase with only required fields."""
        task = TaskBase(title="Minimal Task")
        assert task.title == "Minimal Task"
        assert task.description is None
        assert task.completed is False
        assert task.status == TaskStatus.ACTIVE
        assert task.snoozed_until is None
    
    @pytest.mark.unit
    def test_task_base_invalid_title(self):
        """Test that empty title raises validation error."""
        with pytest.raises(ValidationError) as exc_info:
            TaskBase(title="")
        assert "String should have at least 1 character" in str(exc_info.value)
    
    @pytest.mark.unit
    def test_task_base_title_too_long(self):
        """Test that title over 200 chars raises validation error."""
        with pytest.raises(ValidationError):
            TaskBase(title="x" * 201)
    
    @pytest.mark.unit
    def test_task_base_description_too_long(self):
        """Test that description over 1000 chars raises validation error."""
        with pytest.raises(ValidationError):
            TaskBase(title="Test", description="x" * 1001)


class TestTaskCreate:
    """Test the TaskCreate Pydantic model."""
    
    @pytest.mark.unit
    def test_task_create_inherits_from_base(self):
        """Test that TaskCreate properly inherits from TaskBase."""
        task = TaskCreate(
            title="Create Task",
            description="Testing creation",
            completed=True
        )
        assert task.title == "Create Task"
        assert task.description == "Testing creation"
        assert task.completed is True
        assert task.status == TaskStatus.ACTIVE


class TestTaskUpdate:
    """Test the TaskUpdate Pydantic model."""
    
    @pytest.mark.unit
    def test_task_update_all_fields_optional(self):
        """Test that all fields in TaskUpdate are optional."""
        task_update = TaskUpdate()
        assert task_update.title is None
        assert task_update.description is None
        assert task_update.completed is None
        assert task_update.status is None
        assert task_update.snoozed_until is None
    
    @pytest.mark.unit
    def test_task_update_partial(self):
        """Test updating only some fields."""
        task_update = TaskUpdate(
            title="Updated Title",
            completed=True
        )
        assert task_update.title == "Updated Title"
        assert task_update.completed is True
        assert task_update.description is None


class TestTask:
    """Test the complete Task Pydantic model."""
    
    @pytest.mark.unit
    def test_task_complete_model(self):
        """Test creating a complete Task instance."""
        now = datetime.now(timezone.utc)
        task = Task(
            id=1,
            user_id="user-123",
            title="Complete Task",
            description="A complete task with all fields",
            completed=False,
            status=TaskStatus.ACTIVE,
            created_at=now,
            updated_at=now,
            snoozed_until=None
        )
        assert task.id == 1
        assert task.user_id == "user-123"
        assert task.title == "Complete Task"
        assert task.completed is False
        assert task.created_at == now
        assert task.updated_at == now
        assert task.snoozed_until is None
    
    @pytest.mark.unit
    def test_task_with_snooze(self):
        """Test Task with snoozed_until field."""
        now = datetime.now(timezone.utc)
        snooze_time = now + timedelta(days=30)
        task = Task(
            id=2,
            user_id="user-123",
            title="Snoozed Task",
            completed=False,
            status=TaskStatus.SNOOZED,
            created_at=now,
            updated_at=now,
            snoozed_until=snooze_time
        )
        assert task.status == TaskStatus.SNOOZED
        assert task.snoozed_until == snooze_time


class TestSnoozeRequest:
    """Test the SnoozeRequest Pydantic model."""
    
    @pytest.mark.unit
    def test_snooze_request_valid(self):
        """Test creating a valid SnoozeRequest."""
        snooze_time = datetime.now(timezone.utc) + timedelta(days=30)
        request = SnoozeRequest(snooze_until=snooze_time)
        assert request.snooze_until == snooze_time
    
    @pytest.mark.unit
    def test_snooze_request_optional_field(self):
        """Test that snooze_until is optional."""
        request = SnoozeRequest()
        assert request.snooze_until is None