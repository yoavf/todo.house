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
import logging
from pathlib import Path
import signal
import sys
import traceback
import atexit

# Initialize structured logging
setup_logging(
    log_level=os.getenv("LOG_LEVEL", "INFO"),
    enable_json=os.getenv("ENABLE_JSON_LOGGING", "true").lower() == "true",
)

# Get logger for startup messages
logger = logging.getLogger(__name__)

# Force flush stdout/stderr to ensure logs are visible
sys.stdout.flush()
sys.stderr.flush()

# Add signal handlers to log when the process is being terminated
def signal_handler(signum, frame):
    logger.warning(f"Received signal {signum} ({signal.Signals(signum).name})")
    logger.warning(f"Stack trace: {traceback.format_stack(frame)}")
    sys.exit(0)

# Register signal handlers
signal.signal(signal.SIGTERM, signal_handler)
signal.signal(signal.SIGINT, signal_handler)

logger.info("Starting todo.house API backend")
logger.info(f"Environment: {os.getenv('RAILWAY_ENVIRONMENT', 'local')}")
logger.info(f"Database URL configured: {'Yes' if os.getenv('DATABASE_URL') else 'No'}")
logger.info(f"Process ID: {os.getpid()}")
logger.info(f"Python version: {sys.version}")

app = FastAPI(title="todo.house API", version="1.0.0")

# Add exception handler to catch all unhandled exceptions
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Unhandled exception: {exc}")
    logger.error(f"Exception traceback: {traceback.format_exc()}")
    logger.error(f"Request: {request.method} {request.url}")
    return {"detail": "Internal server error", "error": str(exc)}

# Add middleware to log all requests
@app.middleware("http")
async def log_requests(request, call_next):
    logger.info(f"Incoming request: {request.method} {request.url.path}")
    try:
        response = await call_next(request)
        logger.info(f"Request completed: {request.method} {request.url.path} - Status: {response.status_code}")
        return response
    except Exception as e:
        logger.error(f"Request failed: {request.method} {request.url.path} - Error: {e}")
        logger.error(f"Request error traceback: {traceback.format_exc()}")
        raise

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
        logger.error(f"Error reading robots.txt file: {e}")
    # Fallback if file doesn't exist or error occurs
    return PlainTextResponse("User-agent: *\nDisallow: /\n")


@app.on_event("startup")
async def startup_event():
    """Log when the application starts."""
    try:
        logger.info("FastAPI startup event triggered")
        logger.info(f"CORS regex pattern: {CORS_ORIGIN_REGEX}")
        
        # Skip database test on Railway to see if that's causing issues
        railway_env = os.getenv("RAILWAY_ENVIRONMENT")
        logger.info(f"RAILWAY_ENVIRONMENT value: {railway_env}")
        if railway_env and railway_env != "local":
            logger.info("Running on Railway, skipping startup DB test")
        else:
            # Test database connection on startup
            logger.info("Testing database connection...")
            try:
                async with get_session() as session:
                    result = await session.execute(text("SELECT 1"))
                    logger.info(f"Database query result: {result.scalar()}")
                    await session.commit()  # Explicitly commit
                logger.info("Database connection verified successfully")
            except Exception as db_error:
                logger.error(f"Database connection failed: {db_error}")
                logger.error(f"Database error traceback: {traceback.format_exc()}")
                # Don't exit here, let the app continue to start
        
        logger.info("FastAPI application startup complete")
    except Exception as e:
        logger.error(f"Startup event failed with error: {e}")
        logger.error(f"Startup error traceback: {traceback.format_exc()}")
        raise


@app.on_event("shutdown")
async def shutdown_event():
    """Log when the application shuts down."""
    logger.warning("FastAPI shutdown event triggered!")
    logger.warning(f"Shutdown traceback: {traceback.format_stack()}")
    logger.info("FastAPI application shutting down")


@app.get("/")
async def root():
    logger.info("Root endpoint called")
    return {"message": "todo.house API is running!"}


@app.get("/health")
async def health():
    """Simple health check endpoint for Railway."""
    logger.info("Health endpoint called")
    return {"status": "healthy"}


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


# Log at module level to catch any module loading issues
logger.info("Main module loaded successfully")

# Add atexit handler to log when Python is exiting
def on_exit():
    logger.warning("Python process is exiting!")
    logger.warning(f"Exit stack trace: {traceback.format_stack()}")
    # Force flush to ensure logs are written
    sys.stdout.flush()
    sys.stderr.flush()
    logging.shutdown()

atexit.register(on_exit)

# Log that we've registered everything
logger.info("All handlers and middleware registered successfully")
