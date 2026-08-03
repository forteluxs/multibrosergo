const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const path = require('path');
const fs = require('fs');
const os = require('os');
const IBrowserManager = require('../contracts/IBrowserManager');
const config = require('../config');
const {
  resolveLanguageCode,
  resolveWebGL,
  resolvePlatform,
  resolveBrand,
  buildInjectionScript,
} = require('../fingerprint/injector');

puppeteer.use(StealthPlugin());

class DesktopBrowserManager extends IBrowserManager {
  constructor() {
    super();
    this._browsers = new Map();
    this._launching = new Map();
  }

  async launch(profile) {
    if (this._browsers.has(profile.id)) {
      return { status: 'already_running', profileId: profile.id };
    }
    const inFlight = this._launching.get(profile.id);
    if (inFlight) return inFlight;

    const promise = this._doLaunch(profile).finally(() => {
      this._launching.delete(profile.id);
    });
    this._launching.set(profile.id, promise);
    return promise;
  }

  isRunning(profileId) {
    return this._browsers.has(profileId);
  }

  async _doLaunch(profile) {
    console.log(`[DesktopBrowserManager] Launching profile: ${profile.name} (${profile.id})`);

    const userDataDir = path.join(config.puppeteer.userDataDirBase, profile.id);
    const args = [];

    args.push(
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-infobars',
      '--ignore-certificate-errors',
      '--ignore-certificate-errors-spki-list',
      '--no-first-run',
      '--no-default-browser-check',
      '--homepage=about:blank',
      '--disable-features=ChromeWhatsNewUI,PrivacySandboxSettings4',
      '--disable-blink-features=AutomationControlled'
    );

    if (profile.webrtc_mode === 'blocked') {
      args.push('--disable-webrtc', '--disable-peer-connection');
    }

    const langCode = resolveLanguageCode(profile.country);
    args.push(`--lang=${langCode}`);

    const { width, height } = this._parseResolution(profile.screen_resolution);
    args.push(`--window-size=${width},${height}`);

    this._loadExtensions(args);

    if (profile.proxy_host && profile.proxy_port) {
      args.push(`--proxy-server=${profile.proxy_host}:${profile.proxy_port}`);
    }

    const browser = await puppeteer.launch({
      headless: config.puppeteer.headless,
      userDataDir,
      args,
      ignoreDefaultArgs: ['--enable-automation'],
      defaultViewport: null,
    });

    this._browsers.set(profile.id, browser);
    browser.on('disconnected', () => {
      this._browsers.delete(profile.id);
      console.log(`[DesktopBrowserManager] Browser disconnected: ${profile.id}`);
    });

    const pages = await browser.pages();
    const page = pages.length > 0 ? pages[0] : await browser.newPage();

    if (profile.proxy_user && profile.proxy_pass) {
      await page.authenticate({ username: profile.proxy_user, password: profile.proxy_pass });
    }

    if (profile.user_agent) {
      await page.setUserAgent(profile.user_agent);
    }

    await this._emulateTimezone(page, profile);
    await this._emulateViewport(page, profile);
    await this._emulateGeolocation(browser, page, profile);

    const webgl = resolveWebGL(profile.webgl_vendor);
    const platformName = resolvePlatform(profile.user_agent);
    const brandName = resolveBrand(profile.user_agent);

    const injectionSource = buildInjectionScript({
      width,
      height,
      langCode,
      platformName,
      brandName,
      webglVendor: webgl.vendor,
      webglRenderer: webgl.renderer,
      canvasNoise: profile.canvas_noise || 'disabled',
      audioNoise: profile.audio_noise || 'disabled',
    });

    const client = await page.target().createCDPSession();
    await client.send('Page.addScriptToEvaluateOnNewDocument', { source: injectionSource });

    try {
      const currentUrl = page.url();
      if (!currentUrl || currentUrl === 'chrome://newtab/' || currentUrl.startsWith('chrome-search://')) {
        await page.goto('about:blank', { waitUntil: 'domcontentloaded', timeout: 5000 });
      }
    } catch (e) {
      console.warn('[DesktopBrowserManager] Failed to force about:blank:', e.message);
    }

    return { status: 'launched', profileId: profile.id };
  }

  async close(profileId) {
    const browser = this._browsers.get(profileId);
    if (browser) {
      try {
        await browser.close();
      } catch (e) {
        console.warn(`[DesktopBrowserManager] Error closing browser ${profileId}:`, e.message);
      }
      this._browsers.delete(profileId);
    }
  }

  getActiveProfileIds() {
    return Array.from(this._browsers.keys());
  }

  async closeAll() {
    const ids = Array.from(this._browsers.keys());
    await Promise.all(ids.map((id) => this.close(id)));
  }

  _loadExtensions(args) {
    const extensionsDir = path.join(__dirname, '..', '..', 'extensions');
    if (!fs.existsSync(extensionsDir)) return;

    const extFolders = fs.readdirSync(extensionsDir)
      .map((folder) => path.join(extensionsDir, folder))
      .filter((p) => fs.statSync(p).isDirectory() && fs.existsSync(path.join(p, 'manifest.json')));

    if (extFolders.length > 0) {
      const pathsString = extFolders.join(',');
      args.push(`--disable-extensions-except=${pathsString}`);
      args.push(`--load-extension=${pathsString}`);
    }
  }

  async _emulateTimezone(page, profile) {
    let timezone = profile.timezone;
    if (!timezone || timezone === 'auto') {
      timezone = 'Asia/Jakarta';
    }

    try {
      await page.emulateTimezone(timezone);
    } catch (e) {
      console.warn('[DesktopBrowserManager] Failed to emulate timezone:', e.message);
    }
  }

  async _emulateViewport(page, profile) {
    if (config.puppeteer.headless) {
      const { width, height } = this._parseResolution(profile.screen_resolution);
      await page.setViewport({ width, height });
    }
  }

  async _emulateGeolocation(browser, page, profile) {
    if (profile.latitude == null || profile.longitude == null) return;

    const lat = parseFloat(profile.latitude);
    const lon = parseFloat(profile.longitude);
    if (isNaN(lat) || isNaN(lon)) return;

    try {
      await page.setGeolocation({ latitude: lat, longitude: lon, accuracy: 100 });
      console.log(`[DesktopBrowserManager] Geolocation set to: ${lat}, ${lon}`);
    } catch (e) {
      console.warn('[DesktopBrowserManager] Failed to set geolocation:', e.message);
    }
  }

  _parseResolution(resolution) {
    let width = 1920;
    let height = 1080;
    if (resolution) {
      const parts = resolution.split('x');
      if (parts.length === 2) {
        width = parseInt(parts[0], 10) || 1920;
        height = parseInt(parts[1], 10) || 1080;
      }
    }
    return { width, height };
  }
}

module.exports = DesktopBrowserManager;
