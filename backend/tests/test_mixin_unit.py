"""Unit tests for EnhancedFieldsMixin."""

import pytest
from app.models import TaskCreate, TaskUpdate, OnceSchedule, ScheduleType, TaskSource
from datetime import datetime, timezone


@pytest.mark.unit
def test_mixin_works_in_task_create():
    """Test that the mixin validators work in TaskCreate."""
    schedule = OnceSchedule(
        type=ScheduleType.ONCE,
        date=datetime(2025, 8, 15, 10, 0, 0, tzinfo=timezone.utc),
    )

    task = TaskCreate(
        title="Test Task",
        description="Testing mixin",
        schedule=schedule,
        source=TaskSource.MANUAL,
    )

    # The mixin's validator should convert it to dict
    assert isinstance(task.schedule, dict)
    assert task.schedule["type"] == ScheduleType.ONCE.value


@pytest.mark.unit
def test_mixin_works_in_task_update():
    """Test that the mixin validators work in TaskUpdate."""
    schedule = OnceSchedule(
        type=ScheduleType.ONCE,
        date=datetime(2025, 8, 15, 10, 0, 0, tzinfo=timezone.utc),
    )

    task = TaskUpdate(
        title="Updated Task",
        schedule=schedule,
    )

    # The mixin's validator should convert it to dict
    assert isinstance(task.schedule, dict)
    assert task.schedule["type"] == ScheduleType.ONCE.value
