const { app, BrowserWindow } = require('electron');
const path = require('path');

// Disable sandbox since we are launching Puppeteer with no-sandbox
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('disable-setuid-sandbox');

// Listen for uncaught exceptions from Express so EADDRINUSE doesn't crash the app
process.on('uncaughtException', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.warn('[Electron] Port 4000 is already in use. Assuming backend is already running.');
  } else {
    console.error('[Electron] Uncaught Exception:', err);
  }
});

let mainWindow;

function startBackend() {
  console.log('[Electron] Initializing backend server...');
  try {
    // Set default environment variables for production/packaged environment
    process.env.NO_SANDBOX = 'true';
    process.env.PORT = process.env.PORT || '4000';
    
    // Set DB path inside user data directory to persist database updates
    // In production, the database should be stored in the app's user data directory (AppData/Roaming or ~/.config)
    // so it doesn't get overwritten or lost when the app is updated/reinstalled!
    const dbPath = path.join(app.getPath('userData'), 'profiles.sqlite');
    process.env.DB_PATH = dbPath;
    console.log(`[Electron] SQLite DB path: ${dbPath}`);

    // Create database folder if it doesn't exist
    const fs = require('fs');
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    // Launch Express backend in-process
    require('./backend/server.js');
    console.log('[Electron] Backend server started successfully.');
  } catch (err) {
    console.error('[Electron] Failed to launch backend server:', err);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    title: 'MultibrowserGo',
  });

  const isDev = process.argv.includes('--development') || !app.isPackaged;

  const distPath = path.join(__dirname, 'ui/dist/index.html');

  if (isDev) {
    const http = require('http');
    const req = http.get('http://localhost:1420', () => {
      if (mainWindow) mainWindow.loadURL('http://localhost:1420');
    });
    req.on('error', () => {
      if (mainWindow) mainWindow.loadFile(distPath);
    });
    req.end();
  } else {
    // Serve static Vite files
    mainWindow.loadFile(distPath);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  startBackend();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
