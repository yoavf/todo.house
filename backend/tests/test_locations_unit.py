"""Unit tests for location endpoints."""

import uuid
import pytest

from app.models import LocationType


@pytest.mark.unit
class TestLocationEndpoints:
    """Test location CRUD operations."""

    async def test_create_location_success(self, client, test_user_id):
        """Test creating a new location."""
        location_data = {
            "name": "Living Room",
            "description": "Main living area",
            "location_type": LocationType.ROOM.value,
            "is_active": True,
            "location_metadata": {"floor": 1, "size": "large"},
        }

        response = await client.post(
            "/locations/", json=location_data, headers={"x-user-id": str(test_user_id)}
        )

        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Living Room"
        assert data["description"] == "Main living area"
        assert data["location_type"] == LocationType.ROOM.value
        assert data["is_active"] is True
        assert data["location_metadata"] == {"floor": 1, "size": "large"}
        assert "id" in data
        assert data["user_id"] == str(test_user_id)

    async def test_list_locations_active_only(self, client, test_user_id):
        """Test listing only active locations."""
        response = await client.get(
            "/locations/?active_only=true", headers={"x-user-id": str(test_user_id)}
        )

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    async def test_list_all_locations(self, client, test_user_id):
        """Test listing all locations including inactive ones."""
        response = await client.get(
            "/locations/?active_only=false", headers={"x-user-id": str(test_user_id)}
        )

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    async def test_get_location_by_id(self, client, test_user_id):
        """Test getting a specific location by ID."""
        # First create a location
        location_data = {
            "name": "Kitchen",
            "description": "Cooking area",
            "location_type": LocationType.ROOM.value,
        }

        create_response = await client.post(
            "/locations/", json=location_data, headers={"x-user-id": str(test_user_id)}
        )
        assert create_response.status_code == 201
        location_id = create_response.json()["id"]

        # Then get it by ID
        response = await client.get(
            f"/locations/{location_id}", headers={"x-user-id": str(test_user_id)}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == location_id
        assert data["name"] == "Kitchen"

    async def test_get_location_not_found(self, client, test_user_id):
        """Test getting a non-existent location."""
        random_id = str(uuid.uuid4())
        response = await client.get(
            f"/locations/{random_id}", headers={"x-user-id": str(test_user_id)}
        )

        assert response.status_code == 404
        assert response.json()["detail"] == "Location not found"

    async def test_update_location(self, client, test_user_id):
        """Test updating a location."""
        # First create a location
        location_data = {
            "name": "Garage",
            "description": "Car storage",
            "location_type": LocationType.GARAGE.value,
        }

        create_response = await client.post(
            "/locations/", json=location_data, headers={"x-user-id": str(test_user_id)}
        )
        assert create_response.status_code == 201
        location_id = create_response.json()["id"]

        # Update it
        update_data = {
            "name": "Workshop",
            "description": "Tools and workspace",
            "location_metadata": {"has_workbench": True},
        }

        response = await client.patch(
            f"/locations/{location_id}",
            json=update_data,
            headers={"x-user-id": str(test_user_id)},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Workshop"
        assert data["description"] == "Tools and workspace"
        assert data["location_type"] == LocationType.GARAGE.value  # Unchanged
        assert data["location_metadata"] == {"has_workbench": True}

    async def test_delete_location_soft_delete(self, client, test_user_id):
        """Test soft deleting a location."""
        # First create a location
        location_data = {"name": "Basement", "description": "Storage area"}

        create_response = await client.post(
            "/locations/", json=location_data, headers={"x-user-id": str(test_user_id)}
        )
        assert create_response.status_code == 201
        location_id = create_response.json()["id"]

        # Delete it
        response = await client.delete(
            f"/locations/{location_id}", headers={"x-user-id": str(test_user_id)}
        )

        assert response.status_code == 204

        # Verify it's soft deleted by checking with active_only=false
        list_response = await client.get(
            "/locations/?active_only=false", headers={"x-user-id": str(test_user_id)}
        )
        locations = list_response.json()
        deleted_location = next(
            (loc for loc in locations if loc["id"] == location_id), None
        )
        if deleted_location:
            assert deleted_location["is_active"] is False

    async def test_create_location_minimal_data(self, client, test_user_id):
        """Test creating a location with minimal required data."""
        location_data = {"name": "Attic"}

        response = await client.post(
            "/locations/", json=location_data, headers={"x-user-id": str(test_user_id)}
        )

        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Attic"
        assert data["description"] is None
        assert data["location_type"] is None
        assert data["is_active"] is True
        assert data["location_metadata"] is None
