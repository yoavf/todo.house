from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from .database import get_session
from .tasks import router as tasks_router
from .images import router as images_router
from .logging_config import setup_logging
import os

# Initialize structured logging
setup_logging(
    log_level=os.getenv("LOG_LEVEL", "INFO"),
    enable_json=os.getenv("ENABLE_JSON_LOGGING", "true").lower() == "true",
)

app = FastAPI(title="todo.house API", version="1.0.0")

# CORS middleware for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: allowed all origins for dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(tasks_router)
app.include_router(images_router)


@app.get("/")
async def root():
    return {"message": "todo.house API is running!"}


@app.get("/api/health")
async def health_check():
    try:
        # Check if env vars are loaded
        database_url = os.getenv("DATABASE_URL")

        if not database_url:
            return {"status": "error", "message": "Missing DATABASE_URL"}

        # Check SQLAlchemy database connection
        async with get_session() as session:
            # Simple query to test connection
            await session.execute(text("SELECT 1"))

        return {
            "status": "healthy",
            "database": "connected",
            "sqlalchemy": "connected",
        }
    except Exception as e:
        return {"status": "error", "database": f"error: {str(e)}"}
