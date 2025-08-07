#!/usr/bin/env python
"""Direct runner for the FastAPI app to ensure it stays in foreground."""

import os
import uvicorn

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    print(f"Starting server on port {port}...", flush=True)
    
    # Run uvicorn directly without subprocesses
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=port,
        log_level="info",
        access_log=True,
        # Don't use reload or workers which spawn subprocesses
        reload=False,
        workers=None,
        # Keep process in foreground
        loop="asyncio",
        # Ensure logs are visible
        use_colors=False,
    )