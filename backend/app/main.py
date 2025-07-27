from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import supabase
from .tasks import router as tasks_router
from .images import router as images_router
from .logging_config import setup_logging
import os

# Initialize structured logging
setup_logging(
    log_level=os.getenv("LOG_LEVEL", "INFO"),
    enable_json=os.getenv("ENABLE_JSON_LOGGING", "true").lower() == "true"
)

app = FastAPI(title="todo.house API", version="1.0.0")

# CORS middleware for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
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
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_KEY")

        if not supabase_url or not supabase_key:
            return {"status": "error", "message": "Missing Supabase credentials"}

        supabase.table("tasks").select("count", count="exact").execute()
        return {
            "status": "healthy",
            "database": "connected",
            "tables": "tasks table found",
        }
    except Exception as e:
        return {"status": "error", "database": f"error: {str(e)}"}
