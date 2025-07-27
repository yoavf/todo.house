#!/usr/bin/env python3
"""Manual test script for image analysis endpoint."""

import io
import uuid
import requests
from PIL import Image

def create_test_image():
    """Create a simple test image."""
    image = Image.new("RGB", (200, 200), color="red")
    buffer = io.BytesIO()
    image.save(buffer, format="JPEG")
    buffer.seek(0)
    return buffer.getvalue()

def test_endpoint():
    """Test the image analysis endpoint manually."""
    # Create test image
    image_data = create_test_image()
    test_user_id = str(uuid.uuid4())
    
    # Test without generating tasks (should work without AI provider)
    print("Testing image analysis without task generation...")
    
    try:
        response = requests.post(
            "http://localhost:8000/api/images/analyze",
            headers={"x-user-id": test_user_id},
            files={"image": ("test.jpg", image_data, "image/jpeg")},
            data={"generate_tasks": "false"}
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            print("✓ Endpoint working correctly!")
        else:
            print("✗ Endpoint returned error")
            
    except requests.exceptions.ConnectionError:
        print("Server not running. Start with: uv run uvicorn app.main:app --reload")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_endpoint()