const express = require('express');
const cors = require('cors');
const path = require('path');

// DI Imports
const SQLiteProfileRepository = require('./src/repositories/SQLiteProfileRepository');
const ProfileService = require('./src/services/ProfileService');
const BrowserService = require('./src/services/BrowserService');
const ProfileController = require('./src/controllers/ProfileController');
const profileRoutes = require('./src/routes/profileRoutes');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// ==========================================
// Dependency Injection Container Setup
// ==========================================

// 1. Repositories
const dbPath = path.resolve(__dirname, 'database', 'profiles.sqlite');
const profileRepository = new SQLiteProfileRepository(dbPath);

// 2. Services
const profileService = new ProfileService(profileRepository);
const browserService = new BrowserService();

// 3. Controllers
const profileController = new ProfileController(profileService, browserService);

// ==========================================
// Route Binding
// ==========================================
app.use('/api/profiles', profileRoutes(profileController));

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({ error: 'Something broke!' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`[Backend] Sidecar Server running on http://localhost:${PORT}`);
});
