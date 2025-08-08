"""
Example integration test using the test Supabase database.
Run with: pytest tests/test_integration_example.py -s
"""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_full_todo_lifecycle(
    client: AsyncClient, setup_test_user, auth_headers: dict
):
    """Test creating, reading, updating, and deleting a todo."""

    # 1. Create a todo
    create_data = {
        "title": "Integration Test Todo",
        "description": "Testing with real database",
        "priority": "high",
    }

    create_response = await client.post(
        "/api/tasks/", json=create_data, headers=auth_headers
    )

    assert create_response.status_code == 200
    todo = create_response.json()
    todo_id = todo["id"]

    print(f"\n✅ Created todo with ID: {todo_id}")

    # 2. Retrieve the todo
    get_response = await client.get(f"/api/tasks/{todo_id}", headers=auth_headers)

    assert get_response.status_code == 200
    retrieved_todo = get_response.json()
    assert retrieved_todo["title"] == create_data["title"]

    print(f"✅ Retrieved todo: {retrieved_todo['title']}")

    # 3. Update the todo
    update_response = await client.put(
        f"/api/tasks/{todo_id}",
        json={"completed": True},
        headers=auth_headers,
    )

    assert update_response.status_code == 200
    updated_todo = update_response.json()
    assert updated_todo["completed"] is True
    assert updated_todo["status"] == "completed"

    print(f"✅ Updated todo status to: {updated_todo['status']}")

    # 4. List all todos for user
    list_response = await client.get("/api/tasks/", headers=auth_headers)

    assert list_response.status_code == 200
    todos = list_response.json()
    assert len(todos) == 1
    assert todos[0]["id"] == todo_id

    print(f"✅ Listed {len(todos)} todo(s) for user")

    # 5. Delete the todo
    delete_response = await client.delete(f"/api/tasks/{todo_id}", headers=auth_headers)

    assert delete_response.status_code == 200

    print("✅ Deleted todo")

    # 6. Verify it's gone
    verify_response = await client.get(f"/api/tasks/{todo_id}", headers=auth_headers)

    assert verify_response.status_code == 404

    print("✅ Verified todo is deleted")
    print("\n🎉 Full lifecycle test passed!")
