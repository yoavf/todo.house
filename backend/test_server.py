#!/usr/bin/env python
"""Minimal test server to debug Railway issue."""

import os
import signal
import sys
from http.server import HTTPServer, BaseHTTPRequestHandler

class SimpleHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'text/plain')
        self.end_headers()
        self.wfile.write(b'Hello from test server')

def signal_handler(signum, frame):
    print(f"Received signal {signum}", flush=True)
    sys.exit(0)

if __name__ == "__main__":
    signal.signal(signal.SIGTERM, signal_handler)
    signal.signal(signal.SIGINT, signal_handler)
    
    port = int(os.environ.get("PORT", 8080))
    host = "::" if os.environ.get("RAILWAY_ENVIRONMENT") else "0.0.0.0"
    
    print(f"Starting minimal test server on {host}:{port}", flush=True)
    
    server = HTTPServer((host, port), SimpleHandler)
    print(f"Test server running on {host}:{port}", flush=True)
    
    try:
        server.serve_forever()
    except Exception as e:
        print(f"Server error: {e}", flush=True)
    finally:
        print("Test server shutting down", flush=True)