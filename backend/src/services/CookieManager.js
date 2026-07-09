const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const path = require('path');
const os = require('os');
const ICookieManager = require('../contracts/ICookieManager');
const config = require('../config');
const { ConflictError } = require('../errors');

puppeteer.use(StealthPlugin());

class CookieManager extends ICookieManager {
  constructor(browserManager) {
    super();
    this._browserManager = browserManager;
  }

  _assertNotRunning(profileId) {
    if (this._browserManager && this._browserManager.isRunning(profileId)) {
      throw new ConflictError(
        'Profile browser is currently running. Close it before reading/writing cookies.'
      );
    }
  }

  async _launchHeadless(userDataDir) {
    return puppeteer.launch({
      headless: true,
      userDataDir,
      args: [
        config.puppeteer.sandbox ? '' : '--no-sandbox',
        config.puppeteer.sandbox ? '' : '--disable-setuid-sandbox',
      ].filter(Boolean),
    });
  }

  async getCookies(profile) {
    this._assertNotRunning(profile.id);
    const userDataDir = path.join(config.puppeteer.userDataDirBase, profile.id);
    const browser = await this._launchHeadless(userDataDir);
    try {
      const page = await browser.newPage();
      const client = await page.target().createCDPSession();
      const { cookies } = await client.send('Network.getAllCookies');
      return cookies;
    } finally {
      await browser.close();
    }
  }

  async setCookies(profile, cookies) {
    this._assertNotRunning(profile.id);
    const userDataDir = path.join(config.puppeteer.userDataDirBase, profile.id);
    const browser = await this._launchHeadless(userDataDir);
    try {
      const page = await browser.newPage();
      const client = await page.target().createCDPSession();
      await client.send('Network.clearBrowserCookies');

      if (cookies && cookies.length > 0) {
        const formatted = cookies.map((c) => {
          let expiryVal;
          if (c.expirationDate) {
            expiryVal = Math.round(c.expirationDate);
          } else if (typeof c.expiry === 'number') {
            expiryVal = Math.round(c.expiry);
          } else if (typeof c.expires === 'number') {
            expiryVal = Math.round(c.expires);
          }
          return {
            name: c.name || '',
            value: c.value || '',
            domain: c.domain || '',
            path: c.path || '/',
            secure: typeof c.secure === 'boolean' ? c.secure : c.secure === 'true',
            httpOnly: typeof c.httpOnly === 'boolean' ? c.httpOnly : c.httpOnly === 'true',
            sameSite: c.sameSite || undefined,
            expires: expiryVal,
          };
        });
        await client.send('Network.setCookies', { cookies: formatted });
      }
    } finally {
      await browser.close();
    }
  }
}

module.exports = CookieManager;
