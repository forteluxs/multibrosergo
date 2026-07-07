const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const path = require('path');
const os = require('os');

puppeteer.use(StealthPlugin());

/**
 * BrowserService
 * Encapsulates the logic of launching and managing Chromium instances.
 * Single Responsibility: Only deals with Puppeteer.
 */
class BrowserService {
  async launchProfile(profile) {
    console.log(`Launching profile: ${profile.name} (${profile.id})`);

    const userDataDir = path.join(os.homedir(), '.multibrowser', 'profiles', profile.id);
    let launchArgs = [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-infobars',
      '--ignore-certificate-errors',
      '--ignore-certificate-errors-spki-list',
    ];

    // WebRTC Leak Protection
    if (profile.webrtc_mode === 'blocked') {
      launchArgs.push('--disable-webrtc');
      launchArgs.push('--disable-peer-connection');
    }

    // Resolve Language Code from Geolocation Country
    let langCode = 'en-US';
    if (profile.country) {
      const countryUpper = profile.country.toUpperCase();
      const langMap = {
        'INDONESIA': 'id-ID',
        'SINGAPORE': 'en-SG',
        'UNITED STATES': 'en-US',
        'UNITED KINGDOM': 'en-GB',
        'GERMANY': 'de-DE',
        'FRANCE': 'fr-FR',
        'JAPAN': 'ja-JP',
        'TAIWAN': 'zh-TW',
        'CHINA': 'zh-CN',
        'INDIA': 'en-IN'
      };
      for (const [cName, code] of Object.entries(langMap)) {
        if (countryUpper.includes(cName)) {
          langCode = code;
          break;
        }
      }
    }
    launchArgs.push(`--lang=${langCode}`);

    // Auto-load any unpacked extensions in backend/extensions directory
    const fs = require('fs');
    const extensionsDir = path.join(__dirname, '..', '..', 'extensions');
    let hasExtensions = false;
    if (fs.existsSync(extensionsDir)) {
      const extFolders = fs.readdirSync(extensionsDir)
        .map(folder => path.join(extensionsDir, folder))
        .filter(p => fs.statSync(p).isDirectory() && fs.existsSync(path.join(p, 'manifest.json')));
      
      if (extFolders.length > 0) {
        hasExtensions = true;
        const pathsString = extFolders.join(',');
        launchArgs.push(`--disable-extensions-except=${pathsString}`);
        launchArgs.push(`--load-extension=${pathsString}`);
      }
    }

    if (profile.proxy_host && profile.proxy_port) {
      launchArgs.push(`--proxy-server=${profile.proxy_host}:${profile.proxy_port}`);
    }

    const browser = await puppeteer.launch({
      headless: false,
      userDataDir: userDataDir,
      args: launchArgs,
    });

    const pages = await browser.pages();
    const page = pages.length > 0 ? pages[0] : await browser.newPage();

    if (profile.proxy_user && profile.proxy_pass) {
      await page.authenticate({ username: profile.proxy_user, password: profile.proxy_pass });
    }

    if (profile.user_agent) {
      await page.setUserAgent(profile.user_agent);
    }

    // Resolve Timezone (Sync with Proxy if 'auto')
    let timezone = profile.timezone;
    if (timezone === 'auto' || !timezone) {
      try {
        const response = await page.evaluate(async () => {
          try {
            const res = await fetch('http://ip-api.com/json');
            return await res.json();
          } catch (e) {
            return null;
          }
        });
        if (response && response.timezone) {
          timezone = response.timezone;
          console.log(`Auto-detected timezone from proxy: ${timezone}`);
        } else {
          timezone = 'UTC';
        }
      } catch (e) {
        console.error('Failed to auto-detect timezone:', e.message);
        timezone = 'UTC';
      }
    }

    if (timezone) {
      try {
        await page.emulateTimezone(timezone);
      } catch (e) {
        console.error(`Failed to emulate timezone: ${e.message}`);
      }
    }

    // Resolve Screen Resolution
    let width = 1920;
    let height = 1080;
    if (profile.screen_resolution) {
      const parts = profile.screen_resolution.split('x');
      if (parts.length === 2) {
        width = parseInt(parts[0], 10) || 1920;
        height = parseInt(parts[1], 10) || 1080;
      }
    }
    await page.setViewport({ width, height });

    // Emulate Geolocation Coordinates
    if (profile.latitude && profile.longitude) {
      try {
        const context = browser.defaultBrowserContext();
        // Override permissions dynamically to allow geolocation APIs
        await context.overridePermissions('https://www.google.com', ['geolocation']);
        await context.overridePermissions('https://browserleaks.com', ['geolocation']);
        await context.overridePermissions('https://whoer.net', ['geolocation']);
        await context.overridePermissions('https://iplocation.net', ['geolocation']);
        await context.overridePermissions('https://ip-api.com', ['geolocation']);
        
        await page.setGeolocation({
          latitude: parseFloat(profile.latitude),
          longitude: parseFloat(profile.longitude),
          accuracy: 100
        });
        console.log(`[Geolocation Emulator] Enabled coordinates: ${profile.latitude}, ${profile.longitude}`);
      } catch (e) {
        console.warn('[Geolocation Emulator] Failed to override permissions or set coordinates:', e.message);
      }
    }

    // Map WebGL Vendor & Renderer
    let webglVendor = 'Google Inc. (NVIDIA)';
    let webglRenderer = 'ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 Direct3D11 vs_5_0 ps_5_0, D3D11)';

    if (profile.webgl_vendor) {
      const val = profile.webgl_vendor.toLowerCase();
      if (val.includes('amd')) {
        webglVendor = 'Google Inc. (ATI Technologies Inc.)';
        webglRenderer = 'ANGLE (AMD, AMD Radeon(TM) Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)';
      } else if (val.includes('intel')) {
        webglVendor = 'Google Inc. (Intel)';
        webglRenderer = 'ANGLE (Intel, Intel(R) Iris(R) Xe Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)';
      } else if (val.includes('apple') || val.includes('m1') || val.includes('m2') || val.includes('m3')) {
        webglVendor = 'Apple Inc.';
        webglRenderer = 'Apple M2';
      } else if (val.includes('nvidia')) {
        webglVendor = 'Google Inc. (NVIDIA)';
        webglRenderer = 'ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 Direct3D11 vs_5_0 ps_5_0, D3D11)';
      } else {
        webglVendor = profile.webgl_vendor;
        webglRenderer = profile.webgl_vendor.includes('(') ? profile.webgl_vendor : `ANGLE (${profile.webgl_vendor})`;
      }
    }

    // Parse OS for Client Hints
    let platformName = 'Windows';
    const ua = profile.user_agent || '';
    if (ua.includes('Macintosh') || ua.includes('Mac OS X')) {
      platformName = 'macOS';
    } else if (ua.includes('Linux')) {
      platformName = 'Linux';
    }
    let brandName = 'Google Chrome';
    if (ua.includes('Edg/')) {
      brandName = 'Microsoft Edge';
    }

    // CDP for deeper fingerprinting
    const client = await page.target().createCDPSession();
    await client.send('Page.addScriptToEvaluateOnNewDocument', {
      source: `
        // Spoof Hardware Specs
        Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 8 });
        Object.defineProperty(navigator, 'deviceMemory', { get: () => 8 });

        // Spoof Screen Resolution
        Object.defineProperty(screen, 'width', { get: () => ${width} });
        Object.defineProperty(screen, 'height', { get: () => ${height} });
        Object.defineProperty(screen, 'availWidth', { get: () => ${width} });
        Object.defineProperty(screen, 'availHeight', { get: () => ${height} });

        // Spoof Language
        Object.defineProperty(navigator, 'language', { get: () => "${langCode}" });
        Object.defineProperty(navigator, 'languages', { get: () => ["${langCode}", "${langCode.split('-')[0]}"] });

        // Spoof User-Agent Client Hints
        if (window.navigator.userAgentData) {
          const platform = "${platformName}";
          const brandName = "${brandName}";
          Object.defineProperty(navigator, 'userAgentData', {
            get: () => ({
              brands: [
                { brand: brandName, version: '120' },
                { brand: 'Not A(Brand', version: '99' },
                { brand: 'Chromium', version: '120' }
              ],
              mobile: false,
              platform: platform,
              getHighEntropyValues: (hints) => Promise.resolve({
                platform: platform,
                platformVersion: '10.0.0',
                architecture: 'x86',
                model: '',
                uaFullVersion: '120.0.0.0'
              })
            })
          });
        }

        // Spoof System Fonts (Font Fingerprinting Protection)
        const winFonts = ['Arial', 'Arial Black', 'Calibri', 'Cambria', 'Comic Sans MS', 'Consolas', 'Courier New', 'Georgia', 'Impact', 'Lucida Console', 'Lucida Sans Unicode', 'Microsoft Sans Serif', 'Segoe UI', 'Tahoma', 'Times New Roman', 'Trebuchet MS', 'Verdana'];
        const macFonts = ['Arial', 'Arial Black', 'Brush Script MT', 'Courier New', 'Georgia', 'Geneva', 'Helvetica', 'Helvetica Neue', 'Impact', 'Lucida Grande', 'Monaco', 'Optima', 'Palatino', 'Times New Roman', 'Trebuchet MS', 'Verdana'];
        const linuxFonts = ['Liberation Sans', 'Liberation Serif', 'Liberation Mono', 'DejaVu Sans', 'DejaVu Serif', 'DejaVu Sans Mono', 'Ubuntu', 'FreeSans', 'FreeSerif', 'FreeMono'];

        const targetOS = "${platformName}";
        let allowedFonts = [];
        let blockedFonts = [];

        if (targetOS === 'Windows') {
          allowedFonts = winFonts;
          blockedFonts = linuxFonts;
        } else if (targetOS === 'macOS') {
          allowedFonts = macFonts;
          blockedFonts = linuxFonts;
        } else {
          allowedFonts = linuxFonts;
          blockedFonts = [];
        }

        if (window.FontFaceSet) {
          const originalCheck = FontFaceSet.prototype.check;
          FontFaceSet.prototype.check = function(font, text) {
            const fontName = font.replace(/[\\d\\.]+(px|em|rem|pt)\\s+/, '').replace(/['"]/g, '').split(',')[0].trim();
            if (blockedFonts.some(f => fontName.toLowerCase().includes(f.toLowerCase()))) {
              return false;
            }
            if (allowedFonts.some(f => fontName.toLowerCase().includes(f.toLowerCase()))) {
              return true;
            }
            return originalCheck.apply(this, arguments);
          };
        }

        if (window.CanvasRenderingContext2D) {
          const originalMeasureText = CanvasRenderingContext2D.prototype.measureText;
          CanvasRenderingContext2D.prototype.measureText = function(text) {
            const fontStr = this.font || '';
            const matches = fontStr.match(/(?:^|\\s|['"])([^,[\\s'"]+)(?:['"]|,|$)/);
            let primaryFont = matches ? matches[1].trim() : '';
            primaryFont = primaryFont.replace(/^(normal|italic|oblique|bold|bolder|lighter|\\d+|[\\d\\.]+(px|em|rem|pt|%))\\s+/, '').trim();

            if (primaryFont) {
              if (blockedFonts.some(f => primaryFont.toLowerCase() === f.toLowerCase())) {
                const originalFont = this.font;
                this.font = fontStr.replace(primaryFont, 'sans-serif');
                const res = originalMeasureText.apply(this, arguments);
                this.font = originalFont;
                return res;
              }
              
              if (allowedFonts.some(f => primaryFont.toLowerCase() === f.toLowerCase())) {
                const res = originalMeasureText.apply(this, arguments);
                const originalFont = this.font;
                this.font = fontStr.replace(primaryFont, 'monospace');
                const monoMetrics = originalMeasureText.apply(this, arguments);
                this.font = originalFont;

                if (res.width === monoMetrics.width) {
                  let hash = 0;
                  for (let i = 0; i < text.length; i++) {
                    hash = text.charCodeAt(i) + ((hash << 5) - hash);
                  }
                  const offset = (Math.abs(hash) % 5) + 1;
                  return new Proxy(res, {
                    get(target, prop) {
                      if (prop === 'width') {
                        return target.width + offset;
                      }
                      return target[prop];
                    }
                  });
                }
              }
            }
            return originalMeasureText.apply(this, arguments);
          };
        }

        // Spoof WebGL Vendor & Renderer
        if (window.WebGLRenderingContext) {
          const getParameter = WebGLRenderingContext.prototype.getParameter;
          WebGLRenderingContext.prototype.getParameter = function(parameter) {
            if (parameter === 35660) return "${webglVendor}"; // UNMASKED_VENDOR_WEBGL
            if (parameter === 35661) return "${webglRenderer}"; // UNMASKED_RENDERER_WEBGL
            return getParameter.apply(this, arguments);
          };
        }
        if (window.WebGL2RenderingContext) {
          const getParameter2 = WebGL2RenderingContext.prototype.getParameter;
          WebGL2RenderingContext.prototype.getParameter = function(parameter) {
            if (parameter === 35660) return "${webglVendor}";
            if (parameter === 35661) return "${webglRenderer}";
            return getParameter2.apply(this, arguments);
          };
        }

        // Spoof Canvas (Add subtle noise)
        if (${profile.canvas_noise === 'enabled'} && window.CanvasRenderingContext2D) {
          const originalGetImageData = CanvasRenderingContext2D.prototype.getImageData;
          CanvasRenderingContext2D.prototype.getImageData = function() {
            const res = originalGetImageData.apply(this, arguments);
            if (res.data && res.data.length > 4) {
              res.data[res.data.length - 2] = res.data[res.data.length - 2] ^ 1;
              res.data[res.data.length - 3] = res.data[res.data.length - 3] ^ 1;
            }
            return res;
          };
        }

        // Spoof Audio Context (Add subtle noise)
        if (${profile.audio_noise === 'enabled'} && window.AudioBuffer) {
          const originalGetChannelData = AudioBuffer.prototype.getChannelData;
          AudioBuffer.prototype.getChannelData = function() {
            const channelData = originalGetChannelData.apply(this, arguments);
            if (channelData && channelData.length > 10) {
              channelData[0] += 0.0000001;
              channelData[channelData.length - 1] -= 0.0000001;
            }
            return channelData;
          };
        }
      `
    });

    return { status: 'launched', profileId: profile.id };
  }

  async getCookies(profile) {
    const userDataDir = path.join(os.homedir(), '.multibrowser', 'profiles', profile.id);
    const browser = await puppeteer.launch({
      headless: true,
      userDataDir: userDataDir,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    try {
      const page = await browser.newPage();
      const client = await page.target().createCDPSession();
      // CDP Network.getAllCookies returns cookies across ALL domains in this profile
      const { cookies } = await client.send('Network.getAllCookies');
      return cookies;
    } finally {
      await browser.close();
    }
  }

  async setCookies(profile, cookies) {
    const userDataDir = path.join(os.homedir(), '.multibrowser', 'profiles', profile.id);
    const browser = await puppeteer.launch({
      headless: true,
      userDataDir: userDataDir,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    try {
      const page = await browser.newPage();
      const client = await page.target().createCDPSession();
      // Clear existing cookies to avoid duplicates or session conflicts
      await client.send('Network.clearBrowserCookies');
      
      if (cookies && cookies.length > 0) {
        // Map any cookie fields that might have different names from external exporters
        const formattedCookies = cookies.map(c => {
          // If expires field is present but is not a valid timestamp, make it undefined
          let expiryVal = undefined;
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
            secure: typeof c.secure === 'boolean' ? c.secure : (c.secure === 'true'),
            httpOnly: typeof c.httpOnly === 'boolean' ? c.httpOnly : (c.httpOnly === 'true'),
            sameSite: c.sameSite || undefined,
            expires: expiryVal
          };
        });
        
        await client.send('Network.setCookies', { cookies: formattedCookies });
      }
    } finally {
      await browser.close();
    }
  }
}

module.exports = BrowserService;
