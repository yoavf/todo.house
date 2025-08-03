"""Integration tests for tasks endpoints with real database."""

import uuid
import pytest
from datetime import datetime, timedelta
from sqlalchemy import select, and_

from app.database.models import Task as TaskModel
from app.models import TaskStatus, TaskPriority, TaskSource, TaskType


@pytest.mark.integration
class TestTasksIntegration:
    """Integration tests for task functionality."""

    async def test_task_lifecycle(self, client, test_user_id, db_session):
        """Test complete task lifecycle: create, read, update, complete, delete."""
        # 1. Create a task with all fields
        task_data = {
            "title": "Complete integration test",
            "description": "Test all task operations",
            "priority": TaskPriority.HIGH.value,
            "task_types": [TaskType.MAINTENANCE.value, TaskType.REPAIR.value],
            "tags": ["urgent", "testing"],
            "metrics": {"effort": 5, "complexity": 3}
        }
        
        create_response = await client.post(
            "/api/tasks/",
            json=task_data,
            headers={"x-user-id": str(test_user_id)}
        )
        
        assert create_response.status_code == 200
        task = create_response.json()
        task_id = task["id"]
        
        # Verify in database
        db_task = await db_session.get(TaskModel, task_id)
        assert db_task is not None
        assert db_task.title == "Complete integration test"
        assert db_task.priority == TaskPriority.HIGH
        assert db_task.task_types == ["maintenance", "repair"]
        
        # 2. Update the task
        update_data = {
            "description": "Updated description",
            "priority": TaskPriority.MEDIUM.value,
            "tags": ["urgent", "testing", "updated"]
        }
        
        update_response = await client.put(
            f"/api/tasks/{task_id}",
            json=update_data,
            headers={"x-user-id": str(test_user_id)}
        )
        
        assert update_response.status_code == 200
        updated = update_response.json()
        assert updated["description"] == "Updated description"
        assert updated["priority"] == TaskPriority.MEDIUM.value
        assert "updated" in updated["tags"]
        
        # 3. Complete the task
        complete_response = await client.put(
            f"/api/tasks/{task_id}",
            json={"completed": True},
            headers={"x-user-id": str(test_user_id)}
        )
        
        assert complete_response.status_code == 200
        completed = complete_response.json()
        assert completed["completed"] is True
        assert completed["status"] == TaskStatus.COMPLETED.value
        
        # Verify in database
        await db_session.refresh(db_task)
        assert db_task.completed is True
        assert db_task.status == TaskStatus.COMPLETED
        
        # 4. Delete the task
        delete_response = await client.delete(
            f"/api/tasks/{task_id}",
            headers={"x-user-id": str(test_user_id)}
        )
        
        assert delete_response.status_code == 200
        
        # Verify deletion
        await db_session.commit()
        db_task = await db_session.get(TaskModel, task_id)
        assert db_task is None

    async def test_task_snooze_workflow(self, client, test_user_id, db_session):
        """Test snoozing and unsnoozing tasks."""
        # Create an active task
        task_data = {"title": "Task to snooze"}
        create_response = await client.post(
            "/api/tasks/",
            json=task_data,
            headers={"x-user-id": str(test_user_id)}
        )
        task_id = create_response.json()["id"]
        
        # Verify it appears in active tasks
        active_response = await client.get(
            "/api/tasks/active",
            headers={"x-user-id": str(test_user_id)}
        )
        active_tasks = active_response.json()
        assert any(t["id"] == task_id for t in active_tasks)
        
        # Snooze the task
        snooze_until = datetime.now() + timedelta(hours=2)
        snooze_response = await client.post(
            f"/api/tasks/{task_id}/snooze",
            json={"snooze_until": snooze_until.isoformat()},
            headers={"x-user-id": str(test_user_id)}
        )
        
        assert snooze_response.status_code == 200
        snoozed = snooze_response.json()
        assert snoozed["status"] == TaskStatus.SNOOZED.value
        
        # Verify it's in snoozed tasks
        snoozed_response = await client.get(
            "/api/tasks/snoozed",
            headers={"x-user-id": str(test_user_id)}
        )
        snoozed_tasks = snoozed_response.json()
        assert any(t["id"] == task_id for t in snoozed_tasks)
        
        # Verify it's NOT in active tasks
        active_response2 = await client.get(
            "/api/tasks/active",
            headers={"x-user-id": str(test_user_id)}
        )
        active_tasks2 = active_response2.json()
        assert not any(t["id"] == task_id for t in active_tasks2)
        
        # Unsnooze the task
        unsnooze_response = await client.post(
            f"/api/tasks/{task_id}/unsnooze",
            headers={"x-user-id": str(test_user_id)}
        )
        
        assert unsnooze_response.status_code == 200
        unsnoozed = unsnooze_response.json()
        assert unsnoozed["status"] == TaskStatus.ACTIVE.value
        assert unsnoozed["snoozed_until"] is None

    async def test_task_filtering(self, client, test_user_id, db_session):
        """Test various task filtering options."""
        # Create tasks with different attributes
        tasks_data = [
            {
                "title": "Active Manual Task",
                "status": TaskStatus.ACTIVE.value,
                "source": TaskSource.MANUAL.value
            },
            {
                "title": "Active AI Task",
                "status": TaskStatus.ACTIVE.value,
                "source": TaskSource.AI_GENERATED.value,
                "source_image_id": str(uuid.uuid4()),
                "ai_confidence": 0.85,
                "ai_provider": "test-ai"
            },
            {
                "title": "Completed Manual Task",
                "status": TaskStatus.COMPLETED.value,
                "source": TaskSource.MANUAL.value,
                "completed": True
            },
            {
                "title": "Snoozed AI Task",
                "status": TaskStatus.SNOOZED.value,
                "source": TaskSource.AI_GENERATED.value,
                "source_image_id": str(uuid.uuid4()),
                "ai_confidence": 0.90,
                "ai_provider": "test-ai",
                "snoozed_until": (datetime.now() + timedelta(days=1)).isoformat()
            }
        ]
        
        # Create all tasks
        for task_data in tasks_data:
            response = await client.post(
                "/api/tasks/",
                json=task_data,
                headers={"x-user-id": str(test_user_id)}
            )
            assert response.status_code == 200
        
        # Test status filter
        active_response = await client.get(
            "/api/tasks/?status=active",
            headers={"x-user-id": str(test_user_id)}
        )
        active_tasks = active_response.json()
        assert len(active_tasks) >= 2
        assert all(t["status"] == TaskStatus.ACTIVE.value for t in active_tasks)
        
        # Test source filter
        ai_response = await client.get(
            "/api/tasks/?source=ai_generated",
            headers={"x-user-id": str(test_user_id)}
        )
        ai_tasks = ai_response.json()
        assert len(ai_tasks) >= 2
        assert all(t["source"] == TaskSource.AI_GENERATED.value for t in ai_tasks)
        
        # Test combined filters
        active_manual_response = await client.get(
            "/api/tasks/?status=active&source=manual",
            headers={"x-user-id": str(test_user_id)}
        )
        active_manual_tasks = active_manual_response.json()
        assert any(t["title"] == "Active Manual Task" for t in active_manual_tasks)
        assert not any(t["title"] == "Active AI Task" for t in active_manual_tasks)

    async def test_task_with_location_integration(self, client, test_user_id, db_session):
        """Test tasks with location references work correctly."""
        # Create a location
        location_data = {"name": "Workshop", "description": "Tools and projects"}
        location_response = await client.post(
            "/locations/",
            json=location_data,
            headers={"x-user-id": str(test_user_id)}
        )
        location_id = location_response.json()["id"]
        
        # Create a task with location
        task_data = {
            "title": "Fix the workbench",
            "description": "Repair broken leg",
            "location_id": location_id,
            "task_types": [TaskType.REPAIR.value]
        }
        
        task_response = await client.post(
            "/api/tasks/",
            json=task_data,
            headers={"x-user-id": str(test_user_id)}
        )
        
        assert task_response.status_code == 200
        task = task_response.json()
        assert task["location"]["id"] == location_id
        assert task["location"]["name"] == "Workshop"
        
        # Update task to different location
        new_location_data = {"name": "Basement", "description": "Storage area"}
        new_location_response = await client.post(
            "/locations/",
            json=new_location_data,
            headers={"x-user-id": str(test_user_id)}
        )
        new_location_id = new_location_response.json()["id"]
        
        update_response = await client.put(
            f"/api/tasks/{task['id']}",
            json={"location_id": new_location_id},
            headers={"x-user-id": str(test_user_id)}
        )
        
        assert update_response.status_code == 200
        updated = update_response.json()
        assert updated["location"]["id"] == new_location_id
        assert updated["location"]["name"] == "Basement"
        
        # Remove location from task
        remove_location_response = await client.put(
            f"/api/tasks/{task['id']}",
            json={"location_id": None},
            headers={"x-user-id": str(test_user_id)}
        )
        
        assert remove_location_response.status_code == 200
        no_location = remove_location_response.json()
        assert no_location["location_id"] is None
        assert no_location.get("location") is None

    async def test_task_user_isolation(self, client, db_session):
        """Test that tasks are properly isolated between users."""
        user1_id = uuid.uuid4()
        user2_id = uuid.uuid4()
        
        # User 1 creates a task
        task1_response = await client.post(
            "/api/tasks/",
            json={"title": "User 1 Private Task"},
            headers={"x-user-id": str(user1_id)}
        )
        assert task1_response.status_code == 200
        task1_id = task1_response.json()["id"]
        
        # User 2 creates a task
        task2_response = await client.post(
            "/api/tasks/",
            json={"title": "User 2 Private Task"},
            headers={"x-user-id": str(user2_id)}
        )
        assert task2_response.status_code == 200
        
        # User 1 can only see their task
        user1_tasks = await client.get(
            "/api/tasks/",
            headers={"x-user-id": str(user1_id)}
        )
        user1_task_titles = [t["title"] for t in user1_tasks.json()]
        assert "User 1 Private Task" in user1_task_titles
        assert "User 2 Private Task" not in user1_task_titles
        
        # User 2 cannot access User 1's task
        get_response = await client.get(
            f"/api/tasks/{task1_id}",
            headers={"x-user-id": str(user2_id)}
        )
        assert get_response.status_code == 404
        
        # User 2 cannot update User 1's task
        update_response = await client.put(
            f"/api/tasks/{task1_id}",
            json={"title": "Hacked!"},
            headers={"x-user-id": str(user2_id)}
        )
        assert update_response.status_code == 404
        
        # User 2 cannot delete User 1's task
        delete_response = await client.delete(
            f"/api/tasks/{task1_id}",
            headers={"x-user-id": str(user2_id)}
        )
        assert delete_response.status_code == 404

    async def test_bulk_task_operations(self, client, test_user_id, db_session):
        """Test creating and managing multiple tasks."""
        # Create 10 tasks with various attributes
        for i in range(10):
            task_data = {
                "title": f"Bulk task {i+1}",
                "priority": [TaskPriority.LOW, TaskPriority.MEDIUM, TaskPriority.HIGH][i % 3].value,
                "status": TaskStatus.ACTIVE.value if i < 7 else TaskStatus.COMPLETED.value,
                "completed": i >= 7,
                "task_types": [TaskType.MAINTENANCE.value] if i % 2 == 0 else []
            }
            
            response = await client.post(
                "/api/tasks/",
                json=task_data,
                headers={"x-user-id": str(test_user_id)}
            )
            assert response.status_code == 200
        
        # Get all tasks
        all_tasks = await client.get(
            "/api/tasks/",
            headers={"x-user-id": str(test_user_id)}
        )
        tasks = all_tasks.json()
        bulk_tasks = [t for t in tasks if t["title"].startswith("Bulk task")]
        assert len(bulk_tasks) == 10
        
        # Verify task distribution
        active_count = sum(1 for t in bulk_tasks if t["status"] == TaskStatus.ACTIVE.value)
        completed_count = sum(1 for t in bulk_tasks if t["status"] == TaskStatus.COMPLETED.value)
        assert active_count == 7
        assert completed_count == 3
        
        # Verify in database
        query = select(TaskModel).where(
            and_(
                TaskModel.user_id == uuid.UUID(test_user_id),
                TaskModel.title.like("Bulk task%")
            )
        )
        result = await db_session.execute(query)
        db_tasks = result.scalars().all()
        assert len(db_tasks) == 10