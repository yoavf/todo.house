# Technology Stack

## Build System & Package Management
- **Monorepo**: pnpm workspace with frontend, backend, and shared packages
- **Package Manager**: pnpm
- **Python**: uv for dependency management and virtual environments

## Frontend Stack
- **Framework**: Next.js 15.4.2 with React 19.1.0
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **Linting**: Biome for code formatting and linting
- **Build**: Next.js with Turbopack for development

## Backend Stack
- **Framework**: FastAPI with Python 3.13+
- **Database**: PostgreSQL (via Supabase or self-hosted)
- **ORM**: SQLAlchemy 2.0 with async support
- **Migrations**: Alembic for database schema management
- **Storage**: Supabase Storage for file uploads
- **Validation**: Pydantic models for request/response validation
- **Server**: Uvicorn with auto-reload for development
- **Environment**: python-dotenv for configuration management

## Development Tools
- **Testing**: pytest with asyncio support, pytest-cov for coverage
- **Type Checking**: mypy for Python static analysis
- **Linting**: ruff for Python code formatting and linting
- **Git Hooks**: husky with lint-staged for pre-commit checks
- **Concurrency**: concurrently for running multiple dev servers

## MVP Development Guidelines
- **Testing Strategy**: 
  - Backend: Complete unit tests for all functionality - tests are mandatory
  - Frontend: Complete tests for all components and functionality - tests are mandatory
- **Feature Scope**: Core functionality only, nice-to-haves tracked with `todo-tracker-pm` agent
- **Code Quality**: Working code first, but maintain test coverage and pre-commit standards
- **Error Handling**: Proper validation and error responses required
- **Pre-commit Hooks**: NEVER bypass pre-commit hooks - they run ruff, mypy, and unit tests

## Testing Stack
- **pytest**: Modern Python testing framework with powerful fixtures
- **pytest-asyncio**: Support for testing async FastAPI endpoints
- **pytest-cov**: Code coverage reporting
- **httpx**: Async HTTP client for testing FastAPI endpoints
- **faker**: Generate realistic test data

## Virtual Environment
- **Location**: `/todohouse/.venv` (single virtual environment at root level)
- **Python version**: 3.13+
- **Package manager**: `uv` (ultrafast Python package manager)
- **Important**: Always use the root-level venv when working with backend code

## Common Commands

### Development
```bash
# Start both frontend and backend
pnpm run dev

# Start individual services
pnpm run dev:frontend
pnpm run dev:backend

# Install all dependencies
pnpm run install:all
```

### Testing
```bash
# Run all backend tests
pnpm run test:backend

# Run unit tests only
pnpm run test:backend:unit

# Run integration tests only
pnpm run test:backend:integration

# Watch mode for tests
pnpm run test:backend:watch
```

### Backend Development
```bash
# From backend directory
uv sync                    # Install dependencies
uv run uvicorn app.main:app --reload  # Start server
uv run pytest            # Run tests
uv run ruff check --fix   # Lint and fix
uv run mypy              # Type checking

# Database migrations
uv run alembic upgrade head     # Apply migrations
uv run alembic revision --autogenerate -m "Description"  # Create migration
uv run alembic current         # Check current version
```

### Frontend Development
```bash
# From frontend directory
pnpm run dev             # Start dev server with Turbopack
pnpm run build           # Build for production
pnpm run lint            # Run linting
```

## Environment Configuration
- Backend uses `.env`, `.env.test` files for configuration
- Frontend uses `.env.local` for configuration
- Required backend variables: `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_KEY`
- Required frontend variables: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_TEST_USER_ID`
- Test environment automatically loads `.env.test` with override
- NEVER BYPASS PRE-COMMIT HOOKS!!!!!