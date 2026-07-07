const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const IProfileRepository = require('./IProfileRepository');
const Profile = require('../entities/Profile');

/**
 * SQLite Implementation of IProfileRepository
 */
class SQLiteProfileRepository extends IProfileRepository {
  constructor(dbFilePath) {
    super();
    this.db = new sqlite3.Database(dbFilePath, (err) => {
      if (err) console.error('DB connection error:', err.message);
    });
    this._initDb();
  }

  _initDb() {
    const query = `
      CREATE TABLE IF NOT EXISTS profiles (
        id TEXT PRIMARY KEY, name TEXT NOT NULL,
        proxy_host TEXT, proxy_port INTEGER, proxy_user TEXT, proxy_pass TEXT,
        user_agent TEXT, screen_resolution TEXT, webgl_vendor TEXT,
        timezone TEXT, webrtc_mode TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        ip_address TEXT, country TEXT, canvas_noise TEXT, audio_noise TEXT
      )
    `;
    this.db.run(query, () => {
      // Alter table to add columns in case the DB existed previously
      this.db.run(`ALTER TABLE profiles ADD COLUMN ip_address TEXT`, () => {});
      this.db.run(`ALTER TABLE profiles ADD COLUMN country TEXT`, () => {});
      this.db.run(`ALTER TABLE profiles ADD COLUMN canvas_noise TEXT`, () => {});
      this.db.run(`ALTER TABLE profiles ADD COLUMN audio_noise TEXT`, () => {});
    });
  }

  async save(profile) {
    return new Promise((resolve, reject) => {
      const sql = `INSERT INTO profiles (
        id, name, proxy_host, proxy_port, proxy_user, proxy_pass,
        user_agent, screen_resolution, webgl_vendor, timezone, webrtc_mode, created_at,
        ip_address, country, canvas_noise, audio_noise
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      this.db.run(sql, [
        profile.id,
        profile.name,
        profile.proxy_host,
        profile.proxy_port,
        profile.proxy_user,
        profile.proxy_pass,
        profile.user_agent,
        profile.screen_resolution,
        profile.webgl_vendor,
        profile.timezone,
        profile.webrtc_mode,
        profile.created_at,
        profile.ip_address,
        profile.country,
        profile.canvas_noise,
        profile.audio_noise
      ], function(err) {
        if (err) reject(err);
        else resolve(profile);
      });
    });
  }

  async findById(id) {
    return new Promise((resolve, reject) => {
      this.db.get(`SELECT * FROM profiles WHERE id = ?`, [id], (err, row) => {
        if (err) reject(err);
        else resolve(row ? new Profile(row) : null);
      });
    });
  }

  async findAll() {
    return new Promise((resolve, reject) => {
      this.db.all(`SELECT * FROM profiles`, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows.map(r => new Profile(r)));
      });
    });
  }

  async delete(id) {
    return new Promise((resolve, reject) => {
      this.db.run(`DELETE FROM profiles WHERE id = ?`, [id], function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      });
    });
  }
}

module.exports = SQLiteProfileRepository;
