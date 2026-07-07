/**
 * IProfileRepository Interface
 * Follows Dependency Inversion Principle. 
 * Any storage mechanism (SQLite, PostgreSQL, Memory) must implement these methods.
 */
class IProfileRepository {
  async save(profile) { throw new Error('Not implemented'); }
  async findById(id) { throw new Error('Not implemented'); }
  async findAll() { throw new Error('Not implemented'); }
  async update(id, profileData) { throw new Error('Not implemented'); }
  async delete(id) { throw new Error('Not implemented'); }
}

module.exports = IProfileRepository;
