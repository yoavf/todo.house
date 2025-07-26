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
│   ├── models.py       # Pydantic data models
│   ├── database.py     # Supabase client configuration
│   └── tasks.py        # Task-related API routes
├── tests/
│   ├── conftest.py     # Pytest configuration and fixtures
│   ├── test_*.py       # Test files (unit and integration)
│   ├── api/            # API endpoint tests
│   ├── unit/           # Unit tests
│   └── integration/    # Integration tests
├── supabase/
│   ├── migrations/     # Database migration files
│   └── config.toml     # Supabase configuration
├── pyproject.toml      # Python project configuration
├── pytest.ini         # Pytest configuration
├── .env.example        # Environment variables template
└── main.py             # Alternative entry point
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
- **Routes**: Organized by feature (tasks, users, etc.)
- **Models**: Separate files for Pydantic models with clear inheritance
- **Database**: Single client instance exported from `database.py`

### Testing Structure
- **Unit tests**: Fast, mocked dependencies, marked with `@pytest.mark.unit`
- **Integration tests**: Real database, marked with `@pytest.mark.integration`
- **Fixtures**: Shared test setup in `conftest.py`
- **Test isolation**: Each test gets unique user ID for data separation

### Configuration Management
- **Environment files**: `.env` for development, `.env.test` for testing
- **Secrets**: Never commit actual credentials, use `.env.example` templates
- **Database**: Supabase migrations in `backend/supabase/migrations/`

### Code Organization Principles
- **Separation of concerns**: Models, routes, and database logic in separate files
- **Type safety**: Full TypeScript in frontend, Pydantic models in backend
- **Error handling**: Consistent error responses and proper HTTP status codes
- **Authentication**: User-specific data isolation with row-level security