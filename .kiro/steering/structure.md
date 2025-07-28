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

### Testing Structure (MVP Approach)
- **MVP Testing**: Focus on happy-path backend tests only
- **Unit tests**: Basic functionality verification, marked with `@pytest.mark.unit`
- **Integration tests**: Optional during MVP, marked with `@pytest.mark.integration`
- **Frontend tests**: Track as [P1] items in `/docs/todos.md`
- **Test isolation**: Each test gets unique user ID for data separation
- **Edge cases**: Document in `/docs/todos.md` rather than implementing now

### Configuration Management
- **Environment files**: `.env` for development, `.env.test` for testing
- **Secrets**: Never commit actual credentials, use `.env.example` templates
- **Database**: Supabase migrations in `backend/supabase/migrations/`

### Code Organization Principles
- **Separation of concerns**: Models, routes, and database logic in separate files
- **Type safety**: Full TypeScript in frontend, Pydantic models in backend
- **Error handling**: Consistent error responses and proper HTTP status codes
- **Authentication**: User-specific data isolation with row-level security

### MVP Implementation Guidelines
- **Quick wins first**: Implement core features that deliver immediate value
- **Defer complexity**: Advanced features and edge cases → `/docs/todos.md`
- **Minimal viable tests**: Just enough to verify core functionality works
- **Technical debt tracking**: Document shortcuts taken in `/docs/todos.md`
- **Iterate based on feedback**: Ship fast, learn, improve
- **ALWAYS document deferrals**: Any time you skip tests, error handling, or features for MVP, add them to `/docs/todos.md` with priority:
  - [P0]: Critical security/breaking issues
  - [P1]: Important functionality, major UX issues, missing tests
  - [P2]: Nice-to-haves, optimizations, minor enhancements