const fs = require('fs');
const path = require('path');
const IProfileRepository = require('./IProfileRepository');
const Profile = require('../entities/Profile');

class JSONProfileRepository extends IProfileRepository {
  constructor(filePath) {
    super();
    // Convert DB file path from .sqlite to .json
    this.filePath = filePath.replace(/\.sqlite$/, '.json');
    this._initDb();
  }

  _initDb() {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      if (!fs.existsSync(this.filePath)) {
        fs.writeFileSync(this.filePath, JSON.stringify([], null, 2), 'utf8');
      }
    } catch (err) {
      console.error('[JSONProfileRepository] Init error:', err.message);
    }
  }

  async _read() {
    try {
      if (!fs.existsSync(this.filePath)) {
        return [];
      }
      const data = fs.readFileSync(this.filePath, 'utf8');
      return JSON.parse(data || '[]');
    } catch (e) {
      console.error('[JSONProfileRepository] Read error:', e.message);
      return [];
    }
  }

  async _write(data) {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
      console.error('[JSONProfileRepository] Write error:', e.message);
    }
  }

  async save(profile) {
    const items = await this._read();
    // Remove if already exists (primary key constraint)
    const filtered = items.filter((i) => i.id !== profile.id);
    filtered.push(profile);
    await this._write(filtered);
    return profile;
  }

  async update(id, data) {
    const items = await this._read();
    const index = items.findIndex((i) => i.id === id);
    if (index !== -1) {
      items[index] = { ...items[index], ...data };
      await this._write(items);
    }
  }

  async findById(id) {
    const items = await this._read();
    const row = items.find((i) => i.id === id);
    return row ? new Profile(row) : null;
  }

  async findAll() {
    const items = await this._read();
    return items.map((r) => new Profile(r));
  }

  async delete(id) {
    const items = await this._read();
    const filtered = items.filter((i) => i.id !== id);
    const changed = items.length !== filtered.length;
    await this._write(filtered);
    return changed ? 1 : 0;
  }

  async close() {
    // No-op for JSON repository
  }
}

module.exports = JSONProfileRepository;
