const Profile = require('../entities/Profile');
const { v4: uuidv4 } = require('uuid');
const http = require('http');

function getProxyIpInfo(host, port) {
  return new Promise((resolve) => {
    const options = {
      host: host,
      port: port,
      path: 'http://ip-api.com/json',
      headers: {
        Host: 'ip-api.com'
      },
      timeout: 2500
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
            lon: json.lon || null
          });
        } catch (e) {
          resolve({ ip: host, country: 'Unknown', lat: null, lon: null });
        }
      });
    }).on('error', () => {
      resolve({ ip: host, country: 'Offline/Unknown', lat: null, lon: null });
    });
  });
}

function getDirectIpInfo() {
  return new Promise((resolve) => {
    http.get('http://ip-api.com/json', (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ 
            ip: json.query || 'Direct', 
            country: json.country || 'Local',
            lat: json.lat || null,
            lon: json.lon || null
          });
        } catch (e) {
          resolve({ ip: 'Direct', country: 'Local', lat: null, lon: null });
        }
      });
    }).on('error', () => {
      resolve({ ip: 'Direct', country: 'Local', lat: null, lon: null });
    });
  });
}

/**
 * ProfileService
 * Handles business logic related to Profiles.
 * Adheres to Dependency Inversion by depending on IProfileRepository abstraction.
 */
class ProfileService {
  constructor(profileRepository) {
    this.profileRepository = profileRepository;
  }

  async createProfile(data) {
    let resolvedIp = 'Direct';
    let resolvedCountry = 'Local';
    let resolvedLat = null;
    let resolvedLon = null;
    
    if (data.proxy_host && data.proxy_port) {
      try {
        const info = await getProxyIpInfo(data.proxy_host, parseInt(data.proxy_port, 10));
        resolvedIp = info.ip;
        resolvedCountry = info.country;
        resolvedLat = info.lat;
        resolvedLon = info.lon;
      } catch (e) {
        resolvedIp = data.proxy_host;
        resolvedCountry = 'Error';
      }
    } else {
      try {
        const info = await getDirectIpInfo();
        resolvedIp = info.ip;
        resolvedCountry = info.country;
        resolvedLat = info.lat;
        resolvedLon = info.lon;
      } catch (e) {}
    }

    // Generate simple defaults for fingerprint if not provided
    const newProfile = new Profile({
      id: uuidv4(),
      name: data.name || 'New Profile',
      proxy_host: data.proxy_host || null,
      proxy_port: data.proxy_port ? parseInt(data.proxy_port, 10) : null,
      proxy_user: data.proxy_user || null,
      proxy_pass: data.proxy_pass || null,
      user_agent: data.user_agent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      screen_resolution: data.screen_resolution || '1920x1080',
      webgl_vendor: data.webgl_vendor || 'Google Inc. (NVIDIA)',
      timezone: data.timezone || 'auto',
      webrtc_mode: data.webrtc_mode || 'altered',
      created_at: new Date().toISOString(),
      ip_address: resolvedIp,
      country: resolvedCountry,
      canvas_noise: data.canvas_noise || 'disabled',
      audio_noise: data.audio_noise || 'disabled',
      latitude: resolvedLat,
      longitude: resolvedLon
    });

    return await this.profileRepository.save(newProfile);
  }

  async getAllProfiles() {
    return await this.profileRepository.findAll();
  }

  async getProfileById(id) {
    return await this.profileRepository.findById(id);
  }

  async deleteProfile(id) {
    return await this.profileRepository.delete(id);
  }
}

module.exports = ProfileService;
