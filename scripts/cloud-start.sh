#!/bin/bash
# Cloud startup: launch Python backend + Node MCP HTTP server together
set -e

echo "=== AwesomeContext Cloud MCP Service ==="
echo "Starting Python backend on port ${BACKEND_PORT:-8420}..."

# Start Python FastAPI backend in background
PORT=${BACKEND_PORT:-8420} python scripts/serve.py &
BACKEND_PID=$!

# Wait for backend to be ready
echo "Waiting for backend to be ready..."
for i in $(seq 1 30); do
    if python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:${BACKEND_PORT:-8420}/v1/health')" 2>/dev/null; then
        echo "Backend ready!"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "ERROR: Backend failed to start within 30 seconds"
        exit 1
    fi
    sleep 1
done

# Start MCP HTTP server in foreground
echo "Starting MCP HTTP server on port ${MCP_PORT:-3000}..."
cd /app/mcp-server
exec node dist/server-http.js
