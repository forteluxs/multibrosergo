const net = require('net');
const IProxyVerifier = require('../contracts/IProxyVerifier');
const config = require('../config');

class ProxyVerifier extends IProxyVerifier {
  checkTunnel(host, port, timeout = config.proxy.tunnelTimeout) {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      let resolved = false;

      const timer = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          socket.destroy();
          resolve(false);
        }
      }, timeout);

      socket.on('connect', () => {
        socket.write(
          `CONNECT www.google.com:443 HTTP/1.1\r\n` +
          `Host: www.google.com:443\r\n` +
          `User-Agent: Mozilla/5.0\r\n\r\n`
        );
      });

      socket.on('data', (data) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          const text = data.toString();
          const ok = (
            text.includes('200 Connection') ||
            text.includes('200 OK') ||
            text.startsWith('HTTP/1.1 200') ||
            text.startsWith('HTTP/1.0 200')
          );
          socket.destroy();
          resolve(ok);
        }
      });

      const fail = () => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          socket.destroy();
          resolve(false);
        }
      };

      socket.on('error', fail);
      socket.on('close', () => {
        if (!resolved) {
          fail();
        }
      });

      try {
        socket.connect(parseInt(port, 10), host);
      } catch {
        fail();
      }
    });
  }

  async findWorkingFreeProxy() {
    const response = await fetch(config.proxy.freeProxyUrl);
    const text = await response.text();
    let proxies = text.trim().split(/\r?\n/).filter((p) => p.trim() !== '');

    proxies = proxies.sort(() => 0.5 - Math.random());

    const candidates = proxies.slice(0, config.proxy.maxCandidates);
    const results = await Promise.all(
      candidates.map(async (proxyStr) => {
        const [host, portStr] = proxyStr.split(':');
        const port = parseInt(portStr, 10);
        if (!host || !port) return null;
        const alive = await this.checkTunnel(host, port);
        return alive ? { host, port } : null;
      })
    );

    const working = results.find((r) => r !== null);
    if (working) {
      console.log(`[Proxy Verifier] Found working HTTPS-tunnel proxy: ${working.host}:${working.port}`);
      return working;
    }

    const first = results.find((r) => r !== null);
    if (first) {
      console.warn(`[Proxy Verifier] All tested proxies failed. Fallback to: ${first.host}:${first.port}`);
      return first;
    }

    return null;
  }
}

module.exports = ProxyVerifier;
