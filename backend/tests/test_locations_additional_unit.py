"""Additional unit tests for location endpoints to improve coverage."""

import uuid
import pytest
from unittest.mock import patch


@pytest.mark.unit
class TestLocationsCoverage:
    """Additional tests to improve coverage for locations.py."""

    async def test_create_location_with_logging(
        self, client, test_user_id, auth_headers: dict
    ):
        """Test that location creation logs correctly."""
        with patch("app.locations.logger") as mock_logger:
            location_data = {"name": "Test Location", "description": "Test"}

            response = await client.post(
                "/locations/",
                json=location_data,
                headers=auth_headers,
            )

            assert response.status_code == 201
            # Check that logger.info was called
            mock_logger.info.assert_called_once()
            log_message = mock_logger.info.call_args[0][0]
            assert "Created location" in log_message
            assert str(test_user_id) in log_message

    async def test_list_locations_with_logging(
        self, client, test_user_id, auth_headers: dict
    ):
        """Test that listing locations logs correctly."""
        with patch("app.locations.logger") as mock_logger:
            response = await client.get("/locations/", headers=auth_headers)

            assert response.status_code == 200
            # Check that logger.info was called
            mock_logger.info.assert_called_once()
            log_message = mock_logger.info.call_args[0][0]
            assert "Retrieved" in log_message
            assert "locations for user" in log_message

    async def test_update_location_with_logging(
        self, client, test_user_id, auth_headers: dict
    ):
        """Test that location update logs correctly."""
        # First create a location
        location_data = {"name": "Original Name"}
        create_resp = await client.post(
            "/locations/", json=location_data, headers=auth_headers
        )
        location_id = create_resp.json()["id"]

        with patch("app.locations.logger") as mock_logger:
            update_data = {"description": "Updated description"}
            response = await client.patch(
                f"/locations/{location_id}",
                json=update_data,
                headers=auth_headers,
            )

            assert response.status_code == 200
            # Check that logger.info was called
            mock_logger.info.assert_called_once()
            log_message = mock_logger.info.call_args[0][0]
            assert "Updated location" in log_message

    async def test_delete_location_with_logging(
        self, client, test_user_id, auth_headers: dict
    ):
        """Test that location deletion logs correctly."""
        # First create a location
        location_data = {"name": "To Delete"}
        create_resp = await client.post(
            "/locations/", json=location_data, headers=auth_headers
        )
        location_id = create_resp.json()["id"]

        with patch("app.locations.logger") as mock_logger:
            response = await client.delete(
                f"/locations/{location_id}", headers=auth_headers
            )

            assert response.status_code == 204
            # Check that logger.info was called
            mock_logger.info.assert_called_once()
            log_message = mock_logger.info.call_args[0][0]
            assert "Deleted location" in log_message

    async def test_list_locations_inactive_included(
        self, client, test_user_id, auth_headers: dict
    ):
        """Test listing locations with active_only=False includes inactive."""
        # Create an active location
        active_loc = await client.post(
            "/locations/",
            json={"name": "Active Location"},
            headers=auth_headers,
        )
        active_id = active_loc.json()["id"]

        # Create and deactivate a location
        inactive_loc = await client.post(
            "/locations/",
            json={"name": "Inactive Location"},
            headers=auth_headers,
        )
        inactive_id = inactive_loc.json()["id"]

        # Deactivate it
        await client.delete(f"/locations/{inactive_id}", headers=auth_headers)

        # List with active_only=False
        response = await client.get(
            "/locations/?active_only=false", headers=auth_headers
        )

        assert response.status_code == 200
        locations = response.json()

        # Find both locations
        active_found = any(
            loc["id"] == active_id and loc["is_active"] for loc in locations
        )
        inactive_found = any(
            loc["id"] == inactive_id and not loc["is_active"] for loc in locations
        )

        assert active_found
        assert inactive_found

    async def test_list_locations_with_many_saved_and_defaults(
        self, client, test_user_id, auth_headers: dict
    ):
        """Test list sorting with multiple saved locations and defaults."""
        # Create multiple custom locations
        custom_names = ["Office", "Garage", "Attic"]
        for name in custom_names:
            await client.post(
                "/locations/",
                json={"name": name},
                headers=auth_headers,
            )

        # Create some default locations that will be marked as such
        default_used = ["Kitchen", "Garden"]
        for name in default_used:
            await client.post(
                "/locations/",
                json={"name": name, "description": f"My {name}"},
                headers=auth_headers,
            )

        # List all locations
        response = await client.get("/locations/", headers=auth_headers)

        assert response.status_code == 200
        locations = response.json()

        # Verify order: custom first, then saved defaults, then virtual defaults
        location_names = [loc["name"] for loc in locations]

        # First should be custom (alphabetically sorted)
        custom_start = 0
        for i, name in enumerate(sorted(custom_names)):
            assert location_names[i] == name
            assert not locations[i]["is_default"]
            custom_start = i + 1

        # Then saved defaults (alphabetically sorted)
        saved_default_start = custom_start
        for i, name in enumerate(sorted(default_used)):
            idx = saved_default_start + i
            assert location_names[idx] == name
            assert locations[idx]["is_default"]
            assert locations[idx]["is_from_defaults"]

        # Finally virtual defaults (those not in default_used)
        # Should be Bedroom and Bathroom
        remaining_defaults = {"Bedroom", "Bathroom"}
        remaining_names = set(location_names[saved_default_start + len(default_used) :])
        assert remaining_defaults == remaining_names

    async def test_create_location_with_full_metadata(
        self, client, test_user_id, auth_headers: dict
    ):
        """Test creating location with complete metadata."""
        location_data = {
            "name": "Master Suite",
            "description": "Primary bedroom with ensuite",
            "is_active": True,
            "is_default": False,
            "location_metadata": {
                "floor": 2,
                "square_feet": 450,
                "has_bathroom": True,
                "windows": 3,
                "closets": ["walk-in", "standard"],
            },
        }

        response = await client.post(
            "/locations/", json=location_data, headers=auth_headers
        )

        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Master Suite"
        assert data["description"] == "Primary bedroom with ensuite"
        assert data["location_metadata"]["floor"] == 2
        assert data["location_metadata"]["closets"] == ["walk-in", "standard"]

    async def test_update_location_partial_update(
        self, client, test_user_id, auth_headers: dict
    ):
        """Test partial update only updates specified fields."""
        # Create location with full data
        create_data = {
            "name": "Study",
            "description": "Home office",
            "location_metadata": {"has_desk": True},
        }
        create_resp = await client.post(
            "/locations/", json=create_data, headers=auth_headers
        )
        location_id = create_resp.json()["id"]

        # Update only description
        update_data = {"description": "Reading room"}
        response = await client.patch(
            f"/locations/{location_id}",
            json=update_data,
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Study"  # Unchanged
        assert data["description"] == "Reading room"  # Updated
        assert data["location_metadata"]["has_desk"] is True  # Unchanged

    async def test_list_locations_virtual_defaults_have_temp_ids(
        self, client, auth_headers: dict
    ):
        """Test that virtual default locations have valid temporary UUIDs."""
        # Use a fresh user with no saved locations
        uuid.uuid4()

        response = await client.get("/locations/", headers=auth_headers)

        assert response.status_code == 200
        locations = response.json()

        # All should be virtual defaults
        assert len(locations) == 4

        # Check each has a valid UUID
        for loc in locations:
            assert loc["is_from_defaults"]
            assert loc["is_default"]
            # Verify the ID is a valid UUID
            try:
                uuid.UUID(loc["id"])
            except ValueError:
                pytest.fail(f"Invalid UUID for virtual location: {loc['id']}")
            # Verify timestamps exist
            assert "created_at" in loc
            assert "updated_at" in loc
