import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    """
    Test the health check endpoint returns 200 OK.

    Key pytest concepts:
    - @pytest.mark.asyncio: Tells pytest this is an async test
    - client fixture: Injected from conftest.py automatically
    - assert: Python's built-in assertion for test validation
    """
    response = await client.get("/api/health")
    assert response.status_code == 200

    data = response.json()
    assert data["status"] in ["healthy", "error"]
