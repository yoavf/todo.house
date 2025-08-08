# TodoHouse Backend


FastAPI backend for the TodoHouse application using SQLAlchemy ORM.

## Architecture

- **Framework**: FastAPI with async/await support
- **ORM**: SQLAlchemy 2.0 with async support
- **Database**: PostgreSQL (via Supabase or any PostgreSQL instance)
- **Storage**: Supabase Storage for file uploads
- **Python Package Manager**: uv

### Authentication

- The backend validates Auth.js (NextAuth) encrypted JWTs sent in the `Authorization: Bearer <token>` header.
- Token decryption is handled by [`fastapi-nextauth-jwt`](https://github.com/TCatshoek/fastapi-nextauth-jwt).
- Required env vars:
  - `AUTH_SECRET` (or `NEXTAUTH_SECRET`) — must exactly match the frontend Auth.js secret
  - Recommended: `AUTH_URL=https://dev.todo.house` (enables secure-cookie defaults in libs)
- In production the frontend uses a server-side proxy (`/api/proxy/*`) to attach the `Authorization` header; the token is never exposed to client JS.

## Setup

1. Install dependencies:
```bash
uv sync
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your database and storage credentials
```

Required environment variables:
- `DATABASE_URL`: PostgreSQL connection string (e.g., `postgresql+asyncpg://user:pass@host:port/db`)
- `SUPABASE_URL`: Supabase project URL (for storage)
- `SUPABASE_KEY`: Supabase anon key (for storage)
- `GEMINI_API_KEY`: Google Gemini API key (for AI features)
- `AUTH_SECRET` (or `NEXTAUTH_SECRET`): Shared secret with the frontend Auth.js
- `AUTH_URL`: Public frontend origin (e.g., `https://dev.todo.house`)

3. Run the development server:
```bash
uv run uvicorn app.main:app --reload
```

## Database Schema

The application uses SQLAlchemy ORM with the following main models:

- **User**: User accounts
- **Task**: Todo items with support for AI-generated tasks
- **Image**: Uploaded images for AI analysis

## API Documentation

Once running, visit http://localhost:8000/docs for the interactive API documentation.

## Testing

Run all tests:
```bash
uv run pytest
```

Run specific test categories:
```bash
# Unit tests only
uv run pytest tests/unit

# Integration tests only
uv run pytest tests/integration

# With coverage
uv run pytest --cov=app --cov-report=html
```

## Development

### Database Migrations

While Alembic is installed, migrations are currently handled by Supabase. To use Alembic:

```bash
# Initialize Alembic (one time)
uv run alembic init alembic

# Create a migration
uv run alembic revision --autogenerate -m "Description"

# Apply migrations
uv run alembic upgrade head
```

### Code Quality

The project uses pre-commit hooks to ensure code quality:

- **Ruff**: Linting and formatting
- **MyPy**: Type checking
- **Unit tests**: Must pass before commit

Format code:
```bash
uv run ruff format .
```

Lint code:
```bash
uv run ruff check .
```

Type check:
```bash
uv run mypy app
```

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py           # FastAPI app entry point
│   ├── config.py         # Configuration management
│   ├── models.py         # Pydantic models
│   ├── tasks.py          # Task endpoints
│   ├── images.py         # Image analysis endpoints
│   ├── storage.py        # Storage abstraction
│   ├── database.py       # Database setup
│   ├── database/         # SQLAlchemy components
│   │   ├── engine.py     # Async engine setup
│   │   ├── models.py     # ORM models
│   │   └── session.py    # Session management
│   ├── ai/               # AI components
│   │   ├── providers.py  # AI provider abstraction
│   │   └── image_processing.py
│   └── services/         # Business logic
│       └── task_service.py
├── tests/
│   ├── unit/             # Unit tests
│   ├── integration/      # Integration tests
│   └── conftest.py       # Test fixtures
├── pyproject.toml        # Dependencies
└── pytest.ini            # Test configuration
```

## API Endpoints

### Tasks
- `GET /api/tasks/` - List tasks (with filters)
- `POST /api/tasks/` - Create a task
- `GET /api/tasks/{id}` - Get task details
- `PUT /api/tasks/{id}` - Update task
- `DELETE /api/tasks/{id}` - Delete task
- `POST /api/tasks/ai-generated` - Create AI-generated task

### Images
- `POST /api/images/analyze` - Analyze image and generate tasks
- `GET /api/images/{id}` - Get image details

### Health
- `GET /api/health` - Health check with database status

All endpoints (except health check and image proxy) require JWT authentication via `Authorization: Bearer <token>` header.
