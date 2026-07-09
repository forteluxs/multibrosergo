/**
 * ICookieManager
 * Contract for cookie read/write operations via CDP in headless mode.
 */
class ICookieManager {
  /**
   * @param {Profile} profile
   * @returns {Promise<Array>}
   */
  async getCookies(profile) { throw new Error('Not implemented'); }

  /**
   * @param {Profile} profile
   * @param {Array} cookies
   * @returns {Promise<void>}
   */
  async setCookies(profile, cookies) { throw new Error('Not implemented'); }
}

module.exports = ICookieManager;
