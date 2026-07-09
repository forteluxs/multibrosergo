const express = require('express');
const cors = require('cors');
const { createContainer } = require('./src/container');
const errorHandler = require('./src/middleware/errorHandler');
const config = require('./src/config');

const container = createContainer();

const app = express();

app.use(cors({ origin: config.cors.origins }));
app.use(express.json({ limit: '1mb' }));

app.use('/api/profiles', container.get('profileRoutes'));
app.use('/api/proxy', container.get('proxyRoutes'));

app.use(errorHandler);

const server = app.listen(config.port, () => {
  console.log(`[Backend] Sidecar Server running on http://localhost:${config.port}`);
});

async function shutdown(signal) {
  console.log(`\n[Backend] Received ${signal}. Shutting down gracefully...`);

  try {
    const browserManager = container.get('browserManager');
    await browserManager.closeAll();
    console.log('[Backend] All browsers closed.');
  } catch (e) {
    console.error('[Backend] Error closing browsers:', e.message);
  }

  server.close(() => {
    console.log('[Backend] HTTP server closed.');
    process.exit(0);
  });

  setTimeout(() => {
    console.error('[Backend] Forced shutdown after timeout.');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
