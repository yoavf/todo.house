# Project Structure

## Root Level Organization
```
todo.house/
├── frontend/           # Next.js React application
├── backend/            # FastAPI Python API
├── shared/             # Shared utilities and types
├── docs/               # Documentation
├── .kiro/              # Kiro AI assistant configuration
├── .husky/             # Git hooks configuration
└── package.json        # Root workspace configuration
```

## Frontend Structure (`frontend/`)
```
frontend/
├── src/
│   ├── app/            # Next.js App Router pages
│   ├── components/     # Reusable React components
│   └── lib/            # Utility functions and API clients
├── public/             # Static assets
├── package.json        # Frontend dependencies
├── next.config.ts      # Next.js configuration
├── tsconfig.json       # TypeScript configuration
├── biome.json          # Biome linting configuration
└── postcss.config.mjs  # PostCSS configuration
```

## Backend Structure (`backend/`)
```
backend/
├── app/
│   ├── __init__.py     # Package initialization
│   ├── main.py         # FastAPI application entry point
│   ├── models.py       # Pydantic data models and enums
│   ├── database.py     # Database session management
│   ├── database/       # SQLAlchemy models and configuration
│   │   ├── __init__.py # Export models and database utilities
│   │   ├── models.py   # SQLAlchemy ORM models
│   │   └── engine.py   # Database engine configuration
│   ├── tasks.py        # Task-related API routes
│   ├── images.py       # Image upload and analysis routes
│   └── storage.py      # Supabase storage integration
├── alembic/
│   ├── versions/       # Database migration files
│   │   └── 001_initial_schema.py
│   ├── env.py          # Alembic environment configuration
│   └── alembic.ini     # Alembic configuration
├── tests/
│   ├── conftest.py     # Pytest configuration and fixtures
│   ├── test_*.py       # Test files (unit and integration)
│   ├── api/            # API endpoint tests
│   ├── unit/           # Unit tests
│   └── integration/    # Integration tests
├── supabase/
│   └── config.toml     # Supabase configuration
├── pyproject.toml      # Python project configuration
├── pytest.ini          # Pytest configuration
└── .env.example        # Environment variables template
```

## Key Conventions

### File Naming
- **Python**: snake_case for files and functions
- **TypeScript/React**: PascalCase for components, camelCase for utilities
- **Tests**: Prefix with `test_` and suffix with test type (`_unit.py`, `_integration.py`)

### Import Organization
- **Backend**: Relative imports within app package (`from .database import supabase`)
- **Frontend**: Absolute imports with `@/` alias for src directory

### API Structure
- **Routes**: Organized by feature (tasks, images, etc.)
- **Models**: Pydantic models in `models.py`, SQLAlchemy models in `database/models.py`
- **Database**: Session management via dependency injection
- **IDs**: UUIDs for all primary keys (users, images) except tasks (integer)

### Testing Structure
- **Backend tests are mandatory**: Every new endpoint and business logic must have tests
- **Unit tests**: Fast, isolated tests with mocked dependencies, marked with `@pytest.mark.unit`
- **Integration tests**: Tests that interact with real services, marked with `@pytest.mark.integration`
- **Frontend tests are mandatory**: All components and functionality must be tested
- **Test isolation**: Each test gets unique user ID for data separation
- **Test markers**: Use `@pytest.mark.unit`, `@pytest.mark.integration`, `@pytest.mark.slow`

### Test Organization
- **Unit Tests**: Files ending with `_unit.py` - Fast, isolated tests with mocked dependencies
- **Integration Tests**: Files ending with `_integration.py` - Tests that interact with real services
- **Test Fixtures**: Shared test utilities and fixtures in `conftest.py`

### Configuration Management
- **Environment files**: `.env` for development, `.env.test` for testing, `.env.local` for frontend
- **Secrets**: Never commit actual credentials, use `.env.example` templates
- **Database**: Alembic migrations in `backend/alembic/versions/`
- **Storage**: Supabase storage for file uploads (images)

### Code Organization Principles
- **Separation of concerns**: Models, routes, and database logic in separate files
- **Type safety**: Full TypeScript in frontend, Pydantic models in backend
- **Error handling**: Consistent error responses and proper HTTP status codes
- **Authentication**: User-specific data isolation with row-level security

### MVP Implementation Guidelines
- **Quick wins first**: Implement core features that deliver immediate value
- **Never skip pre-commit hooks**: Always run linting, type checking, and unit tests before commit
- **Complete test coverage**: Write tests for all new functionality
- **Technical debt tracking**: Use `todo-tracker-pm` agent to track issues with priority levels
- **Iterate based on feedback**: Ship fast, learn, improve
- **Database Design**: 
  - UUIDs for all IDs (user_id, image_id, etc.) for security and scalability
  - String-based enums for flexibility during development
  - Standard audit columns (created_at, updated_at)
  - JSON for arrays to avoid complexity of normalized junction tables

### Code Quality Standards
- **Never add comments for perfectly self-explanatory code**
- **Comments should explain the "why" when it's not obvious, not document development history**
- **Always use an opportunity to teach the user about Python**
- **Frontend**: Use shadcn components whenever possible, with Tailwind
- **Opt to use libraries when possible instead of reinventing the wheel**