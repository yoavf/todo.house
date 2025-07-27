"""
Integration tests for AI task endpoints.
"""
import uuid
from fastapi.testclient import TestClient
from app.main import app


client = TestClient(app)


def create_test_image(user_id: str, image_id: str = None) -> str:
    """Helper function to create a test image in the database"""
    from app.database import supabase
    
    if image_id is None:
        image_id = str(uuid.uuid4())
    
    image_data = {
        "id": image_id,
        "user_id": user_id,
        "filename": f"test_image_{image_id[:8]}.jpg",
        "content_type": "image/jpeg",
        "file_size": 1024,
        "storage_path": f"/test/{image_id}.jpg",
        "analysis_status": "completed"
    }
    supabase.table("images").insert(image_data).execute()
    return image_id


class TestAITaskEndpoints:
    """Test AI-related task endpoints"""
    
    def test_create_ai_task(self, setup_test_user):
        """Test creating an AI-generated task"""
        user_id = setup_test_user
        image_id = create_test_image(user_id)
        
        ai_task_data = {
            "title": "Fix leaky faucet",
            "description": "Repair visible water leak in bathroom sink",
            "priority": "high",
            "source_image_id": image_id,
            "ai_confidence": 0.92,
            "ai_provider": "gemini-1.5-flash"
        }
        
        response = client.post(
            "/api/tasks/ai",
            json=ai_task_data,
            headers={"x-user-id": user_id}
        )
        
        assert response.status_code == 200
        task = response.json()
        
        assert task["title"] == "Fix leaky faucet"
        assert task["source"] == "ai_generated"
        assert task["source_image_id"] == image_id
        assert task["ai_confidence"] == 0.92
        assert task["ai_provider"] == "gemini-1.5-flash"
    
    def test_get_ai_generated_tasks(self, setup_test_user):
        """Test retrieving AI-generated tasks"""
        user_id = setup_test_user
        image_id = create_test_image(user_id)
        
        # First create an AI task
        ai_task_data = {
            "title": "Clean bathroom mirror",
            "description": "Remove water spots",
            "priority": "medium",
            "source_image_id": image_id,
            "ai_confidence": 0.78,
            "ai_provider": "gemini"
        }
        
        client.post(
            "/api/tasks/ai",
            json=ai_task_data,
            headers={"x-user-id": user_id}
        )
        
        # Also create a manual task for comparison
        manual_task_data = {
            "title": "Manual task",
            "description": "Created by user"
        }
        
        client.post(
            "/api/tasks/",
            json=manual_task_data,
            headers={"x-user-id": user_id}
        )
        
        # Get AI-generated tasks
        response = client.get(
            "/api/tasks/ai-generated",
            headers={"x-user-id": user_id}
        )
        
        if response.status_code != 200:
            print(f"Response status: {response.status_code}")
            print(f"Response body: {response.text}")
        
        assert response.status_code == 200
        tasks = response.json()
        
        # Should only return AI-generated tasks
        assert len(tasks) == 1
        assert tasks[0]["source"] == "ai_generated"
        assert tasks[0]["title"] == "Clean bathroom mirror"
    
    def test_get_ai_generated_tasks_with_image_filter(self, setup_test_user):
        """Test filtering AI tasks by image ID"""
        user_id = setup_test_user
        image_id_1 = create_test_image(user_id)
        image_id_2 = create_test_image(user_id)
        
        # Create tasks from different images
        task1_data = {
            "title": "Task from image 1",
            "description": "First task",
            "source_image_id": image_id_1,
            "ai_confidence": 0.8,
            "ai_provider": "gemini"
        }
        
        task2_data = {
            "title": "Task from image 2", 
            "description": "Second task",
            "source_image_id": image_id_2,
            "ai_confidence": 0.9,
            "ai_provider": "gemini"
        }
        
        client.post("/api/tasks/ai", json=task1_data, headers={"x-user-id": user_id})
        client.post("/api/tasks/ai", json=task2_data, headers={"x-user-id": user_id})
        
        # Filter by specific image
        response = client.get(
            f"/api/tasks/ai-generated?image_id={image_id_1}",
            headers={"x-user-id": user_id}
        )
        
        assert response.status_code == 200
        tasks = response.json()
        
        assert len(tasks) == 1
        assert tasks[0]["source_image_id"] == image_id_1
        assert tasks[0]["title"] == "Task from image 1"
    
    def test_get_ai_generated_tasks_with_confidence_filter(self, setup_test_user):
        """Test filtering AI tasks by minimum confidence"""
        user_id = setup_test_user
        image_id = create_test_image(user_id)
        
        # Create tasks with different confidence levels
        high_conf_task = {
            "title": "High confidence task",
            "description": "Very confident",
            "source_image_id": image_id,
            "ai_confidence": 0.95,
            "ai_provider": "gemini"
        }
        
        low_conf_task = {
            "title": "Low confidence task",
            "description": "Less confident", 
            "source_image_id": image_id,
            "ai_confidence": 0.4,
            "ai_provider": "gemini"
        }
        
        client.post("/api/tasks/ai", json=high_conf_task, headers={"x-user-id": user_id})
        client.post("/api/tasks/ai", json=low_conf_task, headers={"x-user-id": user_id})
        
        # Filter by minimum confidence
        response = client.get(
            "/api/tasks/ai-generated?min_confidence=0.8",
            headers={"x-user-id": user_id}
        )
        
        assert response.status_code == 200
        tasks = response.json()
        
        assert len(tasks) == 1
        assert tasks[0]["ai_confidence"] == 0.95
        assert tasks[0]["title"] == "High confidence task"
    
    def test_get_manual_tasks(self, setup_test_user):
        """Test retrieving manually created tasks"""
        user_id = setup_test_user
        image_id = create_test_image(user_id)
        
        # Create both manual and AI tasks
        manual_task_data = {
            "title": "Manual task",
            "description": "Created by user"
        }
        
        ai_task_data = {
            "title": "AI task",
            "description": "Created by AI",
            "source_image_id": image_id,
            "ai_confidence": 0.8,
            "ai_provider": "gemini"
        }
        
        client.post("/api/tasks/", json=manual_task_data, headers={"x-user-id": user_id})
        client.post("/api/tasks/ai", json=ai_task_data, headers={"x-user-id": user_id})
        
        # Get manual tasks
        response = client.get(
            "/api/tasks/manual",
            headers={"x-user-id": user_id}
        )
        
        assert response.status_code == 200
        tasks = response.json()
        
        # Should only return manual tasks
        assert len(tasks) == 1
        assert tasks[0]["source"] == "manual"
        assert tasks[0]["title"] == "Manual task"
    
    def test_ai_task_validation(self, setup_test_user):
        """Test validation for AI task creation"""
        user_id = setup_test_user
        
        # Missing required AI fields
        invalid_task_data = {
            "title": "Invalid AI task",
            "description": "Missing AI fields"
            # Missing source_image_id, ai_confidence, ai_provider
        }
        
        response = client.post(
            "/api/tasks/ai",
            json=invalid_task_data,
            headers={"x-user-id": user_id}
        )
        
        assert response.status_code == 422  # Validation error
    
    def test_ai_confidence_validation(self, setup_test_user):
        """Test AI confidence score validation"""
        user_id = setup_test_user
        image_id = create_test_image(user_id)
        
        # Invalid confidence score (> 1.0)
        invalid_task_data = {
            "title": "Invalid confidence",
            "description": "Confidence too high",
            "source_image_id": image_id,
            "ai_confidence": 1.5,  # Invalid
            "ai_provider": "gemini"
        }
        
        response = client.post(
            "/api/tasks/ai",
            json=invalid_task_data,
            headers={"x-user-id": user_id}
        )
        
        assert response.status_code == 422  # Validation error
        
        # Invalid confidence score (< 0.0)
        invalid_task_data["ai_confidence"] = -0.1
        
        response = client.post(
            "/api/tasks/ai",
            json=invalid_task_data,
            headers={"x-user-id": user_id}
        )
        
        assert response.status_code == 422  # Validation error
    
    def test_regular_task_creation_still_works(self, setup_test_user):
        """Test that regular task creation is not affected by AI extensions"""
        user_id = setup_test_user
        
        task_data = {
            "title": "Regular task",
            "description": "Should work as before",
            "priority": "medium"
        }
        
        response = client.post(
            "/api/tasks/",
            json=task_data,
            headers={"x-user-id": user_id}
        )
        
        assert response.status_code == 200
        task = response.json()
        
        assert task["title"] == "Regular task"
        assert task["source"] == "manual"  # Should default to manual
        assert task["source_image_id"] is None
        assert task["ai_confidence"] is None
        assert task["ai_provider"] is None