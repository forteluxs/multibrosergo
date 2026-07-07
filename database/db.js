const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Hubungkan ke database SQLite lokal
const dbPath = path.resolve(__dirname, 'profiles.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Gagal terhubung ke database:', err.message);
  } else {
    console.log('Terhubung ke database lokal SQLite.');
    initDb();
  }
});

function initDb() {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      proxy_host TEXT,
      proxy_port INTEGER,
      proxy_user TEXT,
      proxy_pass TEXT,
      user_agent TEXT,
      screen_resolution TEXT,
      webgl_vendor TEXT,
      timezone TEXT,
      webrtc_mode TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;

  db.run(createTableQuery, (err) => {
    if (err) {
      console.error('Gagal membuat tabel profiles:', err.message);
    } else {
      console.log('Tabel profiles siap digunakan.');
    }
  });
}

function addProfile(profileData, callback) {
  const { id, name, proxy_host, proxy_port, proxy_user, proxy_pass, user_agent } = profileData;
  const sql = `INSERT INTO profiles (id, name, proxy_host, proxy_port, proxy_user, proxy_pass, user_agent) 
               VALUES (?, ?, ?, ?, ?, ?, ?)`;
  
  db.run(sql, [id, name, proxy_host, proxy_port, proxy_user, proxy_pass, user_agent], function(err) {
    callback(err);
  });
}

function getAllProfiles(callback) {
  db.all(`SELECT * FROM profiles`, [], (err, rows) => {
    callback(err, rows);
  });
}

module.exports = {
  db,
  addProfile,
  getAllProfiles
};
