# GitHub Copilot Instructions for TodoHouse

**Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.**

TodoHouse is a full-stack todo application built with FastAPI (Python) backend and Next.js (React) frontend, using SQLAlchemy ORM with PostgreSQL database. This is a monorepo with comprehensive test coverage and pre-commit hooks.

## Working Effectively

### Initial Setup (NEVER CANCEL - Total time: ~2 minutes)
Install required tools and dependencies:
```bash
# Install uv (Python package manager)
curl -LsSf https://astral.sh/uv/install.sh | sh
export PATH="$HOME/.local/bin:$PATH"

# Install pnpm if not available
npm install -g pnpm

# Install all dependencies - takes 1-2 minutes, NEVER CANCEL
# Set timeout to 180+ seconds for this command
pnpm run install:all
```

### Environment Setup
Create environment files for development:
```bash
# Backend environment
cp backend/.env.example backend/.env
# Edit backend/.env with required values:
# DATABASE_URL=sqlite+aiosqlite:///./test.db (for testing)
# AUTH_SECRET=test-secret-key-for-jwt-encoding
# SUPABASE_URL=http://localhost:54321
# SUPABASE_KEY=test-key-for-testing

# Frontend environment  
cat > frontend/.env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_TEST_USER_ID=550e8400-e29b-41d4-a716-446655440000
AUTH_SECRET=test-secret-key-for-jwt-encoding
NEXTAUTH_SECRET=test-secret-key-for-jwt-encoding
AUTH_GOOGLE_ID=your-google-client-id
AUTH_GOOGLE_SECRET=your-google-client-secret
NEXTAUTH_URL=http://localhost:3000
EOF
```

### Development Workflow
Start development servers:
```bash
# Run both frontend and backend (recommended)
pnpm run dev

# Or run individual services:
pnpm run dev:backend    # FastAPI server on :8000
pnpm run dev:frontend   # Next.js app on :3000
```

### Database Operations
```bash
# Run migrations - takes <1 second
cd backend && uv run alembic upgrade head

# Create new migration after model changes
cd backend && uv run alembic revision --autogenerate -m "Description"

# Check current migration status
cd backend && uv run alembic current
```

## Testing (CRITICAL TIMINGS)

### Backend Tests (NEVER CANCEL - Total time: ~12 seconds)
```bash
# All backend tests - takes 10-12 seconds, set timeout to 60+ seconds
pnpm run test:backend

# Unit tests only - takes 3-4 seconds, set timeout to 30+ seconds  
pnpm run test:backend:unit

# Integration tests - takes 2-3 seconds, set timeout to 30+ seconds
pnpm run test:backend:integration
```

### Frontend Tests (NEVER CANCEL - Total time: ~8 seconds)
```bash
# All frontend tests - takes 6-8 seconds, set timeout to 60+ seconds
pnpm test

# Unit tests in CI mode - use for validation
cd frontend && pnpm run test:ci
```

### Build and Production (NEVER CANCEL - Total time: ~36 seconds)
```bash
# Frontend build - takes 30-40 seconds, NEVER CANCEL
# Set timeout to 120+ seconds for this command  
pnpm run build:frontend

# Start production frontend
pnpm run start:frontend
```

## Code Quality (Fast operations - all under 20 seconds)

### Backend Linting and Type Checking
```bash
# Lint backend code - takes <1 second
pnpm run lint:backend

# Auto-fix backend linting issues
pnpm run lint:backend:fix

# Type check backend - takes 15-20 seconds
pnpm run typecheck:backend
```

### Frontend Linting and Type Checking
```bash
# Lint frontend code - takes <1 second
cd frontend && pnpm run lint

# Auto-fix frontend linting issues  
cd frontend && pnpm run lint:fix

# Type check frontend - takes 5-6 seconds
cd frontend && pnpm exec tsc --noEmit
```

## Validation Scenarios

**ALWAYS perform these validation steps after making changes:**

### 1. Health Check Validation
```bash
# Start backend and verify health
pnpm run dev:backend &
sleep 5
curl http://localhost:8000/api/health
# Expected: {"status":"healthy","database":"connected","sqlalchemy":"connected"}
```

### 2. API Documentation Validation  
```bash
# Verify API docs are accessible
curl -s http://localhost:8000/docs | head -5
# Should return HTML for Swagger UI

# Check OpenAPI schema
curl -s http://localhost:8000/openapi.json | head -5
# Should return JSON with API spec
```

### 3. Frontend Application Validation
```bash
# Start frontend and verify redirect
pnpm run dev:frontend &
sleep 10
curl -s http://localhost:3000
# Expected: Redirect to /auth/signin (auth not configured)
```

### 4. Full-Stack Integration Validation
```bash
# Start both services and verify communication
pnpm run dev
# Wait for both services to start (~20 seconds)
# Test backend: curl http://localhost:8000/api/health  
# Test frontend: curl http://localhost:3000
```

### 5. Pre-commit Hook Validation
**CRITICAL**: Pre-commit hooks automatically run for ALL commits:
- Python files: ruff, mypy, unit tests
- TypeScript files: biome, tsc, tests
- **NEVER bypass these hooks**

## Project Structure and Navigation

### Key Directories
```
todohouse/
├── backend/              # FastAPI application
│   ├── app/
│   │   ├── main.py      # FastAPI entry point
│   │   ├── tasks.py     # Task endpoints  
│   │   ├── images.py    # Image analysis endpoints
│   │   ├── auth.py      # Authentication
│   │   └── database/    # SQLAlchemy models
│   ├── tests/           # Backend tests
│   │   ├── unit/        # Unit tests (mocked)
│   │   └── integration/ # Integration tests (real DB)
│   └── alembic/         # Database migrations
├── frontend/            # Next.js application  
│   ├── src/
│   │   ├── app/         # Next.js 13+ app router
│   │   ├── components/  # React components
│   │   ├── lib/         # Utility functions
│   │   └── auth/        # Authentication config
│   └── __tests__/       # Frontend tests
├── shared/              # Shared types and utilities
└── .github/workflows/   # CI/CD pipelines
```

### Frequently Accessed Files
- `backend/app/main.py` - FastAPI application entry point
- `backend/app/tasks.py` - Main task management endpoints
- `frontend/src/app/page.tsx` - Main application page
- `frontend/src/components/` - Reusable React components
- `backend/alembic/versions/` - Database migration files
- `package.json` - Root workspace configuration with scripts

## Common Issues and Solutions

### Build Failures
- **Backend tests fail**: Check AUTH_SECRET is set in backend/.env
- **Frontend build fails**: Verify Node.js version 20+ and pnpm is installed
- **Database errors**: Run `cd backend && uv run alembic upgrade head`

### Development Server Issues  
- **Port conflicts**: Backend uses :8000, frontend uses :3000
- **Auth warnings**: Normal for development, AUTH_URL not required for testing
- **CORS errors**: Use the proxy at `/api/proxy/*` for API calls

### Performance Expectations
- **Cold start**: Initial `pnpm run install:all` takes 1-2 minutes
- **Warm start**: `pnpm run dev` takes 10-15 seconds to be ready
- **Test suite**: Complete backend+frontend tests take <20 seconds total
- **Build time**: Frontend production build takes 30-40 seconds

## Authentication and API Testing

The application uses Auth.js (NextAuth v5) with JWT tokens. For development testing:
- Backend health endpoint is public: `/api/health`
- API documentation is public: `/docs`  
- Most other endpoints require authentication via `Authorization: Bearer <token>`
- Frontend automatically handles auth via server-side proxy at `/api/proxy/*`

## Database Schema

Key models:
- **User**: User accounts with locale preferences
- **Task**: Todo items with AI-generated support
- **Image**: Uploaded images for AI analysis  
- **Location**: Task location/room management

The app uses SQLite for development/testing and PostgreSQL for production.

## International Support (i18n)

The application supports multiple languages:
- **English (en)**: Default, LTR
- **Hebrew (he)**: RTL support
- Translation files: `frontend/src/messages/[locale].json`
- Always test both LTR and RTL layouts for UI changes

## CI/CD Integration

GitHub Actions workflows:
- `backend-tests.yml` - Backend testing with SQLite
- `frontend-tests.yml` - Frontend testing  
- All workflows use appropriate timeout values and never cancel builds

**Remember**: Always validate your changes with the full test suite before committing. The pre-commit hooks will catch most issues, but manual validation ensures proper functionality.