"""Tests for image analysis API endpoint."""

import io
import uuid
import pytest
from PIL import Image
from fastapi.testclient import TestClient
from app.main import app
from app.database import supabase

client = TestClient(app)

# Use a valid UUID for testing
TEST_USER_ID = str(uuid.uuid4())


@pytest.fixture(scope="module", autouse=True)
def setup_test_user():
    """Create a test user for the tests."""
    try:
        # Create test user
        supabase.table("users").insert(
            {"id": TEST_USER_ID, "email": f"test-{TEST_USER_ID}@example.com"}
        ).execute()
        yield
        # Cleanup - delete test user (cascade will delete related records)
        supabase.table("users").delete().eq("id", TEST_USER_ID).execute()
    except Exception:
        # If user already exists or other error, continue with tests
        yield


def create_test_image(format="JPEG", size=(100, 100)) -> bytes:
    """Create a test image in memory."""
    image = Image.new("RGB", size, color="red")
    buffer = io.BytesIO()
    image.save(buffer, format=format)
    buffer.seek(0)
    return buffer.getvalue()


def test_analyze_image_endpoint_exists():
    """Test that the analyze image endpoint exists and returns proper error for missing file."""
    response = client.post(
        "/api/images/analyze",
        headers={"x-user-id": TEST_USER_ID},
        data={"generate_tasks": "true"},
    )
    # Should return 422 for missing file
    assert response.status_code == 422


def test_analyze_image_with_valid_image():
    """Test image analysis with a valid image file."""
    # Create test image
    image_data = create_test_image()

    # Test the endpoint
    response = client.post(
        "/api/images/analyze",
        headers={"x-user-id": TEST_USER_ID},
        files={"image": ("test.jpg", image_data, "image/jpeg")},
        data={"generate_tasks": "true"},
    )

    # Should succeed or return service unavailable if AI not configured
    assert response.status_code in [200, 503]

    if response.status_code == 200:
        data = response.json()
        assert "analysis_summary" in data
        assert "tasks" in data
        assert "processing_time" in data
        assert "provider_used" in data
        assert isinstance(data["tasks"], list)


def test_analyze_image_without_tasks():
    """Test image analysis without generating tasks."""
    image_data = create_test_image()

    response = client.post(
        "/api/images/analyze",
        headers={"x-user-id": TEST_USER_ID},
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


def test_analyze_image_invalid_format():
    """Test image analysis with invalid file format."""
    # Create a text file instead of image
    text_data = b"This is not an image"

    response = client.post(
        "/api/images/analyze",
        headers={"x-user-id": TEST_USER_ID},
        files={"image": ("test.txt", text_data, "text/plain")},
        data={"generate_tasks": "true"},
    )

    # Should return 400 for invalid image
    assert response.status_code == 400
    data = response.json()
    assert data["error_code"] == "INVALID_IMAGE"


def test_analyze_image_missing_user_id():
    """Test image analysis without user ID header."""
    image_data = create_test_image()

    response = client.post(
        "/api/images/analyze",
        files={"image": ("test.jpg", image_data, "image/jpeg")},
        data={"generate_tasks": "true"},
    )

    # Should return 422 for missing header
    assert response.status_code == 422


def test_health_check_endpoint():
    """Test the health check endpoint."""
    response = client.get("/api/images/health")

    # Should always return some status
    assert response.status_code in [200, 503]

    data = response.json()
    assert "status" in data

    if response.status_code == 200:
        assert "ai_provider_configured" in data
        assert "supported_formats" in data
        assert "max_image_size_mb" in data


def test_analyze_image_empty_file():
    """Test image analysis with empty file."""
    response = client.post(
        "/api/images/analyze",
        headers={"x-user-id": TEST_USER_ID},
        files={"image": ("empty.jpg", b"", "image/jpeg")},
        data={"generate_tasks": "true"},
    )

    # Should return 400 for empty file
    assert response.status_code == 400


def test_analyze_image_with_prompt_override():
    """Test image analysis with custom prompt."""
    image_data = create_test_image()

    response = client.post(
        "/api/images/analyze",
        headers={"x-user-id": TEST_USER_ID},
        files={"image": ("test.jpg", image_data, "image/jpeg")},
        data={"generate_tasks": "true", "prompt_override": "Custom test prompt"},
    )

    # Should succeed or return service unavailable
    assert response.status_code in [200, 503]
