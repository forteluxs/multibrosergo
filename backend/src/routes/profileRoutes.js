const express = require('express');

/**
 * Initializes profile routes with the given controller.
 * @param {ProfileController} profileController
 * @returns {express.Router}
 */
module.exports = function(profileController) {
  const router = express.Router();

  router.post('/', profileController.create);
  router.get('/', profileController.getAll);

  // Test if proxy can establish an HTTPS tunnel to Google (bulletproof timeout version)
  function checkProxyTunnel(host, port, timeout = 2000) {
    return new Promise((resolve) => {
      const net = require('net');
      const socket = new net.Socket();
      let resolved = false;
      
      // Manual timer to guarantee resolution within the timeout limit
      const timer = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          socket.destroy();
          resolve(false);
        }
      }, timeout);
      
      socket.on('connect', () => {
        socket.write(`CONNECT www.google.com:443 HTTP/1.1\r\nHost: www.google.com:443\r\nUser-Agent: Mozilla/5.0\r\n\r\n`);
      });
      
      socket.on('data', (data) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          const responseText = data.toString();
          if (
            responseText.includes('200 Connection') || 
            responseText.includes('200 OK') ||
            responseText.startsWith('HTTP/1.1 200') ||
            responseText.startsWith('HTTP/1.0 200')
          ) {
            resolve(true);
          } else {
            resolve(false);
          }
          socket.destroy();
        }
      });
      
      const handleError = () => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          socket.destroy();
          resolve(false);
        }
      };
      
      socket.on('error', handleError);
      socket.on('close', handleError);
      
      try {
        socket.connect(port, host);
      } catch (e) {
        handleError();
      }
    });
  }

  router.get('/free-proxy', async (req, res) => {
    try {
      const response = await fetch('https://api.proxyscrape.com/v2/?request=displayproxies&protocol=http&timeout=3500&country=all&ssl=all&anonymity=anonymous');
      const text = await response.text();
      let proxies = text.trim().split(/\r?\n/).filter(p => p.trim() !== '');
      
      // Shuffle the candidates
      proxies = proxies.sort(() => 0.5 - Math.random());
      
      // Test the first 25 in parallel to find a fast and active one
      const candidates = proxies.slice(0, 25);
      const results = await Promise.all(candidates.map(async (proxyStr) => {
        const [host, portStr] = proxyStr.split(':');
        const port = parseInt(portStr, 10);
        const alive = await checkProxyTunnel(host, port, 2000);
        return { host, port, alive };
      }));
      
      const working = results.find(r => r.alive);
      if (working) {
        console.log(`[Proxy Checker] Found working HTTPS-tunnel proxy: ${working.host}:${working.port}`);
        res.json({ host: working.host, port: working.port });
      } else if (results.length > 0) {
        console.warn(`[Proxy Checker] All 25 tested proxies failed HTTPS tunnel test. Fallback to first candidate.`);
        res.json({ host: results[0].host, port: results[0].port });
      } else {
        res.status(500).json({ error: 'No proxies found' });
      }
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.post('/:id/launch', profileController.launch);
  router.delete('/:id', profileController.delete);
  router.put('/:id/notes', profileController.updateNotes);

  return router;
};
