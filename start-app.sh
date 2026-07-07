#!/usr/bin/env bash

# multibrosergo Startup Script
echo "==========================================="
echo "  multibrosergo Bootstrapper"
echo "==========================================="

# Check Node.js installation
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed! Please install it first."
    exit 1
fi

# Ensure Puppeteer Chromium browser is installed
echo "[1/3] Checking Chromium browser in cache..."
if [ ! -d "$HOME/.cache/puppeteer" ]; then
    echo "Chromium browser not found, installing..."
    npx puppeteer browsers install chrome
else
    echo "Chromium browser cache verified."
fi

# Kill any existing processes running on ports 4000 or 1420
echo "Cleaning up any old server instances..."
fuser -k 4000/tcp >/dev/null 2>&1
fuser -k 1420/tcp >/dev/null 2>&1

# Start Backend Sidecar Server
echo "[2/3] Starting Express Sidecar API on port 4000..."
nohup node backend/server.js > backend-server.log 2>&1 &
BACKEND_PID=$!
echo "Backend running (PID: $BACKEND_PID). Logs: backend-server.log"

# Start Frontend Dev Server
echo "[3/3] Starting Vite Dev Server on port 1420..."
cd ui
nohup npm run dev > ../frontend-server.log 2>&1 &
FRONTEND_PID=$!
cd ..
echo "Frontend running (PID: $FRONTEND_PID). Logs: frontend-server.log"

# Wait a brief moment for servers to spin up
sleep 2

echo "==========================================="
echo "🚀 Application Initialized Successfully!"
echo "👉 Dashboard URL: http://localhost:1420"
echo "👉 Backend API:   http://localhost:4000"
echo "==========================================="
echo "To shut down all active servers, run: kill $BACKEND_PID $FRONTEND_PID"
