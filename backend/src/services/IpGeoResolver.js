const http = require('http');
const IIpGeoResolver = require('../contracts/IIpGeoResolver');
const config = require('../config');

class IpGeoResolver extends IIpGeoResolver {
  async resolveViaProxy(host, port) {
    const portNum = typeof port === 'string' ? parseInt(port, 10) : port;
    return new Promise((resolve) => {
      const options = {
        host,
        port: portNum,
        path: config.geolocation.apiUrl,
        headers: { Host: 'ip-api.com' },
        timeout: config.geolocation.timeout,
      };

      http.get(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            resolve({
              ip: json.query || host,
              country: json.country || 'Unknown',
              lat: json.lat || null,
              lon: json.lon || null,
            });
          } catch {
            resolve({ ip: host, country: 'Unknown', lat: null, lon: null });
          }
        });
      }).on('error', () => {
        resolve({ ip: host, country: 'Offline/Unknown', lat: null, lon: null });
      });
    });
  }

  async resolveDirect() {
    return new Promise((resolve) => {
      http.get(config.geolocation.apiUrl, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            resolve({
              ip: json.query || 'Direct',
              country: json.country || 'Local',
              lat: json.lat || null,
              lon: json.lon || null,
            });
          } catch {
            resolve({ ip: 'Direct', country: 'Local', lat: null, lon: null });
          }
        });
      }).on('error', () => {
        resolve({ ip: 'Direct', country: 'Local', lat: null, lon: null });
      });
    });
  }
}

module.exports = IpGeoResolver;
