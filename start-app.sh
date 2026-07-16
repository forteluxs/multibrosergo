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

cd backend && setsid -f env NO_SANDBOX=true node server.js < /dev/null > ../backend-server.log 2>&1
cd ..

cd ui && setsid -f node ./node_modules/vite/bin/vite.js --host 0.0.0.0 --port 1420 < /dev/null > ../frontend-server.log 2>&1
cd ..

sleep 2
BACKEND_PID=$(fuser 4000/tcp 2>/dev/null | awk '{print $1}')
FRONTEND_PID=$(fuser 1420/tcp 2>/dev/null | awk '{print $1}')
ALL_IPS=$(hostname -I 2>/dev/null)

echo "$BACKEND_PID $FRONTEND_PID" > .app.pids

echo "==========================================="
echo "Application Initialized Successfully!"
echo "Dashboard (Local): http://localhost:1420 (PID: ${FRONTEND_PID:-running})"
for ip in $ALL_IPS; do
  echo "Dashboard (LAN):   http://${ip}:1420"
done
echo "==========================================="
echo "Akses dari Luar Jaringan (Internet / HP 4G):"
echo "  /home/aaa/bin/cloudflared tunnel --url http://localhost:1420"
echo "==========================================="
echo "To shut down: fuser -k 4000/tcp 1420/tcp"
