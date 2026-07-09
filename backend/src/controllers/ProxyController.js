const IProxyVerifier = require('../contracts/IProxyVerifier');

class ProxyController {
  /**
   * @param {IProxyVerifier} proxyVerifier
   */
  constructor(proxyVerifier) {
    this.proxyVerifier = proxyVerifier;
  }

  async getFreeProxy(req, res) {
    const result = await this.proxyVerifier.findWorkingFreeProxy();
    if (!result) {
      return res.status(500).json({ error: 'No working proxies found' });
    }
    res.status(200).json(result);
  }
}

module.exports = ProxyController;
