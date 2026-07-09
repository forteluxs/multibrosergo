/**
 * IProxyVerifier
 * Contract for proxy validation and discovery.
 */
class IProxyVerifier {
  /**
   * Checks if a proxy can establish an HTTPS CONNECT tunnel.
   * @param {string} host
   * @param {number} port
   * @param {number} [timeout]
   * @returns {Promise<boolean>}
   */
  async checkTunnel(host, port, timeout) { throw new Error('Not implemented'); }

  /**
   * Fetches and tests free proxies, returns the first working one.
   * @returns {Promise<{host: string, port: number}|null>}
   */
  async findWorkingFreeProxy() { throw new Error('Not implemented'); }
}

module.exports = IProxyVerifier;
