#!/usr/bin/env python3
"""
Example script demonstrating how to use the image analysis API endpoint.

This script shows how to:
1. Create a test image programmatically
2. Authenticate with JWT token
3. Send image to the analysis endpoint
4. Handle the response

Usage:
    python examples/image_analysis_demo.py

Prerequisites:
    - Server running on localhost:8000
    - pip install requests pillow pyjwt
"""

import io
import uuid
import requests
from PIL import Image
from datetime import datetime, timezone, timedelta
import jwt


def create_test_image(color="red", size=(200, 200)):
    """
    Create a simple test image.

    Args:
        color: Color name for the image background
        size: Tuple of (width, height) for image dimensions

    Returns:
        bytes: JPEG image data
    """
    image = Image.new("RGB", size, color=color)
    buffer = io.BytesIO()
    image.save(buffer, format="JPEG", quality=85)
    buffer.seek(0)
    return buffer.getvalue()


def create_test_jwt_token(user_id: str) -> str:
    """
    Create a test JWT token for authentication.

    Args:
        user_id: The user ID to include in the token

    Returns:
        str: JWT token
    """
    # Use test secret for demo (in production, this would be a secure secret)
    secret = "test-secret-key-for-jwt-encoding"

    payload = {
        "sub": user_id,
        "email": f"demo-{user_id}@example.com",
        "name": "Demo User",
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(hours=1),
    }

    return jwt.encode(payload, secret, algorithm="HS256")


def demo_image_analysis():
    """Demonstrate how to use the image analysis endpoint."""
    print("🖼️  Image Analysis API Demo")
    print("=" * 40)

    # Create test image and authentication
    print("Creating test image and authentication...")
    image_data = create_test_image()
    test_user_id = str(uuid.uuid4())
    jwt_token = create_test_jwt_token(test_user_id)
    auth_headers = {"Authorization": f"Bearer {jwt_token}"}

    # Demo 1: Analysis without task generation
    print("\n📋 Demo 1: Image analysis without task generation")
    try:
        response = requests.post(
            "http://localhost:8000/api/images/analyze",
            headers=auth_headers,
            files={"image": ("demo.jpg", image_data, "image/jpeg")},
            data={"generate_tasks": "false"},
        )

        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print("✅ Success!")
            print(f"   Processing time: {data.get('processing_time', 0):.2f}s")
            print(f"   Provider used: {data.get('provider_used', 'none')}")
            print(f"   Analysis summary: {data.get('analysis_summary', 'N/A')}")
        else:
            print(f"❌ Error: {response.text}")

    except requests.exceptions.ConnectionError:
        print("❌ Server not running. Start with:")
        print("   uv run uvicorn app.main:app --reload")
        return
    except Exception as e:
        print(f"❌ Error: {e}")
        return

    # Demo 2: Analysis with task generation (if AI provider configured)
    print("\n🤖 Demo 2: Image analysis with task generation")
    try:
        response = requests.post(
            "http://localhost:8000/api/images/analyze",
            headers=auth_headers,
            files={"image": ("demo.jpg", image_data, "image/jpeg")},
            data={"generate_tasks": "true"},
        )

        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print("✅ Success!")
            print(f"   Tasks generated: {len(data.get('tasks', []))}")
            for i, task in enumerate(data.get("tasks", []), 1):
                print(
                    f"   Task {i}: {task.get('title', 'N/A')} ({task.get('priority', 'medium')})"
                )
        elif response.status_code == 503:
            print("⚠️  AI service unavailable (no API key configured)")
        else:
            print(f"❌ Error: {response.text}")

    except Exception as e:
        print(f"❌ Error: {e}")

    # Demo 3: Health check
    print("\n🏥 Demo 3: Health check")
    try:
        response = requests.get("http://localhost:8000/api/images/health")
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print("✅ Service healthy!")
            print(f"   AI configured: {data.get('ai_provider_configured', False)}")
            print(
                f"   Supported formats: {', '.join(data.get('supported_formats', []))}"
            )
            print(f"   Max image size: {data.get('max_image_size_mb', 0)}MB")
        else:
            print(f"❌ Service unhealthy: {response.text}")
    except Exception as e:
        print(f"❌ Error: {e}")

    print("\n🎉 Demo complete!")


if __name__ == "__main__":
    demo_image_analysis()
