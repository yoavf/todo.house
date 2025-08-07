# CLAUDE.md/AGENTS.md

## 🚧 Project Status: MVP Development Phase

**Current Phase**: Building towards Minimum Viable Product (MVP)
**Focus**: Get core functionality working first, polish later
**Technical Debt**: Tracked as GitHub issues using the `todo-tracker-pm` agent

### MVP Review Guidelines (IMPORTANT for GitHub Actions)

When reviewing PRs during MVP phase:
1. **Critical Issues Only**: Flag only bugs, security issues, or breaking changes
2. **Non-Critical Feedback**: Output as structured recommendations, not blockers
3. **Priority Levels**: Mark as `[P0]` (critical), `[P1]` (important), `[P2]` (nice-to-have)

**Note**: The review agent automatically skips PRs that:
- Have `[skip-review]` or `[WIP]` in the PR title

## Project Overview

**TodoHouse** - A full-stack todo application built with FastAPI (Python) backend and Next.js (React) frontend, using SQLAlchemy ORM with PostgreSQL database.

## Architecture

- **Backend**: FastAPI (Python) with SQLAlchemy ORM - RESTful API server
- **Frontend**: Next.js (React) - Server-side rendered React application
- **Database**: PostgreSQL (via Supabase or any PostgreSQL instance)
- **Storage**: Supabase Storage for file uploads
- **ORM**: SQLAlchemy 2.0 with async support
- **Monorepo**: Simple workspace structure with pnpm workspaces

## Directory Structure

```
todohouse/
├── backend/           # FastAPI application
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py    # FastAPI app entry point
│   │   ├── database.py # Database setup
│   │   ├── database/   # SQLAlchemy models and engine
│   │   ├── models.py   # Pydantic models and enums
│   │   ├── tasks.py    # Task endpoints
│   │   ├── images.py   # Image endpoints
│   │   └── storage.py  # Storage abstraction
│   ├── alembic/       # Database migrations
│   │   └── versions/  # Migration files
│   ├── pyproject.toml # Python dependencies (uv)
│   └── .env          # Environment variables
├── frontend/         # Next.js application
│   └── .env.local    # Frontend environment variables
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
- **Alembic**: Database migration tool for managing schema changes

## Database Architecture

### Key Design Decisions

1. **UUIDs for all IDs**: Using PostgreSQL UUID type for user_id, image_id, etc. for security and scalability
2. **String-based Enums**: Storing enums (priority, status, source) as strings rather than PostgreSQL enum types for flexibility during development
3. **Standard Audit Columns**: All tables have `created_at` and `updated_at` timestamps
4. **JSON for Arrays**: Using JSON type for `task_types` array to avoid complexity of normalized junction tables

### Database Setup

```bash
# Run migrations on a new database
cd backend && uv run alembic upgrade head

# Create a new migration after model changes
cd backend && uv run alembic revision --autogenerate -m "Description of changes"

# Check current migration status
cd backend && uv run alembic current
```

## Getting Started

```bash
# Install all dependencies
pnpm run install:all

# Run both frontend and backend in development
pnpm run dev

# Run individual services
pnpm run dev:backend   # FastAPI server on :8000
pnpm run dev:frontend  # Next.js app on :3000
```

## Environment Setup

### Backend (.env)
```bash
# Database Configuration (SQLAlchemy)
DATABASE_URL=postgresql+asyncpg://postgres:postgres@127.0.0.1:54322/postgres

# Supabase Configuration (for storage)
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_KEY=your-anon-key

# AI Provider Configuration (optional)
GEMINI_API_KEY=your-api-key
GEMINI_MODEL=gemini-2.5-flash-lite
DEFAULT_AI_PROVIDER=gemini

# Logging
LOG_LEVEL=INFO
ENABLE_JSON_LOGGING=true
```

### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_TEST_USER_ID=550e8400-e29b-41d4-a716-446655440000
```

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
pnpm run test:backend

# Run only unit tests (fast, mocked)
pnpm run test:backend:unit

# Run only integration tests (slower, real database)
pnpm run test:backend:integration

# Watch mode for development
pnpm run test:backend:watch
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
Never bypass the pre-commit hooks!

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
- **Aim for fool coverage**: Write complete unit tests for every feature.
- **Feature scope**: Implement requested functionality only - nice-to-haves should be tracked using the `todo-tracker-pm` agent as [P2] items.
- **Some technical debt is OK**: confirm with the user when a refactor seems costly - the user will direct you wether to refactor or accept technical debt.
- You can use context7 mcp to retrieve documentation


### General Development
- Never add comments for perfectly self-explanatory code
- Never skip pre-commit hooks!!! Ask the user for guidance if stuck
- When refactoring, do not leave comments about what was change or what was there before.
- Always use an opportunity to teach the user about python
- Frontend: Use shadcn components whenever possible, with tailwind
- **Backend tests are mandatory** 
- **Frontend tests mandatory** 

## Internationalization (i18n) and RTL Support

### Overview
TodoHouse supports multiple languages with RTL (Right-to-Left) text direction. Currently supported:
- **English (en)** - LTR, default locale
- **Hebrew (he)** - RTL

### Implementation Details

#### 1. Locale Configuration
- Locales are defined in `frontend/src/i18n/config.ts`
- RTL locales are explicitly listed in the config
- Locale detection happens server-side via `next-intl`

#### 2. Translation Files
- Messages stored in `frontend/src/messages/[locale].json`
- Nested structure for organization (common, tasks, errors, etc.)
- All user-facing strings should be in translation files

#### 3. RTL Styling
- HTML `dir` attribute set based on locale in root layout
- RTL-specific font (Noto Sans Hebrew) loaded conditionally
- CSS uses logical properties where possible (e.g., `start` instead of `left`)
- RTL-specific styles in `globals.css` with `[dir="rtl"]` selector

### Adding New Strings

1. **Add to all locale files** - New strings must be added to both `en.json` and `he.json`
2. **Use consistent keys** - Follow existing naming patterns
3. **Use the translation hook**:
   ```typescript
   import { useTranslations } from 'next-intl';
   
   const t = useTranslations('tasks'); // namespace
   const label = t('fields.title'); // "What needs to be done"
   ```

### Creating New Frontend Elements

1. **Use logical CSS properties**:
   ```css
   /* Good - works for both LTR and RTL */
   margin-inline-start: 1rem;
   padding-inline-end: 0.5rem;
   text-align: start;
   
   /* Avoid - doesn't flip for RTL */
   margin-left: 1rem;
   padding-right: 0.5rem;
   text-align: left;
   ```

2. **Use Tailwind's RTL utilities**:
   ```tsx
   <div className="ms-4 me-2"> {/* margin-start/end */}
   <div className="ps-3 pe-1"> {/* padding-start/end */}
   ```

3. **Direction-aware animations**:
   - Slide animations should respect text direction
   - Use `slide-in-start` instead of `slide-in-left`
   - RTL-specific animation overrides in globals.css

4. **Icons and directional elements**:
   ```tsx
   import { ArrowRight, ArrowLeft } from 'lucide-react';
   import { useLocale } from '@/hooks/useLocale';
   
   const { isRTL } = useLocale();
   const ArrowForward = isRTL ? ArrowLeft : ArrowRight;
   ```

5. **Forms and inputs**:
   - Input text alignment handled automatically via CSS
   - Placeholders use translations
   - Form layouts use logical properties

### Testing Localization

1. **Switch locale**: Add `?locale=he` to URL or use locale switcher
2. **Verify**:
   - Text direction flips correctly
   - Animations work in correct direction  
   - Layout doesn't break
   - All text is translated

### Best Practices

1. **Never hardcode user-facing strings** - Always use translations
2. **Test both LTR and RTL** - Especially for new UI components
3. **Use semantic HTML** - Helps with automatic RTL handling
4. **Avoid absolute positioning** - Use flexbox/grid instead
5. **Consider reading direction** - Important items should be at the "start"

## Development Memory

- When writing commit messages, do not include ghost fixes: meaning, if since the last commit you introduced a bug, and then fixed it, and are then committing again, that bug has no meaning in the codebase, it was never there, and shouldn't be mentioned.
- never ever modify pre-commit hooks or bypass them in order to complete a task!!!
- **NEVER BYPASS PRE COMMIT HOOK!!!! ***NEVER***
- Comments should explain the "why" when it's not obvious, not document the development history
- When adding DB migrations and other, make sure we have a sqlite fallback for CI/tests
- **Opt to use libraries when possible instead of reinventing the wheel**