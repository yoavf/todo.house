"""Integration tests for AI-enhanced task endpoints."""

import pytest
import uuid


@pytest.mark.integration
class TestTasksAIIntegration:
    """Integration tests for AI-generated task functionality."""

    @pytest.mark.asyncio
    async def test_create_ai_task_endpoint(self, client, setup_test_user, auth_headers: dict, db_session):
        """Test creating an AI-generated task through the dedicated endpoint."""
        # First create an image record
        from app.database import Image as ImageModel

        image_id = uuid.uuid4()
        db_image = ImageModel(
            id=image_id,
            user_id=uuid.UUID(setup_test_user),
            filename="test.jpg",
            content_type="image/jpeg",
            file_size=1024,
            storage_path=f"images/{setup_test_user}/{str(image_id)}",
            analysis_status="completed",
        )
        db_session.add(db_image)
        await db_session.commit()
        await db_session.refresh(db_image)

        task_data = {
            "title": "Clean bathroom grout",
            "description": "Mold visible in shower grout lines needs cleaning",
            "source": "ai_generated",
            "source_image_id": str(image_id),
            "ai_confidence": 0.85,
            "ai_provider": "gemini",
        }

        response = await client.post(
            "/api/tasks/ai-generated",
            json=task_data,
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["title"] == task_data["title"]
        assert data["source"] == "ai_generated"
        assert data["priority"] == "high"  # Should be high due to 0.85 confidence
        assert data["ai_confidence"] == 0.85
        assert data["ai_provider"] == "gemini"

    @pytest.mark.asyncio
    async def test_create_ai_task_low_confidence(
        self, client, setup_test_user, auth_headers: dict, db_session
    ):
        """Test that low confidence AI tasks get low priority."""
        # First create an image record
        from app.database import Image as ImageModel

        image_id = uuid.uuid4()
        db_image = ImageModel(
            id=image_id,
            user_id=uuid.UUID(setup_test_user),
            filename="test2.jpg",
            content_type="image/jpeg",
            file_size=2048,
            storage_path=f"images/{setup_test_user}/{str(image_id)}",
            analysis_status="completed",
        )
        db_session.add(db_image)
        await db_session.commit()
        await db_session.refresh(db_image)

        task_data = {
            "title": "Check appliance",
            "description": "Possible maintenance needed",
            "source": "ai_generated",
            "source_image_id": str(image_id),
            "ai_confidence": 0.4,
            "ai_provider": "gemini",
        }

        response = await client.post(
            "/api/tasks/ai-generated",
            json=task_data,
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["priority"] == "low"

    @pytest.mark.asyncio
    async def test_filter_tasks_by_source(self, client, setup_test_user, auth_headers: dict, db_session):
        """Test filtering tasks by source (manual vs ai_generated)."""
        # Create a manual task
        manual_task = {
            "title": "Manual task",
            "description": "Created by user",
            "priority": "medium",
        }
        await client.post(
            "/api/tasks/", json=manual_task, headers=auth_headers
        )

        # Create an AI task (first create image record)
        from app.database import Image as ImageModel

        image_id = uuid.uuid4()
        db_image = ImageModel(
            id=image_id,
            user_id=uuid.UUID(setup_test_user),
            filename="test3.jpg",
            content_type="image/jpeg",
            file_size=3072,
            storage_path=f"images/{setup_test_user}/{str(image_id)}",
            analysis_status="completed",
        )
        db_session.add(db_image)
        await db_session.commit()
        await db_session.refresh(db_image)

        ai_task = {
            "title": "AI task",
            "description": "Created by AI",
            "source": "ai_generated",
            "source_image_id": str(image_id),
            "ai_confidence": 0.7,
            "ai_provider": "gemini",
        }
        await client.post(
            "/api/tasks/ai-generated",
            json=ai_task,
            headers=auth_headers,
        )

        # Get only AI-generated tasks
        response = await client.get(
            "/api/tasks/?source=ai_generated", headers=auth_headers
        )

        assert response.status_code == 200
        tasks = response.json()
        assert len(tasks) == 1
        assert tasks[0]["title"] == "AI task"
        assert tasks[0]["source"] == "ai_generated"

        # Get only manual tasks
        response = await client.get(
            "/api/tasks/?source=manual", headers=auth_headers
        )

        assert response.status_code == 200
        tasks = response.json()
        assert len(tasks) == 1
        assert tasks[0]["title"] == "Manual task"
        assert tasks[0]["source"] == "manual"

    @pytest.mark.asyncio
    async def test_get_ai_tasks_with_images(self, client, setup_test_user, auth_headers: dict, db_session):
        """Test getting AI tasks with their source image details."""
        # First, we need to create an image record
        # In a real scenario, this would be done by the image upload endpoint
        from app.database import Image as ImageModel

        image_id = uuid.uuid4()
        db_image = ImageModel(
            id=image_id,
            user_id=uuid.UUID(setup_test_user),
            filename="test.jpg",
            content_type="image/jpeg",
            file_size=1024,
            storage_path=f"images/{str(image_id)}.jpg",
            analysis_status="completed",
        )
        db_session.add(db_image)
        await db_session.commit()
        await db_session.refresh(db_image)

        # Create AI task linked to the image
        task_data = {
            "title": "Fix water damage",
            "description": "Water stains on ceiling",
            "source": "ai_generated",
            "source_image_id": str(image_id),
            "ai_confidence": 0.9,
            "ai_provider": "gemini",
        }

        await client.post(
            "/api/tasks/ai-generated",
            json=task_data,
            headers=auth_headers,
        )

        # Get AI tasks with images
        response = await client.get(
            "/api/tasks/ai-generated/with-images",
            headers=auth_headers,
        )

        assert response.status_code == 200
        tasks = response.json()
        assert len(tasks) == 1
        assert tasks[0]["title"] == "Fix water damage"
        assert tasks[0]["source_image_id"] == str(image_id)

        # Note: The actual image data in the response depends on Supabase's
        # foreign key expansion behavior

        # Cleanup is handled by test transaction rollback

    @pytest.mark.asyncio
    async def test_create_regular_task_has_manual_source(self, client, setup_test_user, auth_headers: dict):
        """Test that regular tasks created through standard endpoint have 'manual' source."""
        task_data = {
            "title": "Regular task",
            "description": "User created task",
            "priority": "medium",
        }

        response = await client.post(
            "/api/tasks/", json=task_data, headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["source"] == "manual"
        assert data["source_image_id"] is None
        assert data["ai_confidence"] is None
        assert data["ai_provider"] is None
