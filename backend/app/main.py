from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, PlainTextResponse
from sqlalchemy import text
from .database import get_session
from .tasks import router as tasks_router
from .images import router as images_router
from .locations import router as locations_router
from .user_settings import router as user_settings_router
from .logging_config import setup_logging
import os
from pathlib import Path

# Initialize structured logging
setup_logging(
    log_level=os.getenv("LOG_LEVEL", "INFO"),
    enable_json=os.getenv("ENABLE_JSON_LOGGING", "true").lower() == "true",
)

app = FastAPI(title="todo.house API", version="1.0.0")

# CORS configuration - use regex to handle all cases
# This regex matches:
# - localhost with any port
# - todo.house and all subdomains
# - Railway preview environments (*.up.railway.app)
CORS_ORIGIN_REGEX = r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$|^https://(.*\.)?todo\.house$|^https://.*\.up\.railway\.app$"

# CORS middleware for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=CORS_ORIGIN_REGEX,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(tasks_router)
app.include_router(images_router)
app.include_router(locations_router)
app.include_router(user_settings_router)


@app.get("/robots.txt")
async def robots_txt():
    try:
        robots_path = Path(__file__).parent / "static" / "robots.txt"
        if robots_path.exists():
            return FileResponse(robots_path, media_type="text/plain")
    except Exception as e:
        # Log the error but continue with fallback
        import logging
        logging.error(f"Error reading robots.txt file: {e}")
    # Fallback if file doesn't exist or error occurs
    return PlainTextResponse("User-agent: *\nDisallow: /\n")


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
