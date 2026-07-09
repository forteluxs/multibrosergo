const fs = require('fs');
const path = require('path');
const Profile = require('../entities/Profile');
const { v4: uuidv4 } = require('uuid');
const { NotFoundError } = require('../errors');
const { DeviceType } = require('../constants/DeviceType');
const config = require('../config');

class ProfileService {
  /**
   * @param {IProfileRepository} profileRepository
   * @param {IIpGeoResolver} ipGeoResolver
   */
  constructor(profileRepository, ipGeoResolver) {
    this.profileRepository = profileRepository;
    this.ipGeoResolver = ipGeoResolver;
  }

  async createProfile(data) {
    let resolvedIp = 'Direct';
    let resolvedCountry = 'Local';
    let resolvedLat = null;
    let resolvedLon = null;

    if (data.proxy_host && data.proxy_port) {
      try {
        const info = await this.ipGeoResolver.resolveViaProxy(data.proxy_host, data.proxy_port);
        resolvedIp = info.ip;
        resolvedCountry = info.country;
        resolvedLat = info.lat;
        resolvedLon = info.lon;
      } catch (e) {
        resolvedIp = data.proxy_host;
        resolvedCountry = 'Error';
        console.warn('[ProfileService] Failed to resolve proxy geo:', e.message);
      }
    } else {
      try {
        const info = await this.ipGeoResolver.resolveDirect();
        resolvedIp = info.ip;
        resolvedCountry = info.country;
        resolvedLat = info.lat;
        resolvedLon = info.lon;
      } catch (e) {
        console.warn('[ProfileService] Failed to resolve direct geo:', e.message);
      }
    }

    const port = data.proxy_port != null ? parseInt(data.proxy_port, 10) : null;

    const profile = new Profile({
      id: uuidv4(),
      name: data.name || 'New Profile',
      device_type: data.device_type || DeviceType.DESKTOP,
      proxy_host: data.proxy_host || null,
      proxy_port: isNaN(port) ? null : port,
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
      longitude: resolvedLon,
      notes: data.notes || '',
    });

    return this.profileRepository.save(profile);
  }

  async updateProfileNotes(id, notes) {
    const existing = await this.profileRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Profile');
    }
    await this.profileRepository.update(id, { notes });
    return this.profileRepository.findById(id);
  }

  async getAllProfiles() {
    return this.profileRepository.findAll();
  }

  async getProfileById(id) {
    const profile = await this.profileRepository.findById(id);
    if (!profile) {
      throw new NotFoundError('Profile');
    }
    return profile;
  }

  async deleteProfile(id) {
    const profile = await this.profileRepository.findById(id);
    if (!profile) {
      throw new NotFoundError('Profile');
    }

    const userDataDir = path.join(config.puppeteer.userDataDirBase, id);
    try {
      if (fs.existsSync(userDataDir)) {
        fs.rmSync(userDataDir, { recursive: true, force: true });
        console.log(`[ProfileService] Cleaned up profile directory: ${userDataDir}`);
      }
    } catch (e) {
      console.warn(`[ProfileService] Failed to clean up ${userDataDir}:`, e.message);
    }

    return this.profileRepository.delete(id);
  }
}

module.exports = ProfileService;
