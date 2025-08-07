"""Integration tests for location endpoints with real database."""

import uuid
import pytest
from sqlalchemy import select

from app.database.models import Location as LocationModel
from app.models import TaskPriority


@pytest.mark.integration
class TestLocationsIntegration:
    """Integration tests for location functionality."""

    async def test_location_lifecycle(self, client, test_user_id, db_session, auth_headers: dict):
        """Test complete location lifecycle: create, read, update, delete."""
        # 1. Create a location
        location_data = {
            "name": "Home Office",
            "description": "My workspace",
            "location_metadata": {"floor": 2, "has_window": True},
        }

        create_response = await client.post(
            "/locations/", json=location_data, headers=auth_headers
        )

        assert create_response.status_code == 201
        location = create_response.json()
        location_id = location["id"]

        # Verify in database
        db_location = await db_session.get(LocationModel, uuid.UUID(location_id))
        assert db_location is not None
        assert db_location.name == "Home Office"
        assert db_location.user_id == uuid.UUID(test_user_id)

        # 2. Read the location
        get_response = await client.get(
            f"/locations/{location_id}", headers=auth_headers
        )

        assert get_response.status_code == 200
        assert get_response.json()["name"] == "Home Office"

        # 3. Update the location
        update_data = {
            "description": "Updated workspace with standing desk",
            "location_metadata": {
                "floor": 2,
                "has_window": True,
                "has_standing_desk": True,
            },
        }

        update_response = await client.patch(
            f"/locations/{location_id}",
            json=update_data,
            headers=auth_headers,
        )

        assert update_response.status_code == 200
        updated = update_response.json()
        assert updated["description"] == "Updated workspace with standing desk"
        assert updated["location_metadata"]["has_standing_desk"] is True

        # Verify in database
        await db_session.refresh(db_location)
        assert db_location.description == "Updated workspace with standing desk"

        # 4. Soft delete the location
        delete_response = await client.delete(
            f"/locations/{location_id}", headers=auth_headers
        )

        assert delete_response.status_code == 204

        # Verify soft delete in database
        await db_session.refresh(db_location)
        assert db_location.is_active is False

    async def test_default_locations_persistence(
        self, client, test_user_id, db_session
    , auth_headers: dict):
        """Test that using a default location persists it to database."""
        # List locations - should include virtual defaults
        list_response = await client.get(
            "/locations/", headers=auth_headers
        )

        locations = list_response.json()
        kitchen_virtual = next(
            (loc for loc in locations if loc["name"] == "Kitchen"), None
        )
        assert kitchen_virtual is not None
        assert kitchen_virtual["is_from_defaults"] is True

        # Create Kitchen location explicitly
        kitchen_data = {"name": "Kitchen", "description": "My kitchen"}
        create_response = await client.post(
            "/locations/", json=kitchen_data, headers=auth_headers
        )

        assert create_response.status_code == 201
        kitchen = create_response.json()
        assert kitchen["is_default"] is True

        # Verify in database
        query = select(LocationModel).where(
            LocationModel.user_id == uuid.UUID(test_user_id),
            LocationModel.name == "Kitchen",
        )
        result = await db_session.execute(query)
        db_kitchen = result.scalar_one_or_none()
        assert db_kitchen is not None
        assert db_kitchen.is_default is True

        # List again - Kitchen should no longer be virtual
        list_response2 = await client.get(
            "/locations/", headers=auth_headers
        )

        locations2 = list_response2.json()
        kitchen_saved = next(
            (loc for loc in locations2 if loc["name"] == "Kitchen"), None
        )
        assert kitchen_saved is not None
        assert kitchen_saved["id"] == kitchen["id"]
        assert kitchen_saved["description"] == "My kitchen"

    async def test_user_isolation(self, client, db_session, test_jwt_token):
        """Test that locations are properly isolated between users."""
        # Create two different users with different JWT tokens
        user1_id = str(uuid.uuid4())
        user2_id = str(uuid.uuid4())
        
        # Import JWT creation utilities
        from jose import jwt
        from datetime import datetime, timezone, timedelta
        import os
        
        # Get JWT secret
        secret = os.getenv("JWT_SECRET", os.getenv("NEXTAUTH_SECRET", "test-secret-for-testing-only"))
        
        # Create JWT for user 1
        user1_payload = {
            "sub": user1_id,
            "email": f"user1-{user1_id}@example.com",
            "name": "User 1",
            "picture": None,
            "iat": datetime.now(timezone.utc),
            "exp": datetime.now(timezone.utc) + timedelta(hours=1),
        }
        user1_token = jwt.encode(user1_payload, secret, algorithm="HS256")
        user1_headers = {"Authorization": f"Bearer {user1_token}"}
        
        # Create JWT for user 2
        user2_payload = {
            "sub": user2_id,
            "email": f"user2-{user2_id}@example.com",
            "name": "User 2",
            "picture": None,
            "iat": datetime.now(timezone.utc),
            "exp": datetime.now(timezone.utc) + timedelta(hours=1),
        }
        user2_token = jwt.encode(user2_payload, secret, algorithm="HS256")
        user2_headers = {"Authorization": f"Bearer {user2_token}"}

        # User 1 creates a location
        location1_data = {"name": "User1 Office", "description": "Private office"}
        response1 = await client.post(
            "/locations/", json=location1_data, headers=user1_headers
        )
        assert response1.status_code == 201
        location1_id = response1.json()["id"]

        # User 2 creates a location
        location2_data = {"name": "User2 Office", "description": "Different office"}
        response2 = await client.post(
            "/locations/", json=location2_data, headers=user2_headers
        )
        assert response2.status_code == 201

        # User 1 lists their locations
        list1 = await client.get("/locations/", headers=user1_headers)
        user1_locations = [loc for loc in list1.json() if not loc["is_from_defaults"]]
        assert len(user1_locations) == 1
        assert user1_locations[0]["name"] == "User1 Office"

        # User 2 cannot access User 1's location
        get_response = await client.get(
            f"/locations/{location1_id}", headers=user2_headers
        )
        assert get_response.status_code == 404

        # User 2 cannot update User 1's location
        update_response = await client.patch(
            f"/locations/{location1_id}",
            json={"description": "Hacked!"},
            headers=user2_headers,
        )
        assert update_response.status_code == 404

        # User 2 cannot delete User 1's location
        delete_response = await client.delete(
            f"/locations/{location1_id}", headers=user2_headers
        )
        assert delete_response.status_code == 404

    async def test_location_with_tasks_relationship(
        self, client, test_user_id, db_session
    , auth_headers: dict):
        """Test that locations work correctly with tasks."""
        # Create a location
        location_data = {"name": "Garage", "description": "Car storage and workshop"}
        location_response = await client.post(
            "/locations/", json=location_data, headers=auth_headers
        )
        location_id = location_response.json()["id"]

        # Create multiple tasks in this location
        task_ids = []
        for i in range(3):
            task_data = {
                "title": f"Garage task {i + 1}",
                "location_id": location_id,
                "priority": TaskPriority.MEDIUM.value,
            }
            task_response = await client.post(
                "/api/tasks/", json=task_data, headers=auth_headers
            )
            assert task_response.status_code == 200
            task_ids.append(task_response.json()["id"])

        # Get all tasks and verify location is populated
        tasks_response = await client.get(
            "/api/tasks/", headers=auth_headers
        )

        tasks = tasks_response.json()
        garage_tasks = [
            t for t in tasks if t.get("location") and t["location"]["id"] == location_id
        ]
        assert len(garage_tasks) >= 3

        for task in garage_tasks:
            assert task["location"]["name"] == "Garage"
            assert task["location"]["description"] == "Car storage and workshop"

        # Soft delete the location
        delete_response = await client.delete(
            f"/locations/{location_id}", headers=auth_headers
        )
        assert delete_response.status_code == 204

        # Tasks should still exist and reference the location
        for task_id in task_ids:
            task_response = await client.get(
                f"/api/tasks/{task_id}", headers=auth_headers
            )
            assert task_response.status_code == 200
            task = task_response.json()
            # Location should still be populated even if soft deleted
            assert task["location"]["id"] == location_id
            assert task["location"]["name"] == "Garage"
