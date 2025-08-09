"""
Unit tests for images.py API endpoints.
Tests the REST API endpoints for image analysis and retrieval.
"""

import pytest
import uuid
from datetime import datetime, timezone
from unittest.mock import Mock, AsyncMock, patch
from fastapi import HTTPException, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import Image as ImageModel, User as UserModel


@pytest.fixture
def mock_session():
    """Create a mock async session."""
    session = AsyncMock(spec=AsyncSession)
    session.execute = AsyncMock()
    session.commit = AsyncMock()
    session.refresh = AsyncMock()
    session.add = Mock()
    return session


@pytest.fixture
def mock_current_user():
    """Create a mock current user."""
    user = Mock(spec=UserModel)
    user.id = uuid.uuid4()
    user.email = "test@example.com"
    user.name = "Test User"
    return user


@pytest.fixture
def mock_image_record():
    """Create a mock image database record."""
    image = Mock(spec=ImageModel)
    image.id = uuid.uuid4()
    image.user_id = str(uuid.uuid4())
    image.storage_path = "images/test-image.jpg"
    image.filename = "test-image.jpg"
    image.content_type = "image/jpeg"
    image.file_size = 1024
    image.created_at = datetime.now(timezone.utc)
    image.analysis_status = "completed"
    return image


@pytest.fixture
def mock_upload_file():
    """Create a mock upload file."""
    file = Mock(spec=UploadFile)
    file.filename = "test.jpg"
    file.content_type = "image/jpeg"
    file.size = 1024
    file.read = AsyncMock(return_value=b"fake image data")
    return file


class TestGetImageEndpoint:
    """Test the GET /api/images/{image_id} endpoint."""

    @pytest.mark.asyncio
    @patch("app.images.storage")
    async def test_get_image_success(
        self, mock_storage, mock_session, mock_current_user, mock_image_record
    ):
        """Test successful image retrieval."""
        from app.images import get_image

        # Setup mocks
        mock_image_record.user_id = str(mock_current_user.id)
        mock_result = Mock()
        mock_result.scalar_one_or_none.return_value = mock_image_record
        mock_session.execute.return_value = mock_result

        mock_storage.get_public_url.return_value = (
            "https://storage.example.com/images/test-image.jpg"
        )

        # Call endpoint
        result = await get_image(
            image_id=mock_image_record.id,
            current_user=mock_current_user,
            session=mock_session,
        )

        # Verify response
        assert result["id"] == mock_image_record.id
        assert result["url"] == "https://storage.example.com/images/test-image.jpg"
        assert (
            result["thumbnail_url"]
            == "https://storage.example.com/images/test-image.jpg?width=200&height=200&resize=contain&quality=80"
        )
        assert result["filename"] == mock_image_record.filename
        assert result["content_type"] == mock_image_record.content_type
        assert result["file_size"] == mock_image_record.file_size
        assert result["analysis_status"] == mock_image_record.analysis_status

    @pytest.mark.asyncio
    async def test_get_image_not_found(self, mock_session, mock_current_user):
        """Test image not found returns 404."""
        from app.images import get_image

        # Setup mock to return no image
        mock_result = Mock()
        mock_result.scalar_one_or_none.return_value = None
        mock_session.execute.return_value = mock_result

        # Call endpoint and expect 404
        with pytest.raises(HTTPException) as exc_info:
            await get_image(
                image_id=uuid.uuid4(),
                current_user=mock_current_user,
                session=mock_session,
            )

        assert exc_info.value.status_code == 404
        assert exc_info.value.detail == "Image not found"

    @pytest.mark.asyncio
    async def test_get_image_wrong_user(
        self, mock_session, mock_current_user, mock_image_record
    ):
        """Test that user can't access another user's image."""
        from app.images import get_image

        # Setup mock - image belongs to different user
        mock_image_record.user_id = str(uuid.uuid4())  # Different user ID
        mock_result = Mock()
        mock_result.scalar_one_or_none.return_value = None  # Query returns nothing
        mock_session.execute.return_value = mock_result

        # Call endpoint and expect 404
        with pytest.raises(HTTPException) as exc_info:
            await get_image(
                image_id=mock_image_record.id,
                current_user=mock_current_user,
                session=mock_session,
            )

        assert exc_info.value.status_code == 404
        assert exc_info.value.detail == "Image not found"

    @pytest.mark.asyncio
    @patch("app.images.storage")
    async def test_get_image_database_error(
        self, mock_storage, mock_session, mock_current_user
    ):
        """Test database error handling."""
        from app.images import get_image

        # Setup mock to raise database error
        mock_session.execute.side_effect = Exception("Database connection lost")

        # Call endpoint and expect 500
        with pytest.raises(HTTPException) as exc_info:
            await get_image(
                image_id=uuid.uuid4(),
                current_user=mock_current_user,
                session=mock_session,
            )

        assert exc_info.value.status_code == 500
        assert exc_info.value.detail == "Failed to retrieve image"


class TestHealthCheckEndpoint:
    """Test the GET /api/images/health endpoint."""

    @pytest.mark.asyncio
    @patch("app.images.config")
    async def test_health_check_all_healthy(self, mock_config):
        """Test health check when all services are healthy."""
        from app.images import health_check

        # Setup mocks
        mock_config.ai.gemini_api_key = "test-key"
        mock_config.ai.default_provider = "gemini"
        mock_config.image.supported_formats = [".jpg", ".png"]
        mock_config.image.max_image_size_mb = 10

        # Call endpoint
        result = await health_check()

        # Verify response
        assert result["status"] == "healthy"
        assert result["ai_provider_configured"] is True
        assert result["default_provider"] == "gemini"
        assert result["supported_formats"] == [".jpg", ".png"]
        assert result["max_image_size_mb"] == 10
        assert result["database"] == "connected"

    @pytest.mark.asyncio
    @patch("app.images.config")
    async def test_health_check_no_ai_configured(self, mock_config):
        """Test health check when no AI provider is configured."""
        from app.images import health_check

        # Setup mocks - no API key
        mock_config.ai.gemini_api_key = None
        mock_config.ai.default_provider = None
        mock_config.image.supported_formats = [".jpg"]
        mock_config.image.max_image_size_mb = 5

        # Call endpoint
        result = await health_check()

        # Verify response
        assert result["status"] == "healthy"
        assert result["ai_provider_configured"] is False
        assert result["default_provider"] is None


class TestImageProxyEndpoint:
    """Test the GET /api/images/proxy/{image_id} endpoint."""

    @pytest.mark.asyncio
    @patch("app.images.storage")
    async def test_proxy_image_success(
        self, mock_storage, mock_session, mock_image_record
    ):
        """Test successful image proxy retrieval."""
        from app.images import proxy_image

        # Setup mocks
        mock_result = Mock()
        mock_result.scalar_one_or_none.return_value = mock_image_record
        mock_session.execute.return_value = mock_result

        # Mock storage download
        image_data = b"fake image content"
        mock_storage.download_file = AsyncMock(return_value=image_data)

        # Call endpoint
        response = await proxy_image(
            image_id=str(mock_image_record.id), session=mock_session
        )

        # Verify response is StreamingResponse
        from fastapi.responses import StreamingResponse

        assert isinstance(response, StreamingResponse)
        assert response.media_type == mock_image_record.content_type

        # Read the streaming content
        content = b""
        async for chunk in response.body_iterator:
            content += chunk
        assert content == image_data

    @pytest.mark.asyncio
    async def test_proxy_image_not_found(self, mock_session):
        """Test proxy returns 404 for non-existent image."""
        from app.images import proxy_image

        # Setup mock to return no image
        mock_result = Mock()
        mock_result.scalar_one_or_none.return_value = None
        mock_session.execute.return_value = mock_result

        # Call endpoint and expect 404
        with pytest.raises(HTTPException) as exc_info:
            await proxy_image(image_id=str(uuid.uuid4()), session=mock_session)

        assert exc_info.value.status_code == 404
        assert exc_info.value.detail == "Image not found"

    @pytest.mark.asyncio
    @patch("app.images.storage")
    async def test_proxy_image_storage_error(
        self, mock_storage, mock_session, mock_image_record
    ):
        """Test proxy handles storage download errors."""
        from app.images import proxy_image

        # Setup mocks
        mock_result = Mock()
        mock_result.scalar_one_or_none.return_value = mock_image_record
        mock_session.execute.return_value = mock_result

        # Mock storage error
        mock_storage.download_file = AsyncMock(
            side_effect=Exception("Storage unavailable")
        )

        # Call endpoint and expect 500
        with pytest.raises(HTTPException) as exc_info:
            await proxy_image(image_id=str(mock_image_record.id), session=mock_session)

        assert exc_info.value.status_code == 500
        assert exc_info.value.detail == "Failed to retrieve image from storage"

    @pytest.mark.asyncio
    @patch("app.images.storage")
    async def test_proxy_image_invalid_id_format(self, mock_storage, mock_session):
        """Test proxy handles invalid UUID format."""
        from app.images import proxy_image

        # Call endpoint with invalid UUID and expect 400
        with pytest.raises(HTTPException) as exc_info:
            await proxy_image(image_id="not-a-uuid", session=mock_session)

        assert exc_info.value.status_code == 400
        assert exc_info.value.detail == "Invalid image ID format"


class TestUpdateImageAnalysisStatus:
    """Test the update_image_analysis_status function."""

    @pytest.mark.asyncio
    async def test_update_status_success(self, mock_session):
        """Test successful status update."""
        from app.images import update_image_analysis_status

        # Setup mock image
        mock_image = Mock(spec=ImageModel)
        mock_image.analysis_status = "pending"

        mock_result = Mock()
        mock_result.scalar_one_or_none.return_value = mock_image
        mock_session.execute.return_value = mock_result

        # Call function
        await update_image_analysis_status(
            session=mock_session, image_id=uuid.uuid4(), status="completed"
        )

        # Verify status was updated
        assert mock_image.analysis_status == "completed"
        mock_session.commit.assert_called_once()

    @pytest.mark.asyncio
    async def test_update_status_image_not_found(self, mock_session):
        """Test status update when image not found."""
        from app.images import update_image_analysis_status

        # Setup mock - no image found
        mock_result = Mock()
        mock_result.scalar_one_or_none.return_value = None
        mock_session.execute.return_value = mock_result

        # Call function - should not raise exception
        await update_image_analysis_status(
            session=mock_session, image_id=uuid.uuid4(), status="completed"
        )

        # Verify no commit was called
        mock_session.commit.assert_not_called()

    @pytest.mark.asyncio
    async def test_update_status_database_error(self, mock_session):
        """Test status update handles database errors gracefully."""
        from app.images import update_image_analysis_status

        # Setup mock to raise error
        mock_session.execute.side_effect = Exception("Database error")

        # Call function - should not raise exception (logs warning instead)
        await update_image_analysis_status(
            session=mock_session, image_id=uuid.uuid4(), status="completed"
        )

        # Function should complete without raising
        mock_session.commit.assert_not_called()
