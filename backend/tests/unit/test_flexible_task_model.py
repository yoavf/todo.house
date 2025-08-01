"""Unit tests for the flexible task model with content, metrics, and scheduling."""

import pytest
from datetime import datetime, timedelta, timezone

from app.services.task_content_examples import (
    create_washing_machine_task,
    create_bathroom_renovation_task,
    create_shopping_list_task,
    create_future_task,
    parse_task_content,
    get_next_scheduled_date,
)
from app.models import (
    ContentType,
    ScheduleType,
    RecurringPattern,
    TaskPriority,
    TaskType,
)


@pytest.mark.unit
def test_washing_machine_task_creation():
    """Test creating a recurring maintenance task with how-to content."""
    task = create_washing_machine_task()

    # Verify basic properties
    assert task.title == "Clean Washing Machine"
    assert task.priority == TaskPriority.MEDIUM
    assert TaskType.APPLIANCES in task.task_types
    assert TaskType.MAINTENANCE in task.task_types

    # Verify content (should be dict after validator)
    assert task.content is not None
    assert isinstance(task.content, dict)
    assert task.content["type"] == ContentType.HOW_TO_GUIDE.value
    assert "markdown" in task.content
    assert len(task.content["images"]) == 2
    assert len(task.content["videos"]) == 1

    # Verify metrics
    assert task.metrics is not None
    assert task.metrics["complexity"] == "easy"
    assert task.metrics["estimated_time_minutes"] == 45
    assert "vinegar" in task.metrics["requires_tools"]

    # Verify schedule (should be dict after validator)
    assert task.schedule is not None
    assert isinstance(task.schedule, dict)
    assert task.schedule["type"] == ScheduleType.RECURRING.value
    assert task.schedule["pattern"] == RecurringPattern.INTERVAL.value
    assert task.schedule["interval_days"] == 90

    # Verify tags
    assert "maintenance" in task.tags
    assert "quarterly" in task.tags


@pytest.mark.unit
def test_bathroom_renovation_checklist():
    """Test creating a complex task with checklist content."""
    task = create_bathroom_renovation_task()

    # Verify basic properties
    assert task.title == "Bathroom Renovation"
    assert task.priority == TaskPriority.HIGH

    # Verify content
    assert task.content is not None
    assert isinstance(task.content, dict)
    assert task.content["type"] == ContentType.CHECKLIST.value
    assert len(task.content["items"]) == 7
    assert all(not item["completed"] for item in task.content["items"])
    assert task.content["items"][0]["text"] == "Research and hire contractor"

    # Verify metrics
    assert task.metrics["complexity"] == "high"
    assert task.metrics["contractor_required"] is True
    assert task.metrics["budget_range"] == "5000-15000"


@pytest.mark.unit
def test_shopping_list_task():
    """Test creating a shopping list task."""
    task = create_shopping_list_task()

    # Verify content
    assert task.content is not None
    assert isinstance(task.content, dict)
    assert task.content["type"] == ContentType.SHOPPING_LIST.value
    assert len(task.content["items"]) == 6
    assert task.content["store"] == "Home Depot"
    assert task.content["estimated_cost"] == 125.50

    # Check that painter's tape is marked as purchased
    tape_item = next(
        item for item in task.content["items"] if item["name"] == "Painter's tape"
    )
    assert tape_item["purchased"] is True

    # Verify metrics
    assert task.metrics["items_purchased"] == 1
    assert task.metrics["items_total"] == 6


@pytest.mark.unit
def test_future_task_visibility():
    """Test creating a task with future visibility."""
    task = create_future_task()

    # Verify show_after is set
    assert task.show_after is not None
    assert task.show_after > datetime.now(timezone.utc)

    # Verify it has a one-time schedule
    assert task.schedule is not None
    assert isinstance(task.schedule, dict)
    assert task.schedule["type"] == ScheduleType.ONCE.value
    assert "date" in task.schedule

    # Verify seasonal tags
    assert "seasonal" in task.tags
    assert "spring" in task.tags


@pytest.mark.unit
def test_parse_task_content():
    """Test parsing different content types for display."""

    # Test how-to guide
    how_to_content = {
        "type": ContentType.HOW_TO_GUIDE.value,
        "images": [{"url": "img1"}, {"url": "img2"}],
        "videos": [{"url": "vid1"}],
    }
    assert "2 images, 1 videos" in parse_task_content(how_to_content)

    # Test checklist
    checklist_content = {
        "type": ContentType.CHECKLIST.value,
        "items": [{"completed": True}, {"completed": False}, {"completed": True}],
    }
    assert "Checklist: 2/3 completed" in parse_task_content(checklist_content)

    # Test shopping list
    shopping_content = {
        "type": ContentType.SHOPPING_LIST.value,
        "store": "Target",
        "items": [{"purchased": True}, {"purchased": True}, {"purchased": False}],
    }
    assert "Shopping list for Target: 2/3 purchased" in parse_task_content(
        shopping_content
    )

    # Test empty content
    assert parse_task_content(None) == ""
    assert parse_task_content({}) == ""


@pytest.mark.unit
def test_get_next_scheduled_date():
    """Test extracting next scheduled date from different schedule types."""

    # Test one-time schedule
    future_date = datetime.now(timezone.utc) + timedelta(days=30)
    once_schedule = {"type": ScheduleType.ONCE.value, "date": future_date.isoformat()}
    result = get_next_scheduled_date(once_schedule)
    assert result is not None
    assert abs((result - future_date).total_seconds()) < 1

    # Test recurring schedule
    next_occurrence = datetime.now(timezone.utc) + timedelta(days=90)
    recurring_schedule = {
        "type": ScheduleType.RECURRING.value,
        "next_occurrence": next_occurrence.isoformat(),
    }
    result = get_next_scheduled_date(recurring_schedule)
    assert result is not None
    assert abs((result - next_occurrence).total_seconds()) < 1

    # Test empty schedule
    assert get_next_scheduled_date(None) is None
    assert get_next_scheduled_date({}) is None
