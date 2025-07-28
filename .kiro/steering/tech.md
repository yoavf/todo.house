# Technology Stack

## Build System & Package Management
- **Monorepo**: pnpm workspace with frontend, backend, and shared packages
- **Package Manager**: pnpm (version 10.13.1+)
- **Python**: uv for dependency management and virtual environments

## Frontend Stack
- **Framework**: Next.js 15.4.2 with React 19.1.0
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **Linting**: Biome for code formatting and linting
- **Build**: Next.js with Turbopack for development

## Backend Stack
- **Framework**: FastAPI with Python 3.13+
- **Database**: Supabase (PostgreSQL) with real-time capabilities
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
  - Backend: Basic happy-path tests only (edge cases → `/docs/todos.md`)
  - Frontend: Optional during MVP, track as [P1] items for later
- **Feature Scope**: Core functionality only, nice-to-haves → `/docs/todos.md`
- **Code Quality**: Working code first, refactoring tracked as technical debt
- **Error Handling**: Basic validation only, comprehensive handling → post-MVP

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
```

### Frontend Development
```bash
# From frontend directory
pnpm dev                 # Start dev server with Turbopack
pnpm build              # Build for production
pnpm lint               # Run linting
```

## Environment Configuration
- Backend uses `.env`, `.env.test` files for configuration
- Required environment variables: `SUPABASE_URL`, `SUPABASE_KEY`
- Test environment automatically loads `.env.test` with override