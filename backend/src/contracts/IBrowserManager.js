/**
 * IBrowserManager
 * Contract for browser lifecycle operations.
 * Dependency Inversion - services depend on this, not on Puppeteer directly.
 */
class IBrowserManager {
  /**
   * @param {Profile} profile
   * @returns {Promise<{ status: string, profileId: string }>}
   */
  async launch(profile) { throw new Error('Not implemented'); }

  /**
   * @param {string} profileId
   * @returns {Promise<void>}
   */
  async close(profileId) { throw new Error('Not implemented'); }

  /**
   * @returns {string[]}
   */
  getActiveProfileIds() { throw new Error('Not implemented'); }

  /**
   * @param {string} profileId
   * @returns {boolean}
   */
  isRunning(profileId) { throw new Error('Not implemented'); }

  /**
   * Closes all tracked browser instances.
   * @returns {Promise<void>}
   */
  async closeAll() { throw new Error('Not implemented'); }
}

module.exports = IBrowserManager;
