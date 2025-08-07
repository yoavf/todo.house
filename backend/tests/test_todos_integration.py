"""
Integration tests for todos - these test against a real database.

WARNING: These tests require:
1. A separate test database or test schema
2. Proper test data cleanup
3. Should be run separately from unit tests

Run with: pytest tests/test_todos_integration.py -m integration
"""

import pytest
from httpx import AsyncClient

# Mark all tests in this file as integration tests
pytestmark = pytest.mark.integration


@pytest.mark.asyncio
async def test_create_and_retrieve_task(client: AsyncClient, setup_test_user, auth_headers: dict):
    """Integration test: Create a task and verify it's stored."""

    task_data = {
        "title": "Integration Test Task",
        "description": "This tests the full flow",
        "priority": "high",
    }


    # Create task
    create_response = await client.post(
        "/api/tasks/", json=task_data, headers=auth_headers
    )

    assert create_response.status_code == 200
    created_task = create_response.json()
    task_id = created_task["id"]

    # Retrieve the specific task
    get_response = await client.get(
        f"/api/tasks/{task_id}", headers=auth_headers
    )

    assert get_response.status_code == 200
    retrieved_task = get_response.json()
    assert retrieved_task["title"] == task_data["title"]
    assert retrieved_task["id"] == task_id
