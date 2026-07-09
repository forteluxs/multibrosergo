/**
 * IIpGeoResolver
 * Contract for IP geolocation resolution.
 */
class IIpGeoResolver {
  /**
   * Resolves geolocation for a proxy IP via tunnel.
   * @param {string} host
   * @param {number} port
   * @returns {Promise<{ip: string, country: string, lat: number|null, lon: number|null}>}
   */
  async resolveViaProxy(host, port) { throw new Error('Not implemented'); }

  /**
   * Resolves geolocation for the direct connection.
   * @returns {Promise<{ip: string, country: string, lat: number|null, lon: number|null}>}
   */
  async resolveDirect() { throw new Error('Not implemented'); }
}

module.exports = IIpGeoResolver;
