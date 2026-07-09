const sqlite3 = require('sqlite3').verbose();
const IProfileRepository = require('./IProfileRepository');
const Profile = require('../entities/Profile');
const { DeviceType } = require('../constants/DeviceType');

const ALLOWED_UPDATE_COLUMNS = new Set([
  'name', 'proxy_host', 'proxy_port', 'proxy_user', 'proxy_pass',
  'user_agent', 'screen_resolution', 'webgl_vendor', 'timezone',
  'webrtc_mode', 'ip_address', 'country', 'canvas_noise', 'audio_noise',
  'latitude', 'longitude', 'notes',
]);

const SCHEMA_COLUMNS = [
  { name: 'ip_address', type: 'TEXT' },
  { name: 'country', type: 'TEXT' },
  { name: 'canvas_noise', type: 'TEXT' },
  { name: 'audio_noise', type: 'TEXT' },
  { name: 'latitude', type: 'REAL' },
  { name: 'longitude', type: 'REAL' },
  { name: 'notes', type: 'TEXT' },
  { name: 'device_type', type: 'TEXT', default: DeviceType.DESKTOP },
];

class SQLiteProfileRepository extends IProfileRepository {
  constructor(dbFilePath) {
    super();
    this.db = new sqlite3.Database(dbFilePath, (err) => {
      if (err) console.error('[SQLiteRepo] DB connection error:', err.message);
    });
    this._initDb();
  }

  _initDb() {
    this.db.serialize(() => {
      this.db.run(`
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
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          ip_address TEXT,
          country TEXT,
          canvas_noise TEXT,
          audio_noise TEXT,
          latitude REAL,
          longitude REAL,
          notes TEXT,
          device_type TEXT NOT NULL DEFAULT '${DeviceType.DESKTOP}'
        )
      `);

      this.db.run('PRAGMA journal_mode=WAL');
      this.db.run('PRAGMA foreign_keys=ON');
      this._applyMigrations();
    });
  }

  _applyMigrations() {
    this.db.all('PRAGMA table_info(profiles)', [], (err, rows) => {
      if (err) {
        console.error('[SQLiteRepo] Failed to read table_info:', err.message);
        return;
      }
      const existing = new Set(rows.map((r) => r.name));
      for (const col of SCHEMA_COLUMNS) {
        if (existing.has(col.name)) continue;
        const defaultClause = col.default != null
          ? ` NOT NULL DEFAULT '${col.default}'`
          : '';
        const sql = `ALTER TABLE profiles ADD COLUMN ${col.name} ${col.type}${defaultClause}`;
        this.db.run(sql, (alterErr) => {
          if (alterErr) {
            console.error(`[SQLiteRepo] Failed to add column ${col.name}:`, alterErr.message);
          } else {
            console.log(`[SQLiteRepo] Migrated: added column '${col.name}'`);
          }
        });
      }
    });
  }

  async save(profile) {
    return new Promise((resolve, reject) => {
      const sql = `INSERT INTO profiles (
        id, name, device_type, proxy_host, proxy_port, proxy_user, proxy_pass,
        user_agent, screen_resolution, webgl_vendor, timezone, webrtc_mode, created_at,
        ip_address, country, canvas_noise, audio_noise, latitude, longitude, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      this.db.run(sql, [
        profile.id,
        profile.name,
        profile.device_type,
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
        profile.audio_noise,
        profile.latitude,
        profile.longitude,
        profile.notes || '',
      ], function (err) {
        if (err) return reject(err);
        resolve(profile);
      });
    });
  }

  async update(id, data) {
    const fields = Object.keys(data).filter((f) => ALLOWED_UPDATE_COLUMNS.has(f));
    if (fields.length === 0) return;

    return new Promise((resolve, reject) => {
      const setClause = fields.map((f) => `${f} = ?`).join(', ');
      const values = fields.map((f) => data[f]);
      values.push(id);
      const sql = `UPDATE profiles SET ${setClause} WHERE id = ?`;
      this.db.run(sql, values, function (err) {
        if (err) return reject(err);
        resolve();
      });
    });
  }

  async findById(id) {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM profiles WHERE id = ?', [id], (err, row) => {
        if (err) return reject(err);
        resolve(row ? new Profile(row) : null);
      });
    });
  }

  async findAll() {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM profiles', [], (err, rows) => {
        if (err) return reject(err);
        resolve(rows.map((r) => new Profile(r)));
      });
    });
  }

  async delete(id) {
    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM profiles WHERE id = ?', [id], function (err) {
        if (err) return reject(err);
        resolve(this.changes);
      });
    });
  }

  close() {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  }
}

module.exports = SQLiteProfileRepository;
