# CLAUDE.md/AGENTS.md

## 🚧 Project Status: MVP Development Phase

**Current Phase**: Building towards Minimum Viable Product (MVP)
**Focus**: Get core functionality working first, polish later
**Technical Debt**: Tracked as GitHub issues using the `todo-tracker-pm` agent

### MVP Review Guidelines (IMPORTANT for GitHub Actions)

When reviewing PRs during MVP phase:
1. **Critical Issues Only**: Flag only bugs, security issues, or breaking changes
2. **Non-Critical Feedback**: Output as structured recommendations, not blockers
3. **Format**: Use the `todo-tracker-pm` agent to create properly formatted GitHub issues
4. **Priority Levels**: Mark as `[P0]` (critical), `[P1]` (important), `[P2]` (nice-to-have)

**Note**: The review agent automatically skips PRs that:
- Have `[skip-review]` or `[WIP]` in the PR title

The review agent will use the `todo-tracker-pm` agent to create GitHub issues for non-critical improvements with appropriate priority levels:
- `[P0]` Critical: Security, data loss, breaking changes
- `[P1]` Important: Significant bugs, performance issues
- `[P2]` Nice-to-have: Enhancements, optimizations

## Project Overview

**TodoHouse** - A full-stack todo application built with FastAPI (Python) backend and Next.js (React) frontend, using SQLAlchemy ORM with PostgreSQL database.

## Architecture

- **Backend**: FastAPI (Python) with SQLAlchemy ORM - RESTful API server
- **Frontend**: Next.js (React) - Server-side rendered React application
- **Database**: PostgreSQL (via Supabase or any PostgreSQL instance)
- **Storage**: Supabase Storage for file uploads
- **ORM**: SQLAlchemy 2.0 with async support
- **Monorepo**: Simple workspace structure with npm workspaces

## Directory Structure

```
todohouse/
├── backend/           # FastAPI application
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py    # FastAPI app entry point
│   │   ├── database.py # Database setup
│   │   ├── database/   # SQLAlchemy components
│   │   └── storage.py  # Storage abstraction
│   ├── pyproject.toml # Python dependencies (uv)
│   └── .env          # Environment variables
├── frontend/         # Next.js application
├── shared/          # Shared types and utilities
├── package.json     # Root workspace configuration
└── README.md
```

## Development Goals

- Learn Python deeply through practical backend development
- Master SQLAlchemy ORM patterns with async/await
- Build database-agnostic backend (works with any PostgreSQL)
- Implement clean architecture with proper separation of concerns
- Build a production-ready monorepo structure
- Focus on clean code patterns and type safety

## Technology Choices

- **FastAPI**: Modern, fast Python web framework with automatic API documentation
- **SQLAlchemy**: Powerful ORM with async support for database operations
- **uv**: Fast Python package manager for dependency management
- **PostgreSQL**: Production-grade relational database (can use Supabase or self-hosted)
- **Supabase Storage**: For file uploads and image storage
- **Next.js**: React framework for the frontend application
- **TypeScript**: For type safety across the frontend

## Getting Started

```bash
# Install all dependencies
npm run install:all

# Run both frontend and backend in development
npm run dev

# Run individual services
npm run dev:backend   # FastAPI server on :8000
npm run dev:frontend  # Next.js app on :3000
```

## Environment Setup

Create `.env` files in both backend and frontend directories with necessary environment variables for Supabase connection and API configuration.

### Virtual Environment

This project uses a single virtual environment at the root level for Python dependencies:
- Location: `/todohouse/.venv`
- Python version: 3.13+
- Package manager: `uv` (ultrafast Python package manager)

**Important**: Always use the root-level venv when working with backend code. If `uv` shows warnings about venv mismatch, use the `--active` flag to target the active environment.

## Development Workflow

1. Backend API development in `backend/app/`
2. Frontend React components in `frontend/`
3. Shared types and utilities in `shared/`
4. Use concurrent development servers for full-stack development

## Learning Objectives

- Master Python async programming patterns
- Understand FastAPI dependency injection and middleware
- Implement clean API design with proper HTTP status codes
- Learn Supabase integration patterns
- Build scalable monorepo architecture

## Backend Testing Infrastructure

### Test Organization

The backend tests are organized in `backend/tests/` with the following structure:
- **Unit Tests**: Files ending with `_unit.py` - Fast, isolated tests with mocked dependencies
- **Integration Tests**: Files ending with `_integration.py` - Tests that interact with real services (database, external APIs)
- **Test Fixtures**: Shared test utilities and fixtures in `conftest.py`

### Testing Stack

- **pytest**: Modern Python testing framework with powerful fixtures
- **pytest-asyncio**: Support for testing async FastAPI endpoints
- **pytest-cov**: Code coverage reporting
- **httpx**: Async HTTP client for testing FastAPI endpoints
- **faker**: Generate realistic test data

### Running Tests

```bash
# Run all backend tests
npm run test:backend

# Run only unit tests (fast, mocked)
npm run test:backend:unit

# Run only integration tests (slower, real database)
npm run test:backend:integration

# Watch mode for development
npm run test:backend:watch
```

### Test Markers

Tests are categorized using pytest markers:
- `@pytest.mark.unit`: Fast unit tests with mocked dependencies
- `@pytest.mark.integration`: Tests requiring real database/services
- `@pytest.mark.slow`: Long-running tests

### Pre-commit Hooks

**IMPORTANT**: Every commit that modifies Python files in the backend directory automatically triggers:
1. **Ruff**: Python linting and formatting checks
2. **MyPy**: Static type checking
3. **Unit Tests**: All unit tests must pass before commit

This is enforced via husky and lint-staged configuration in `package.json`.

### Writing Tests - Best Practices

1. **Always add tests for new backend functionality**
   - Every new endpoint should have corresponding tests
   - Business logic should be unit tested
   - Database operations should have integration tests

2. **Test Structure Pattern**
   ```python
   async def test_endpoint_behavior_expected_result(client, setup_fixture):
       # Arrange: Set up test data
       # Act: Call the endpoint
       # Assert: Verify the response
   ```

3. **Use Fixtures for Reusability**
   - `client`: Async test client for API calls
   - `test_user_id`: Unique user ID for test isolation
   - `setup_test_user`: Creates and cleans up test users

4. **Test Both Success and Failure Cases**
   - Happy path scenarios
   - Error handling and edge cases
   - Input validation

### Example Test

```python
@pytest.mark.unit
async def test_create_todo_success(client, test_user_id):
    response = await client.post(
        "/todos/",
        json={"title": "Test Todo", "description": "Test"},
        headers={"X-User-Id": test_user_id}
    )
    assert response.status_code == 201
    assert response.json()["title"] == "Test Todo"
```

### Test Environment

- Tests use `.env.test` for isolated configuration
- Test database should be separate from development
- Tests clean up after themselves to ensure isolation

## AGENTS/CLAUDE Instructions (IMPORTANT)

### MVP Phase Guidelines
- **Speed over perfection**: Get features working first, polish later
- **Minimal viable tests**: Write basic happy-path tests only - edge cases should be tracked using the `todo-tracker-pm` agent
- **Feature scope**: Implement core functionality only - nice-to-haves should be tracked using the `todo-tracker-pm` agent as [P2] items
- **Technical debt is OK**: Use the `todo-tracker-pm` agent to create GitHub issues for refactoring needs rather than blocking progress
- **IMPORTANT**: Whenever you skip something for MVP (tests, error handling, features), you MUST use the `todo-tracker-pm` agent to create a GitHub issue with appropriate priority level
- You can use context7 mcp to retrieve documentation


### General Development
- Never add comments for perfectly self-explanatory code
- When refactoring, do not leave comments about what was change or what was there before.
- Always use an opportunity to teach the user about python
- Frontend: Use shadcn components whenever possible, with tailwind
- **Backend tests are mandatory** but keep them simple during MVP - just verify the happy path works
- **Frontend tests are optional during MVP** - use the `todo-tracker-pm` agent to create [P1] GitHub issues for post-MVP testing
