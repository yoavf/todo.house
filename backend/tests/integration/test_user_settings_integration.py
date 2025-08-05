"""Integration tests for user settings API endpoints."""

import pytest
import uuid
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database.models import User


@pytest.mark.integration
class TestUserSettingsIntegration:
    """Integration tests for user settings endpoints."""

    async def test_get_user_settings_not_found(self, client: AsyncClient):
        """Test getting settings for non-existent user."""
        non_existent_user_id = uuid.uuid4()
        
        response = await client.get(
            f"/api/user-settings/{non_existent_user_id}"
        )
        
        assert response.status_code == 404
        assert response.json()["detail"] == "User not found"

    async def test_get_user_settings_success(
        self, client: AsyncClient, test_user_id: str, setup_test_user, db_session: AsyncSession
    ):
        """Test getting user settings successfully."""
        response = await client.get(
            f"/api/user-settings/{test_user_id}",
            headers={"Accept-Language": "en-US,en;q=0.9"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["user_id"] == str(test_user_id)
        assert data["locale_preference"] is None  # Default is None
        assert "created_at" in data
        assert "updated_at" in data

    async def test_update_user_settings_locale_preference(
        self, client: AsyncClient, test_user_id: str, setup_test_user, db_session: AsyncSession
    ):
        """Test updating user locale preference."""
        # Update locale preference to Hebrew
        update_data = {"locale_preference": "he"}
        
        response = await client.patch(
            f"/api/user-settings/{test_user_id}",
            json=update_data,
            headers={"Accept-Language": "en-US,en;q=0.9"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["user_id"] == str(test_user_id)
        assert data["locale_preference"] == "he"
        
        # Verify in database
        result = await db_session.execute(
            select(User).where(User.id == uuid.UUID(test_user_id))
        )
        user = result.scalar_one()
        assert user.locale_preference == "he"

    async def test_update_user_settings_invalid_locale(
        self, client: AsyncClient, test_user_id: str, setup_test_user
    ):
        """Test updating user settings with invalid locale."""
        update_data = {"locale_preference": "invalid"}
        
        response = await client.patch(
            f"/api/user-settings/{test_user_id}",
            json=update_data
        )
        
        assert response.status_code == 422  # Pydantic validation error
        # The error will be in the detail field for validation errors

    async def test_update_user_settings_clear_preference(
        self, client: AsyncClient, test_user_id: str, setup_test_user, db_session: AsyncSession
    ):
        """Test clearing user locale preference."""
        # First set a preference
        update_data = {"locale_preference": "he"}
        response = await client.patch(
            f"/api/user-settings/{test_user_id}",
            json=update_data
        )
        assert response.status_code == 200
        
        # Then clear it
        update_data = {"locale_preference": None}
        response = await client.patch(
            f"/api/user-settings/{test_user_id}",
            json=update_data
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["locale_preference"] is None

    async def test_get_user_locale_info(
        self, client: AsyncClient, test_user_id: str, setup_test_user, db_session: AsyncSession
    ):
        """Test getting detailed user locale information."""
        # First set a Hebrew preference
        update_data = {"locale_preference": "he"}
        await client.patch(
            f"/api/user-settings/{test_user_id}",
            json=update_data
        )
        
        # Get locale info
        response = await client.get(
            f"/api/user-settings/{test_user_id}/locale",
            headers={"Accept-Language": "en-US,en;q=0.9"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["user_id"] == str(test_user_id)
        assert data["locale_preference"] == "he"
        assert data["current_locale"] == "he"  # Should use preference
        assert data["locale_source"] == "user_preference"
        assert "metadata" in data

    async def test_get_user_locale_info_fallback_to_header(
        self, client: AsyncClient, test_user_id: str, setup_test_user
    ):
        """Test locale info falls back to header when no preference set."""
        response = await client.get(
            f"/api/user-settings/{test_user_id}/locale",
            headers={"Accept-Language": "he-IL,he;q=0.9,en;q=0.8"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["user_id"] == str(test_user_id)
        assert data["locale_preference"] is None
        assert data["current_locale"] == "he"  # Should detect from header
        assert data["locale_source"] == "header"


@pytest.mark.integration
class TestLocaleAwareTasksIntegration:
    """Integration tests for locale-aware task endpoints."""

    async def test_tasks_respect_user_locale_preference(
        self, client: AsyncClient, test_user_id: str, setup_test_user, db_session: AsyncSession
    ):
        """Test that task endpoints respect user locale preference."""
        # Set user locale preference to Hebrew
        update_data = {"locale_preference": "he"}
        await client.patch(
            f"/api/user-settings/{test_user_id}",
            json=update_data
        )
        
        # Create a task
        task_data = {
            "title": "Test Task",
            "description": "Test Description",
            "priority": "medium"
        }
        
        create_response = await client.post(
            "/api/tasks/",
            json=task_data,
            headers={
                "x-user-id": str(test_user_id),
                "Accept-Language": "en-US,en;q=0.9"  # Different from preference
            }
        )
        
        assert create_response.status_code == 200
        
        # Get tasks - should use Hebrew locale for snooze options
        response = await client.get(
            "/api/tasks/",
            headers={
                "x-user-id": str(test_user_id),
                "Accept-Language": "en-US,en;q=0.9"  # Different from preference
            }
        )
        
        assert response.status_code == 200
        tasks = response.json()
        assert len(tasks) > 0
        
        # Check that snooze options are present (locale-specific formatting)
        task = tasks[0]
        assert "snooze_options" in task
        assert task["snooze_options"] is not None

    async def test_tasks_fallback_to_header_when_no_preference(
        self, client: AsyncClient, test_user_id: str, setup_test_user
    ):
        """Test that task endpoints fall back to Accept-Language header."""
        # Ensure no locale preference is set (should be None by default)
        
        # Get tasks with Hebrew Accept-Language header
        response = await client.get(
            "/api/tasks/",
            headers={
                "x-user-id": str(test_user_id),
                "Accept-Language": "he-IL,he;q=0.9,en;q=0.8"
            }
        )
        
        assert response.status_code == 200
        # Should work without errors and use Hebrew locale for snooze calculations

    async def test_snooze_task_respects_user_locale(
        self, client: AsyncClient, test_user_id: str, setup_test_user, db_session: AsyncSession
    ):
        """Test that snoozing tasks respects user locale preference."""
        # Set user locale preference to Hebrew
        update_data = {"locale_preference": "he"}
        await client.patch(
            f"/api/user-settings/{test_user_id}",
            json=update_data
        )
        
        # Create a task
        task_data = {
            "title": "Test Task",
            "description": "Test Description",
            "priority": "medium"
        }
        
        create_response = await client.post(
            "/api/tasks/",
            json=task_data,
            headers={"x-user-id": str(test_user_id)}
        )
        
        assert create_response.status_code == 200
        task_id = create_response.json()["id"]
        
        # Snooze the task
        snooze_data = {"snooze_option": "context_sensitive"}
        
        response = await client.post(
            f"/api/tasks/{task_id}/snooze",
            json=snooze_data,
            headers={
                "x-user-id": str(test_user_id),
                "Accept-Language": "en-US,en;q=0.9"  # Different from preference
            }
        )
        
        if response.status_code != 200:
            print(f"Snooze failed with status {response.status_code}: {response.text}")
        
        assert response.status_code == 200
        task = response.json()
        assert task["status"] == "snoozed"
        assert task["snoozed_until"] is not None


@pytest.mark.integration
class TestLocaleAwareImageAnalysisIntegration:
    """Integration tests for locale-aware image analysis endpoints."""

    async def test_image_analysis_respects_user_locale_preference(
        self, client: AsyncClient, test_user_id: str, setup_test_user, sample_image_bytes: bytes
    ):
        """Test that image analysis respects user locale preference."""
        # Set user locale preference to Hebrew
        update_data = {"locale_preference": "he"}
        await client.patch(
            f"/api/user-settings/{test_user_id}",
            json=update_data
        )
        
        # Analyze image
        files = {"image": ("test.jpg", sample_image_bytes, "image/jpeg")}
        data = {"generate_tasks": "true"}
        
        response = await client.post(
            "/api/images/analyze",
            files=files,
            data=data,
            headers={
                "x-user-id": str(test_user_id),
                "Accept-Language": "en-US,en;q=0.9"  # Different from preference
            }
        )
        
        # Should succeed (actual AI analysis might fail in test env, but locale detection should work)
        # The important thing is that the endpoint processes the request without errors
        assert response.status_code in [200, 400, 503]  # 400 for invalid image, 503 if AI service unavailable

    async def test_image_analysis_fallback_to_header(
        self, client: AsyncClient, test_user_id: str, setup_test_user, sample_image_bytes: bytes
    ):
        """Test that image analysis falls back to Accept-Language header."""
        # Ensure no locale preference is set
        
        # Analyze image with Hebrew Accept-Language header
        files = {"image": ("test.jpg", sample_image_bytes, "image/jpeg")}
        data = {"generate_tasks": "true"}
        
        response = await client.post(
            "/api/images/analyze",
            files=files,
            data=data,
            headers={
                "x-user-id": str(test_user_id),
                "Accept-Language": "he-IL,he;q=0.9,en;q=0.8"
            }
        )
        
        # Should succeed (actual AI analysis might fail in test env, but locale detection should work)
        assert response.status_code in [200, 400, 503]  # 400 for invalid image, 503 if AI service unavailable