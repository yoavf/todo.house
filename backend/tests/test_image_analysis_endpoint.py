"""Tests for image analysis API endpoint."""

import io
import uuid
import pytest
import pytest_asyncio
from PIL import Image
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from unittest.mock import patch
from app.database import User as UserModel

# Use a valid UUID for testing
TEST_USER_ID = str(uuid.uuid4())


@pytest.fixture(autouse=True)
def mock_ai_provider():
    """Mock the AI provider to prevent real API calls during tests."""
    with patch("app.images.config.ai.gemini_api_key", None):
        # This ensures create_image_processing_service won't create a real provider
        yield


@pytest_asyncio.fixture
async def setup_test_user(db_session: AsyncSession):
    """Create a test user for the tests."""
    # Create test user using SQLAlchemy
    db_user = UserModel(
        id=uuid.UUID(TEST_USER_ID),
        email=f"test-{TEST_USER_ID}@example.com",
    )

    db_session.add(db_user)
    await db_session.commit()
    await db_session.refresh(db_user)

    yield TEST_USER_ID

    # Cleanup is handled by the test transaction rollback


def create_test_image(format="JPEG", size=(100, 100)) -> bytes:
    """Create a test image in memory."""
    image = Image.new("RGB", size, color="red")
    buffer = io.BytesIO()
    image.save(buffer, format=format)
    buffer.seek(0)
    return buffer.getvalue()


@pytest.mark.asyncio
async def test_analyze_image_endpoint_exists(
    client: AsyncClient, setup_test_user, auth_headers: dict
):
    """Test that the analyze image endpoint exists and returns proper error for missing file."""
    response = await client.post(
        "/api/images/analyze",
        headers=auth_headers,
        data={"generate_tasks": "true"},
    )
    # Should return 422 for missing file
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_analyze_image_with_valid_image(
    client: AsyncClient, setup_test_user, auth_headers: dict
):
    """Test image analysis with a valid image file."""
    # Create test image
    image_data = create_test_image()

    # Test the endpoint
    response = await client.post(
        "/api/images/analyze",
        headers=auth_headers,
        files={"image": ("test.jpg", image_data, "image/jpeg")},
        data={"generate_tasks": "true"},
    )

    # Without AI provider configured, should return 200 with no tasks
    assert response.status_code == 200
    data = response.json()
    assert "analysis_summary" in data
    assert "tasks" in data
    assert data["tasks"] == []  # No tasks generated without AI provider
    assert data["provider_used"] == "none"


@pytest.mark.asyncio
async def test_analyze_image_without_tasks(
    client: AsyncClient, setup_test_user, auth_headers: dict
):
    """Test image analysis without generating tasks."""
    image_data = create_test_image()

    response = await client.post(
        "/api/images/analyze",
        headers=auth_headers,
        files={"image": ("test.jpg", image_data, "image/jpeg")},
        data={"generate_tasks": "false"},
    )

    # Should succeed even without AI provider since no tasks are generated
    assert response.status_code == 200

    data = response.json()
    assert "analysis_summary" in data
    assert "tasks" in data
    assert data["tasks"] == []  # No tasks should be generated
    assert data["image_id"] is None  # No image record should be created


@pytest.mark.asyncio
async def test_analyze_image_invalid_format(
    client: AsyncClient, setup_test_user, auth_headers: dict
):
    """Test image analysis with invalid file format."""
    # Create a text file instead of image
    text_data = b"This is not an image"

    response = await client.post(
        "/api/images/analyze",
        headers=auth_headers,
        files={"image": ("test.txt", text_data, "text/plain")},
        data={"generate_tasks": "true"},
    )

    # Should return 400 for invalid image
    assert response.status_code == 400
    data = response.json()
    # HTTPException puts the error details in the 'detail' field
    detail = data["detail"]
    assert detail["error_code"] == "INVALID_IMAGE"


@pytest.mark.asyncio
async def test_analyze_image_missing_user_id(unauthenticated_client: AsyncClient):
    """Test image analysis without user ID header."""
    image_data = create_test_image()

    response = await unauthenticated_client.post(
        "/api/images/analyze",
        files={"image": ("test.jpg", image_data, "image/jpeg")},
        data={"generate_tasks": "true"},
    )

    # Should return 401 for missing authentication
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_health_check_endpoint(client: AsyncClient):
    """Test the health check endpoint."""
    response = await client.get("/api/health")

    # Should always return some status
    assert response.status_code == 200

    data = response.json()
    assert "status" in data
    assert data["status"] in ["healthy", "error"]

    if data["status"] == "healthy":
        assert "database" in data
        assert "sqlalchemy" in data


@pytest.mark.asyncio
async def test_analyze_image_empty_file(
    client: AsyncClient, setup_test_user, auth_headers: dict
):
    """Test image analysis with empty file."""
    response = await client.post(
        "/api/images/analyze",
        headers=auth_headers,
        files={"image": ("empty.jpg", b"", "image/jpeg")},
        data={"generate_tasks": "true"},
    )

    # Should return 400 for empty file
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_analyze_image_with_prompt_override(
    client: AsyncClient, setup_test_user, auth_headers: dict
):
    """Test image analysis with custom prompt."""
    image_data = create_test_image()

    response = await client.post(
        "/api/images/analyze",
        headers=auth_headers,
        files={"image": ("test.jpg", image_data, "image/jpeg")},
        data={"generate_tasks": "true", "prompt_override": "Custom test prompt"},
    )

    # Without AI provider configured, should return 200 with no tasks
    assert response.status_code == 200
    data = response.json()
    assert "analysis_summary" in data
    assert "tasks" in data
    assert data["tasks"] == []  # No tasks generated without AI provider
    assert data["provider_used"] == "none"
