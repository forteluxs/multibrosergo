#!/usr/bin/env bash

echo "==========================================="
echo "  multibrosergo Bootstrapper"
echo "==========================================="

if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed!"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "Error: Node.js 18+ required (found v$(node -v))"
    exit 1
fi

echo "[1/4] Installing backend dependencies..."
(cd backend && npm install --silent 2>/dev/null)

echo "[2/4] Installing frontend dependencies..."
(cd ui && npm install --silent 2>/dev/null)

echo "[3/4] Checking Chromium browser in cache..."
if [ ! -d "$HOME/.cache/puppeteer" ]; then
    echo "Chromium browser not found, installing..."
    (cd backend && npx puppeteer browsers install chrome)
else
    echo "Chromium browser cache verified."
fi

# Kill old processes on the target ports
echo "Cleaning up old server instances..."
fuser -k 4000/tcp >/dev/null 2>&1
fuser -k 1420/tcp >/dev/null 2>&1

echo "[4/4] Starting servers..."
export NO_SANDBOX=true

cd backend && NO_SANDBOX=true node server.js > ../backend-server.log 2>&1 &
BACKEND_PID=$!
cd ..
echo "Backend running (PID: $BACKEND_PID). Logs: backend-server.log"

cd ui && npx vite --port 1420 > ../frontend-server.log 2>&1 &
FRONTEND_PID=$!
cd ..
echo "Frontend running (PID: $FRONTEND_PID). Logs: frontend-server.log"

echo "$BACKEND_PID $FRONTEND_PID" > .app.pids

sleep 2

echo "==========================================="
echo "Application Initialized Successfully!"
echo "Dashboard: http://localhost:1420"
echo "Backend API: http://localhost:4000"
echo "==========================================="
echo "To shut down: kill $BACKEND_PID $FRONTEND_PID"
echo "(also saved to .app.pids)"
