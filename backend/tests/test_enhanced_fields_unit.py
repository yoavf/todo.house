"""Unit tests for enhanced task fields (schedule, content, etc.)."""

from datetime import datetime, timezone
import pytest
from app.models import (
    TaskCreate,
    TaskUpdate,
    TaskPriority,
    TaskSource,
    OnceSchedule,
    RecurringSchedule,
    RecurringPattern,
    ScheduleType,
    HowToContent,
    ChecklistContent,
    ChecklistItem,
    ShoppingListContent,
    ShoppingListItem,
    ContentType,
)


@pytest.mark.unit
def test_schedule_serialization_for_storage():
    """Test that schedule fields are properly serialized to dict for database storage."""
    # Create a task with OnceSchedule
    once_schedule = OnceSchedule(
        type=ScheduleType.ONCE,
        date=datetime(2025, 8, 15, 10, 0, 0, tzinfo=timezone.utc)
    )
    
    task = TaskCreate(
        title="Test Task with Schedule",
        description="Testing schedule serialization",
        priority=TaskPriority.MEDIUM,
        schedule=once_schedule,
        source=TaskSource.MANUAL,
    )
    
    # The validator should convert it to dict for storage
    assert isinstance(task.schedule, dict)
    assert task.schedule["type"] == ScheduleType.ONCE.value
    assert "date" in task.schedule
    
    # Test that TaskUpdate also serializes properly
    task_update = TaskUpdate(
        schedule=OnceSchedule(
            type=ScheduleType.ONCE,
            date=datetime(2025, 9, 1, 10, 0, 0, tzinfo=timezone.utc)
        )
    )
    
    assert isinstance(task_update.schedule, dict)
    assert task_update.schedule["type"] == ScheduleType.ONCE.value


@pytest.mark.unit
def test_recurring_schedule_serialization():
    """Test recurring schedule serialization for database storage."""
    recurring_schedule = RecurringSchedule(
        type=ScheduleType.RECURRING,
        pattern=RecurringPattern.INTERVAL,
        interval_days=7,
        next_occurrence=datetime(2025, 8, 10, 10, 0, 0, tzinfo=timezone.utc)
    )
    
    task = TaskCreate(
        title="Weekly Task",
        description="Recurring every week",
        schedule=recurring_schedule,
        source=TaskSource.MANUAL,
    )
    
    # Should be converted to dict
    assert isinstance(task.schedule, dict)
    assert task.schedule["type"] == ScheduleType.RECURRING.value
    assert task.schedule["pattern"] == RecurringPattern.INTERVAL.value
    assert task.schedule["interval_days"] == 7


@pytest.mark.unit
def test_content_serialization_for_storage():
    """Test that content fields are properly serialized for database storage."""
    # Test HowToContent
    how_to_content = HowToContent(
        type=ContentType.HOW_TO_GUIDE,
        markdown="# How to do something",
        images=[{"url": "https://example.com/img.jpg", "caption": "Example"}],
        videos=[{"url": "https://youtube.com/watch", "title": "Tutorial"}],
    )
    
    task = TaskCreate(
        title="How-to Task",
        description="Task with how-to content",
        content=how_to_content,
        source=TaskSource.MANUAL,
    )
    
    # Should be converted to dict
    assert isinstance(task.content, dict)
    assert task.content["type"] == ContentType.HOW_TO_GUIDE.value
    assert task.content["markdown"] == "# How to do something"
    assert len(task.content["images"]) == 1


@pytest.mark.unit
def test_checklist_content_serialization():
    """Test checklist content serialization for database storage."""
    checklist_content = ChecklistContent(
        type=ContentType.CHECKLIST,
        items=[
            ChecklistItem(text="First item", completed=False),
            ChecklistItem(text="Second item", completed=True),
        ]
    )
    
    task = TaskCreate(
        title="Checklist Task",
        description="Task with checklist",
        content=checklist_content,
        source=TaskSource.MANUAL,
    )
    
    # Should be converted to dict
    assert isinstance(task.content, dict)
    assert task.content["type"] == ContentType.CHECKLIST.value
    assert len(task.content["items"]) == 2
    assert task.content["items"][0]["text"] == "First item"
    assert task.content["items"][1]["completed"] is True


@pytest.mark.unit
def test_shopping_list_content_serialization():
    """Test shopping list content serialization for database storage."""
    shopping_content = ShoppingListContent(
        type=ContentType.SHOPPING_LIST,
        items=[
            ShoppingListItem(name="Milk", quantity="1 gallon", purchased=False),
            ShoppingListItem(name="Bread", quantity="2 loaves", purchased=True),
        ],
        store="Grocery Store",
        estimated_cost=25.50,
    )
    
    task = TaskCreate(
        title="Shopping Task",
        description="Grocery shopping",
        content=shopping_content,
        source=TaskSource.MANUAL,
    )
    
    # Should be converted to dict
    assert isinstance(task.content, dict)
    assert task.content["type"] == ContentType.SHOPPING_LIST.value
    assert len(task.content["items"]) == 2
    assert task.content["store"] == "Grocery Store"
    assert task.content["estimated_cost"] == 25.50


@pytest.mark.unit
def test_null_fields_handling():
    """Test that null schedule and content fields are handled properly."""
    task = TaskCreate(
        title="Simple Task",
        description="No schedule or content",
        schedule=None,
        content=None,
        source=TaskSource.MANUAL,
    )
    
    assert task.schedule is None
    assert task.content is None


