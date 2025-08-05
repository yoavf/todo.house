"""Integration tests for locale-aware API endpoints."""

import pytest
import uuid
from httpx import AsyncClient
from unittest.mock import patch, MagicMock
from app.ai.image_processing import ImageProcessingService


@pytest.mark.integration
class TestImageAnalysisLocaleIntegration:
    """Integration tests for image analysis endpoint with locale detection."""

    @pytest.fixture
    def test_user_id(self):
        """Generate a unique test user ID."""
        return str(uuid.uuid4())

    @pytest.fixture
    def sample_image_data(self):
        """Create a minimal valid JPEG image for testing."""
        # Create a minimal 1x1 pixel JPEG image
        import io
        from PIL import Image
        
        img = Image.new('RGB', (1, 1), color='red')
        img_bytes = io.BytesIO()
        img.save(img_bytes, format='JPEG')
        return img_bytes.getvalue()

    async def test_image_analysis_with_english_locale(self, client: AsyncClient, test_user_id, sample_image_data):
        """Test image analysis endpoint with English Accept-Language header."""
        # Mock the AI provider and prompt service
        with patch('app.images.create_image_processing_service') as mock_service_factory:
            mock_service = MagicMock(spec=ImageProcessingService)
            mock_service.analyze_image_and_generate_tasks.return_value = {
                "image_metadata": {"original_size": 100, "processed_size": 80},
                "analysis_summary": "Test analysis",
                "tasks": [
                    {
                        "title": "Test task",
                        "description": "Test description",
                        "priority": "medium",
                        "category": "general",
                        "confidence": 0.8
                    }
                ],
                "processing_time": 1.0,
                "provider_used": "test",
                "retry_count": 0
            }
            mock_service_factory.return_value = mock_service
            response = await client.post(
                "/api/images/analyze",
                headers={
                    "X-User-Id": test_user_id,
                    "Accept-Language": "en-US,en;q=0.9"
                },
                files={"image": ("test.jpg", sample_image_data, "image/jpeg")},
                data={"generate_tasks": "true"}
            )

        assert response.status_code == 200
        
        # Verify that the service was called with English locale
        mock_service.analyze_image_and_generate_tasks.assert_called_once()
        call_args = mock_service.analyze_image_and_generate_tasks.call_args
        assert call_args.kwargs["locale"] == "en"

    async def test_image_analysis_with_hebrew_locale(self, client: AsyncClient, test_user_id, sample_image_data):
        """Test image analysis endpoint with Hebrew Accept-Language header."""
        with patch('app.images.create_image_processing_service') as mock_service_factory:
            mock_service = MagicMock(spec=ImageProcessingService)
            mock_service.analyze_image_and_generate_tasks.return_value = {
                "image_metadata": {"original_size": 100, "processed_size": 80},
                "analysis_summary": "ניתוח בדיקה",
                "tasks": [
                    {
                        "title": "משימת בדיקה",
                        "description": "תיאור בדיקה",
                        "priority": "medium",
                        "category": "general",
                        "confidence": 0.8
                    }
                ],
                "processing_time": 1.0,
                "provider_used": "test",
                "retry_count": 0
            }
            mock_service_factory.return_value = mock_service

            response = await client.post(
                "/api/images/analyze",
                headers={
                    "X-User-Id": test_user_id,
                    "Accept-Language": "he-IL,he;q=0.9,en;q=0.8"
                },
                files={"image": ("test.jpg", sample_image_data, "image/jpeg")},
                data={"generate_tasks": "true"}
            )

        assert response.status_code == 200
        
        # Verify that the service was called with Hebrew locale
        mock_service.analyze_image_and_generate_tasks.assert_called_once()
        call_args = mock_service.analyze_image_and_generate_tasks.call_args
        assert call_args.kwargs["locale"] == "he"

    async def test_image_analysis_with_unsupported_locale_fallback(self, client: AsyncClient, test_user_id, sample_image_data):
        """Test image analysis endpoint with unsupported locale falls back to English."""
        with patch('app.images.create_image_processing_service') as mock_service_factory:
            mock_service = MagicMock(spec=ImageProcessingService)
            mock_service.analyze_image_and_generate_tasks.return_value = {
                "image_metadata": {"original_size": 100, "processed_size": 80},
                "analysis_summary": "Test analysis",
                "tasks": [],
                "processing_time": 1.0,
                "provider_used": "test",
                "retry_count": 0
            }
            mock_service_factory.return_value = mock_service

            response = await client.post(
                "/api/images/analyze",
                headers={
                    "X-User-Id": test_user_id,
                    "Accept-Language": "fr-FR,es;q=0.9,de;q=0.8"
                },
                files={"image": ("test.jpg", sample_image_data, "image/jpeg")},
                data={"generate_tasks": "true"}
            )

        assert response.status_code == 200
        
        # Verify that the service was called with default English locale
        mock_service.analyze_image_and_generate_tasks.assert_called_once()
        call_args = mock_service.analyze_image_and_generate_tasks.call_args
        assert call_args.kwargs["locale"] == "en"

    async def test_image_analysis_without_accept_language_header(self, client: AsyncClient, test_user_id, sample_image_data):
        """Test image analysis endpoint without Accept-Language header defaults to English."""
        with patch('app.images.create_image_processing_service') as mock_service_factory:
            mock_service = MagicMock(spec=ImageProcessingService)
            mock_service.analyze_image_and_generate_tasks.return_value = {
                "image_metadata": {"original_size": 100, "processed_size": 80},
                "analysis_summary": "Test analysis",
                "tasks": [],
                "processing_time": 1.0,
                "provider_used": "test",
                "retry_count": 0
            }
            mock_service_factory.return_value = mock_service

            response = await client.post(
                "/api/images/analyze",
                headers={"X-User-Id": test_user_id},
                files={"image": ("test.jpg", sample_image_data, "image/jpeg")},
                data={"generate_tasks": "true"}
            )

        assert response.status_code == 200
        
        # Verify that the service was called with default English locale
        mock_service.analyze_image_and_generate_tasks.assert_called_once()
        call_args = mock_service.analyze_image_and_generate_tasks.call_args
        assert call_args.kwargs["locale"] == "en"


@pytest.mark.integration
class TestTaskEndpointsLocaleIntegration:
    """Integration tests for task endpoints with locale detection."""

    @pytest.fixture
    def test_user_id(self):
        """Generate a unique test user ID."""
        return str(uuid.uuid4())

    async def test_get_tasks_with_english_locale(self, client: AsyncClient, test_user_id):
        """Test get tasks endpoint with English Accept-Language header."""
        response = await client.get(
            "/api/tasks/",
            headers={
                "X-User-Id": test_user_id,
                "Accept-Language": "en-US,en;q=0.9"
            }
        )

        assert response.status_code == 200
        assert isinstance(response.json(), list)

    async def test_get_tasks_with_hebrew_locale(self, client: AsyncClient, test_user_id):
        """Test get tasks endpoint with Hebrew Accept-Language header."""
        response = await client.get(
            "/api/tasks/",
            headers={
                "X-User-Id": test_user_id,
                "Accept-Language": "he-IL,he;q=0.9,en;q=0.8"
            }
        )

        assert response.status_code == 200
        assert isinstance(response.json(), list)

    async def test_get_active_tasks_with_locale(self, client: AsyncClient, test_user_id):
        """Test get active tasks endpoint with locale detection."""
        response = await client.get(
            "/api/tasks/active",
            headers={
                "X-User-Id": test_user_id,
                "Accept-Language": "he;q=0.9,en;q=0.8"
            }
        )

        assert response.status_code == 200
        assert isinstance(response.json(), list)

    async def test_get_snoozed_tasks_with_locale(self, client: AsyncClient, test_user_id):
        """Test get snoozed tasks endpoint with locale detection."""
        response = await client.get(
            "/api/tasks/snoozed",
            headers={
                "X-User-Id": test_user_id,
                "Accept-Language": "en-GB,en;q=0.9"
            }
        )

        assert response.status_code == 200
        assert isinstance(response.json(), list)

    async def test_get_single_task_with_locale(self, client: AsyncClient, test_user_id):
        """Test get single task endpoint with locale detection."""
        # First create a task
        create_response = await client.post(
            "/api/tasks/",
            headers={"X-User-Id": test_user_id},
            json={
                "title": "Test Task",
                "description": "Test Description",
                "priority": "medium",
                "completed": False,
                "status": "active",
                "source": "manual"
            }
        )
        
        assert create_response.status_code == 200
        task_id = create_response.json()["id"]

        # Now get the task with locale
        response = await client.get(
            f"/api/tasks/{task_id}",
            headers={
                "X-User-Id": test_user_id,
                "Accept-Language": "he-IL,he;q=0.9"
            }
        )

        assert response.status_code == 200
        task_data = response.json()
        assert task_data["id"] == task_id
        assert "snooze_options" in task_data

    async def test_snooze_task_with_locale(self, client: AsyncClient, test_user_id):
        """Test snooze task endpoint with locale detection."""
        # First create a task
        create_response = await client.post(
            "/api/tasks/",
            headers={"X-User-Id": test_user_id},
            json={
                "title": "Test Task for Snoozing",
                "description": "Test Description",
                "priority": "medium",
                "completed": False,
                "status": "active",
                "source": "manual"
            }
        )
        
        assert create_response.status_code == 200
        task_id = create_response.json()["id"]

        # Now snooze the task with Hebrew locale
        response = await client.post(
            f"/api/tasks/{task_id}/snooze",
            headers={
                "X-User-Id": test_user_id,
                "Accept-Language": "he-IL,he;q=0.9,en;q=0.8"
            },
            json={"snooze_option": "context_sensitive"}
        )

        assert response.status_code == 200
        task_data = response.json()
        assert task_data["status"] == "snoozed"
        assert task_data["snoozed_until"] is not None

    async def test_tasks_without_accept_language_header(self, client: AsyncClient, test_user_id):
        """Test task endpoints without Accept-Language header default to English."""
        response = await client.get(
            "/api/tasks/",
            headers={"X-User-Id": test_user_id}
        )

        assert response.status_code == 200
        assert isinstance(response.json(), list)

    async def test_complex_accept_language_headers(self, client: AsyncClient, test_user_id):
        """Test task endpoints with complex Accept-Language headers."""
        test_cases = [
            # Chrome-like header with Hebrew preference
            "he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7",
            # Firefox with quality values
            "he,en-US;q=0.7,en;q=0.3",
            # Edge case with very specific quality values
            "he-IL;q=0.95,en-US;q=0.85,fr;q=0.1",
        ]

        for header in test_cases:
            response = await client.get(
                "/api/tasks/active",
                headers={
                    "X-User-Id": test_user_id,
                    "Accept-Language": header
                }
            )
            assert response.status_code == 200, f"Failed for header: {header}"
            assert isinstance(response.json(), list)


@pytest.mark.integration
class TestLocaleLoggingIntegration:
    """Integration tests for locale information in API response logging."""

    @pytest.fixture
    def test_user_id(self):
        """Generate a unique test user ID."""
        return str(uuid.uuid4())

    async def test_locale_logging_in_task_endpoints(self, client: AsyncClient, test_user_id, caplog):
        """Test that locale information is properly logged in task endpoints."""
        import logging
        
        # Set log level to capture info messages
        caplog.set_level(logging.INFO)

        response = await client.get(
            "/api/tasks/",
            headers={
                "X-User-Id": test_user_id,
                "Accept-Language": "he-IL,he;q=0.9,en;q=0.8"
            }
        )

        assert response.status_code == 200
        
        # Check that locale information was logged
        log_messages = [record.message for record in caplog.records]
        locale_logs = [msg for msg in log_messages if "Locale: he" in msg and "Accept-Language:" in msg]
        assert len(locale_logs) > 0, f"No locale logging found in: {log_messages}"

    async def test_locale_logging_in_image_analysis(self, client: AsyncClient, test_user_id, caplog):
        """Test that locale information is properly logged in image analysis endpoint."""
        import logging
        from PIL import Image
        import io
        
        # Set log level to capture info messages
        caplog.set_level(logging.INFO)
        
        # Create a minimal valid JPEG image
        img = Image.new('RGB', (1, 1), color='red')
        img_bytes = io.BytesIO()
        img.save(img_bytes, format='JPEG')
        sample_image_data = img_bytes.getvalue()

        with patch('app.images.create_image_processing_service') as mock_service_factory:
            mock_service = MagicMock(spec=ImageProcessingService)
            mock_service.analyze_image_and_generate_tasks.return_value = {
                "image_metadata": {"original_size": 100, "processed_size": 80},
                "analysis_summary": "Test analysis",
                "tasks": [],
                "processing_time": 1.0,
                "provider_used": "test",
                "retry_count": 0
            }
            mock_service_factory.return_value = mock_service

            response = await client.post(
                "/api/images/analyze",
                headers={
                    "X-User-Id": test_user_id,
                    "Accept-Language": "he-IL,he;q=0.9,en;q=0.8"
                },
                files={"image": ("test.jpg", sample_image_data, "image/jpeg")},
                data={"generate_tasks": "true"}
            )

        assert response.status_code == 200
        
        # Check that locale information was logged
        log_messages = [record.message for record in caplog.records]
        locale_logs = [msg for msg in log_messages if "Locale: he" in msg and "Accept-Language:" in msg]
        assert len(locale_logs) > 0, f"No locale logging found in: {log_messages}"