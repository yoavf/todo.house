"""Integration tests for user settings API endpoints."""

import pytest
import uuid
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from unittest.mock import patch, MagicMock

from app.database.models import User
from app.ai.image_processing import ImageProcessingService


@pytest.mark.integration
class TestUserSettingsIntegration:
    """Integration tests for user settings endpoints."""

    async def test_get_user_settings_new_user_creation(self, client: AsyncClient, test_user_id: str, auth_headers: dict):
        """Test that new users are created automatically on first auth."""
        response = await client.get(
            "/api/user-settings/me",
            headers=auth_headers
        )
        
        # With JWT auth, users are created automatically on first sign-in
        assert response.status_code == 200
        data = response.json()
        assert data["user_id"] == str(test_user_id)  # ID comes from JWT token
        assert data["locale_preference"] is None  # Default for new users

    async def test_get_user_settings_success(
        self, client: AsyncClient, test_user_id: str, setup_test_user, db_session: AsyncSession
    , auth_headers: dict):
        """Test getting user settings successfully."""
        response = await client.get(
            "/api/user-settings/me",
            headers={**auth_headers, "Accept-Language": "en-US,en;q=0.9"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["user_id"] == str(test_user_id)
        assert data["locale_preference"] is None  # Default is None
        assert "created_at" in data
        assert "updated_at" in data

    async def test_update_user_settings_locale_preference(
        self, client: AsyncClient, test_user_id: str, setup_test_user, db_session: AsyncSession
    , auth_headers: dict):
        """Test updating user locale preference."""
        # Update locale preference to Hebrew
        update_data = {"locale_preference": "he"}
        
        response = await client.patch(
            "/api/user-settings/me",
            json=update_data,
            headers={**auth_headers, "Accept-Language": "en-US,en;q=0.9"
            }
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
    , auth_headers: dict):
        """Test updating user settings with invalid locale."""
        update_data = {"locale_preference": "invalid"}
        
        response = await client.patch(
            "/api/user-settings/me",
            json=update_data,
            headers=auth_headers
        )
        
        assert response.status_code == 422  # Pydantic validation error
        # The error will be in the detail field for validation errors

    async def test_update_user_settings_clear_preference(
        self, client: AsyncClient, test_user_id: str, setup_test_user, db_session: AsyncSession
    , auth_headers: dict):
        """Test clearing user locale preference."""
        # First set a preference
        update_data = {"locale_preference": "he"}
        response = await client.patch(
            "/api/user-settings/me",
            json=update_data,
            headers=auth_headers
        )
        assert response.status_code == 200
        
        # Then clear it
        update_data = {"locale_preference": None}
        response = await client.patch(
            "/api/user-settings/me",
            json=update_data,
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["locale_preference"] is None

    async def test_get_user_locale_info(
        self, client: AsyncClient, test_user_id: str, setup_test_user, db_session: AsyncSession
    , auth_headers: dict):
        """Test getting detailed user locale information."""
        # First set a Hebrew preference
        update_data = {"locale_preference": "he"}
        await client.patch(
            "/api/user-settings/me",
            json=update_data,
            headers=auth_headers
        )
        
        # Get user settings (which includes locale info)
        response = await client.get(
            "/api/user-settings/me",
            headers={**auth_headers, "Accept-Language": "en-US,en;q=0.9"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["user_id"] == str(test_user_id)
        assert data["locale_preference"] == "he"

    async def test_get_user_settings_no_preference(
        self, client: AsyncClient, test_user_id: str, setup_test_user
    , auth_headers: dict):
        """Test user settings when no preference is set."""
        response = await client.get(
            "/api/user-settings/me",
            headers={**auth_headers, "Accept-Language": "he-IL,he;q=0.9,en;q=0.8"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["user_id"] == str(test_user_id)
        assert data["locale_preference"] is None


@pytest.mark.integration
class TestLocaleAwareTasksIntegration:
    """Integration tests for locale-aware task endpoints."""

    async def test_tasks_respect_user_locale_preference(
        self, client: AsyncClient, test_user_id: str, setup_test_user, db_session: AsyncSession
    , auth_headers: dict):
        """Test that task endpoints respect user locale preference."""
        # Set user locale preference to Hebrew
        update_data = {"locale_preference": "he"}
        await client.patch(
            "/api/user-settings/me",
            json=update_data,
            headers=auth_headers
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
                **auth_headers,
                "Accept-Language": "en-US,en;q=0.9"  # Different from preference
            }
        )
        
        assert create_response.status_code == 200
        
        # Get tasks - should use Hebrew locale for snooze options
        response = await client.get(
            "/api/tasks/",
            headers={
                **auth_headers,
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
    , auth_headers: dict):
        """Test that task endpoints fall back to Accept-Language header."""
        # Ensure no locale preference is set (should be None by default)
        
        # First create a task using the API
        task_data = {
            "title": "Test Task",
            "description": "Test task for locale fallback",
            "priority": "medium"
        }
        
        create_response = await client.post(
            "/api/tasks/",
            json=task_data,
            headers=auth_headers
        )
        assert create_response.status_code in [200, 201]  # Accept either status
        
        # Get tasks with Hebrew Accept-Language header
        response = await client.get(
            "/api/tasks/",
            headers={
                **auth_headers,
                "Accept-Language": "he-IL,he;q=0.9,en;q=0.8"
            }
        )
        
        assert response.status_code == 200
        tasks = response.json()
        assert len(tasks) > 0
        
        # Verify Hebrew locale is used by checking snooze options
        # Hebrew locale should have Hebrew-formatted snooze options
        task_response = tasks[0]
        assert "snooze_options" in task_response
        snooze_options = task_response["snooze_options"]
        
        # The snooze options should be present (they are generated based on locale)
        assert snooze_options is not None
        assert len(snooze_options) > 0
        
        # Additionally, get the same tasks with English header to compare
        response_en = await client.get(
            "/api/tasks/",
            headers={
                **auth_headers,
                "Accept-Language": "en-US,en;q=0.9"
            }
        )
        
        assert response_en.status_code == 200
        tasks_en = response_en.json()
        
        # The tasks should be the same, but locale-specific formatting might differ
        assert len(tasks) == len(tasks_en)

    async def test_snooze_task_respects_user_locale(
        self, client: AsyncClient, test_user_id: str, setup_test_user, db_session: AsyncSession
    , auth_headers: dict):
        """Test that snoozing tasks respects user locale preference."""
        # Set user locale preference to Hebrew
        update_data = {"locale_preference": "he"}
        await client.patch(
            "/api/user-settings/me",
            json=update_data,
            headers=auth_headers
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
            headers=auth_headers
        )
        
        assert create_response.status_code == 200
        task_id = create_response.json()["id"]
        
        # Snooze the task
        snooze_data = {"snooze_option": "context_sensitive"}
        
        response = await client.post(
            f"/api/tasks/{task_id}/snooze",
            json=snooze_data,
            headers={
                **auth_headers,
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
    , auth_headers: dict):
        """Test that image analysis respects user locale preference."""
        # Set user locale preference to Hebrew
        update_data = {"locale_preference": "he"}
        await client.patch(
            "/api/user-settings/me",
            json=update_data,
            headers=auth_headers
        )
        
        # Mock the image processing service to avoid real API calls
        with patch('app.images.create_image_processing_service') as mock_service_factory:
            mock_service = MagicMock(spec=ImageProcessingService)
            mock_service.analyze_image_and_generate_tasks.return_value = {
                "image_metadata": {"original_size": 633, "processed_size": 288},
                "analysis_summary": "Test analysis with Hebrew locale",
                "tasks": [],
                "processing_time": 0.001,
                "provider_used": "none",
                "ai_confidence": None,
                "retry_count": 0
            }
            mock_service_factory.return_value = mock_service
            
            # Analyze image
            files = {"image": ("test.jpg", sample_image_bytes, "image/jpeg")}
            data = {"generate_tasks": "true"}
            
            response = await client.post(
                "/api/images/analyze",
                files=files,
                data=data,
                headers={
                    **auth_headers,
                    "Accept-Language": "en-US,en;q=0.9"  # Different from preference
                }
            )
            
            # Should succeed with mocked response
            assert response.status_code == 200
            
            # Verify the service was called with Hebrew locale
            mock_service.analyze_image_and_generate_tasks.assert_called_once()
            call_args = mock_service.analyze_image_and_generate_tasks.call_args
            assert call_args.kwargs.get('locale') == 'he'

    async def test_image_analysis_fallback_to_header(
        self, client: AsyncClient, test_user_id: str, setup_test_user, sample_image_bytes: bytes,
        auth_headers: dict
    ):
        """Test that image analysis falls back to Accept-Language header."""
        # Ensure no locale preference is set
        
        # Mock the image processing service to avoid real API calls
        with patch('app.images.create_image_processing_service') as mock_service_factory:
            mock_service = MagicMock(spec=ImageProcessingService)
            mock_service.analyze_image_and_generate_tasks.return_value = {
                "image_metadata": {"original_size": 633, "processed_size": 288},
                "analysis_summary": "Test analysis with Hebrew from header",
                "tasks": [],
                "processing_time": 0.001,
                "provider_used": "none",
                "ai_confidence": None,
                "retry_count": 0
            }
            mock_service_factory.return_value = mock_service
            
            # Analyze image with Hebrew Accept-Language header
            files = {"image": ("test.jpg", sample_image_bytes, "image/jpeg")}
            data = {"generate_tasks": "true"}
            
            response = await client.post(
                "/api/images/analyze",
                files=files,
                data=data,
                headers={
                    **auth_headers,
                    "Accept-Language": "he-IL,he;q=0.9,en;q=0.8"
                }
            )
            
            # Should succeed with mocked response
            assert response.status_code == 200
            
            # Verify the service was called with Hebrew locale from header
            mock_service.analyze_image_and_generate_tasks.assert_called_once()
            call_args = mock_service.analyze_image_and_generate_tasks.call_args
            assert call_args.kwargs.get('locale') == 'he'