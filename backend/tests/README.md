# Backend Tests

This directory contains tests for the TodoHouse backend API.

## Test Structure

- `test_*_unit.py` - Unit tests with mocked dependencies (fast, no database)
- `test_*_integration.py` - Integration tests using real database
- `test_integration_example.py` - Example of full CRUD lifecycle test

## Setup

1. **Install dependencies:**
   ```bash
   uv add --dev pytest pytest-asyncio httpx faker
   ```

2. **Start local Supabase:**
   ```bash
   supabase start
   ```
   
   This starts a local PostgreSQL database on port 54322 with all migrations applied.

3. **Environment:**
   Tests automatically load `.env.test` which points to the local Supabase instance.

## Running Tests

```bash
# Run all tests
pnpm run test:backend

# Run only unit tests (fast, mocked)
pnpm run test:backend:unit

# Run integration tests (requires local Supabase)
pnpm run test:backend:integration

# Run specific test file
pytest tests/test_todos_unit.py -v

# Run with output
pytest -s -v
```

## Writing Tests

### Unit Tests (Mocked)
```python
from unittest.mock import patch, MagicMock

@pytest.mark.asyncio
async def test_something(client: AsyncClient):
    with patch('app.tasks.supabase') as mock_supabase:
        # Mock the database response
        mock_supabase.table().select().execute.return_value = mock_response
        
        response = await client.get("/api/endpoint")
        assert response.status_code == 200
```

### Integration Tests (Real Database)
```python
@pytest.mark.asyncio
async def test_full_lifecycle(client: AsyncClient, setup_test_user):
    user_id = setup_test_user  # Fixture creates and cleans up test user
    
    # Test with real database
    response = await client.post("/api/tasks/", 
                                json=data,
                                headers={"x-user-id": user_id})
```

## Local vs Cloud Testing

- **Local (default)**: Uses Docker-based Supabase, fast and isolated
- **Cloud**: Update `.env.test` to point to a cloud test project if needed

## Troubleshooting

- **Docker not running**: Start Docker Desktop before `supabase start`
- **Port conflicts**: Check if ports 54321-54324 are available
- **Migration issues**: Run `supabase migration up` to apply latest migrations