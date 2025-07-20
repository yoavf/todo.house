# CLAUDE.md/AGENTS.md

## Project Overview

**TodoHouse** - A full-stack todo application built with FastAPI (Python) backend and Next.js (React) frontend, using Supabase as the backend-as-a-service database solution.

## Architecture

- **Backend**: FastAPI (Python) - RESTful API server
- **Frontend**: Next.js (React) - Server-side rendered React application
- **Database**: Supabase (PostgreSQL) - Backend-as-a-service with real-time capabilities
- **Monorepo**: Simple workspace structure with npm workspaces

## Directory Structure

```
todohouse/
├── backend/           # FastAPI application
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py    # FastAPI app entry point
│   │   └── database.py # Supabase connection
│   ├── pyproject.toml # Python dependencies (uv)
│   └── .env          # Environment variables
├── frontend/         # Next.js application
├── shared/          # Shared types and utilities
├── package.json     # Root workspace configuration
└── README.md
```

## Development Goals

- Learn Python deeply through practical backend development
- Implement modern FastAPI patterns with async/await
- Use Supabase for zero-hassle database management and scaling
- Build a production-ready monorepo structure
- Focus on clean code patterns and type safety

## Technology Choices

- **FastAPI**: Modern, fast Python web framework with automatic API documentation
- **uv**: Fast Python package manager for dependency management
- **Supabase**: PostgreSQL-based BaaS for database, auth, and real-time features
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

## AGENTS/CLAUDE Instructions (IMPORTANT)

- Never add comments for perfectly self-explanatory code
- When refactoring, do not leave comments about what was change or what was there before.
- Always use an opportunity to teach the user about python
- Use shadcn components whenever possible, with tailwind