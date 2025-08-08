"""Unit tests for tasks with location references."""

import pytest

from app.models import TaskPriority


@pytest.mark.unit
class TestTasksWithLocations:
    """Test task operations with location references."""

    async def test_create_task_with_location(
        self, client, test_user_id, auth_headers: dict
    ):
        """Test creating a task with a location reference."""
        # First create a location
        location_data = {"name": "Garden"}

        location_response = await client.post(
            "/locations/", json=location_data, headers=auth_headers
        )
        assert location_response.status_code == 201
        location_id = location_response.json()["id"]

        # Create a task with the location
        task_data = {
            "title": "Water the plants",
            "description": "Water all plants in the garden",
            "priority": TaskPriority.MEDIUM.value,
            "location_id": location_id,
        }

        response = await client.post(
            "/api/tasks/", json=task_data, headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Water the plants"
        assert data["location_id"] == location_id
        assert "location" in data
        assert data["location"]["id"] == location_id
        assert data["location"]["name"] == "Garden"

    async def test_get_task_with_location(
        self, client, test_user_id, auth_headers: dict
    ):
        """Test retrieving a task includes location data."""
        # Create location and task
        location_data = {"name": "Kitchen"}
        location_response = await client.post(
            "/locations/", json=location_data, headers=auth_headers
        )
        location_id = location_response.json()["id"]

        task_data = {"title": "Clean the counters", "location_id": location_id}
        task_response = await client.post(
            "/api/tasks/", json=task_data, headers=auth_headers
        )
        task_id = task_response.json()["id"]

        # Get the task
        response = await client.get(f"/api/tasks/{task_id}", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["location"]["id"] == location_id
        assert data["location"]["name"] == "Kitchen"
        # Check is_default based on what was returned when creating the location
        assert data["location"]["is_default"] == location_response.json()["is_default"]

    async def test_update_task_location(self, client, test_user_id, auth_headers: dict):
        """Test updating a task's location."""
        # Create two locations
        location1_data = {"name": "Living Room"}
        location1_response = await client.post(
            "/locations/", json=location1_data, headers=auth_headers
        )
        location1_id = location1_response.json()["id"]

        location2_data = {"name": "Bedroom"}
        location2_response = await client.post(
            "/locations/", json=location2_data, headers=auth_headers
        )
        location2_id = location2_response.json()["id"]

        # Create a task with location1
        task_data = {"title": "Vacuum the carpet", "location_id": location1_id}
        task_response = await client.post(
            "/api/tasks/", json=task_data, headers=auth_headers
        )
        task_id = task_response.json()["id"]

        # Update task to location2
        update_data = {"location_id": location2_id}
        response = await client.put(
            f"/api/tasks/{task_id}",
            json=update_data,
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["location_id"] == location2_id
        assert data["location"]["id"] == location2_id
        assert data["location"]["name"] == "Bedroom"

    async def test_create_task_without_location(
        self, client, test_user_id, auth_headers: dict
    ):
        """Test creating a task without a location reference."""
        task_data = {
            "title": "General task",
            "description": "A task without specific location",
        }

        response = await client.post(
            "/api/tasks/", json=task_data, headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["location_id"] is None
        assert data.get("location") is None

    async def test_list_tasks_with_locations(
        self, client, test_user_id, auth_headers: dict
    ):
        """Test listing tasks includes location data."""
        # Create a location
        location_data = {"name": "Office"}
        location_response = await client.post(
            "/locations/", json=location_data, headers=auth_headers
        )
        location_id = location_response.json()["id"]

        # Create tasks with and without location
        await client.post(
            "/api/tasks/",
            json={"title": "Task with location", "location_id": location_id},
            headers=auth_headers,
        )

        await client.post(
            "/api/tasks/",
            json={"title": "Task without location"},
            headers=auth_headers,
        )

        # List all tasks
        response = await client.get("/api/tasks/", headers=auth_headers)

        assert response.status_code == 200
        tasks = response.json()

        # Find the task with location
        task_with_location = next(
            (t for t in tasks if t["title"] == "Task with location"), None
        )
        assert task_with_location is not None
        assert task_with_location["location"]["name"] == "Office"

        # Find the task without location
        task_without_location = next(
            (t for t in tasks if t["title"] == "Task without location"), None
        )
        assert task_without_location is not None
        assert task_without_location.get("location") is None
