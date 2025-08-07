#!/usr/bin/env python
"""Direct runner for the FastAPI app to ensure it stays in foreground."""

import os
import sys
import signal
import uvicorn

# Prevent any buffering
sys.stdout = sys.__stdout__
sys.stderr = sys.__stderr__

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    # Use IPv6 for Railway (::) instead of IPv4 (0.0.0.0)
    host = "::" if os.environ.get("RAILWAY_ENVIRONMENT") else "0.0.0.0"
    
    print(f"Starting server on {host}:{port} (IPv6 for Railway)...", flush=True)
    
    # Set up signal handlers to see if Railway is sending signals
    def handle_signal(signum, frame):
        print(f"Received signal {signum} - {signal.Signals(signum).name}", flush=True)
        sys.exit(0)
    
    signal.signal(signal.SIGTERM, handle_signal)
    signal.signal(signal.SIGINT, handle_signal)
    
    try:
        # Run uvicorn directly without subprocesses
        uvicorn.run(
            "app.main:app",
            host=host,
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
    except SystemExit:
        print("SystemExit caught", flush=True)
    except Exception as e:
        print(f"Unexpected error: {e}", flush=True)
        raise
    finally:
        print("Server exiting", flush=True)