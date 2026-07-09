const { langMap } = require('../config');

function resolveLanguageCode(country) {
  if (!country) return 'en-US';
  const upper = country.toUpperCase();
  for (const [key, code] of Object.entries(langMap)) {
    if (upper.includes(key)) return code;
  }
  return 'en-US';
}

function resolveWebGL(vendor) {
  if (!vendor) {
    return {
      vendor: 'Google Inc. (NVIDIA)',
      renderer: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 Direct3D11 vs_5_0 ps_5_0, D3D11)',
    };
  }
  const v = vendor.toLowerCase();
  if (v.includes('amd')) {
    return {
      vendor: 'Google Inc. (ATI Technologies Inc.)',
      renderer: 'ANGLE (AMD, AMD Radeon(TM) Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)',
    };
  }
  if (v.includes('intel')) {
    return {
      vendor: 'Google Inc. (Intel)',
      renderer: 'ANGLE (Intel, Intel(R) Iris(R) Xe Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)',
    };
  }
  if (v.includes('apple') || v.includes('m1') || v.includes('m2') || v.includes('m3')) {
    return { vendor: 'Apple Inc.', renderer: 'Apple M2' };
  }
  if (v.includes('nvidia')) {
    return {
      vendor: 'Google Inc. (NVIDIA)',
      renderer: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 Direct3D11 vs_5_0 ps_5_0, D3D11)',
    };
  }
  return {
    vendor,
    renderer: vendor.includes('(') ? vendor : `ANGLE (${vendor})`,
  };
}

function resolvePlatform(ua) {
  if (!ua) return 'Windows';
  if (ua.includes('Macintosh') || ua.includes('Mac OS X')) return 'macOS';
  if (ua.includes('Linux')) return 'Linux';
  return 'Windows';
}

function resolveBrand(ua) {
  if (!ua) return 'Google Chrome';
  if (ua.includes('Edg/')) return 'Microsoft Edge';
  return 'Google Chrome';
}

function buildInjectionScript({
  width = 1920,
  height = 1080,
  langCode = 'en-US',
  platformName = 'Windows',
  brandName = 'Google Chrome',
  webglVendor = 'Google Inc. (NVIDIA)',
  webglRenderer = 'ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 Direct3D11 vs_5_0 ps_5_0, D3D11)',
  canvasNoise = 'disabled',
  audioNoise = 'disabled',
} = {}) {
  const e = (v) => JSON.stringify(v);

  return [
    `Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 8 });`,
    `Object.defineProperty(navigator, 'deviceMemory', { get: () => 8 });`,
    ``,
    `Object.defineProperty(screen, 'width', { get: () => ${width} });`,
    `Object.defineProperty(screen, 'height', { get: () => ${height} });`,
    `Object.defineProperty(screen, 'availWidth', { get: () => ${width} });`,
    `Object.defineProperty(screen, 'availHeight', { get: () => ${height} });`,
    ``,
    `Object.defineProperty(navigator, 'language', { get: () => ${e(langCode)} });`,
    `Object.defineProperty(navigator, 'languages', { get: () => [${e(langCode)}, ${e(langCode.split('-')[0])}] });`,
    ``,
    `if (window.navigator.userAgentData) {`,
    `  Object.defineProperty(navigator, 'userAgentData', {`,
    `    get: () => ({`,
    `      brands: [`,
    `        { brand: ${e(brandName)}, version: '120' },`,
    `        { brand: 'Not A(Brand', version: '99' },`,
    `        { brand: 'Chromium', version: '120' }`,
    `      ],`,
    `      mobile: false,`,
    `      platform: ${e(platformName)},`,
    `      getHighEntropyValues: (hints) => Promise.resolve({`,
    `        platform: ${e(platformName)},`,
    `        platformVersion: '10.0.0',`,
    `        architecture: 'x86',`,
    `        model: '',`,
    `        uaFullVersion: '120.0.0.0'`,
    `      })`,
    `    })`,
    `  });`,
    `}`,
    ``,
    `const winFonts = ${JSON.stringify([
      'Arial', 'Arial Black', 'Calibri', 'Cambria', 'Comic Sans MS', 'Consolas',
      'Courier New', 'Georgia', 'Impact', 'Lucida Console', 'Lucida Sans Unicode',
      'Microsoft Sans Serif', 'Segoe UI', 'Tahoma', 'Times New Roman', 'Trebuchet MS', 'Verdana',
    ])};`,
    `const macFonts = ${JSON.stringify([
      'Arial', 'Arial Black', 'Brush Script MT', 'Courier New', 'Georgia', 'Geneva',
      'Helvetica', 'Helvetica Neue', 'Impact', 'Lucida Grande', 'Monaco', 'Optima',
      'Palatino', 'Times New Roman', 'Trebuchet MS', 'Verdana',
    ])};`,
    `const linuxFonts = ${JSON.stringify([
      'Liberation Sans', 'Liberation Serif', 'Liberation Mono', 'DejaVu Sans',
      'DejaVu Serif', 'DejaVu Sans Mono', 'Ubuntu', 'FreeSans', 'FreeSerif', 'FreeMono',
    ])};`,
    ``,
    `const targetOS = ${e(platformName)};`,
    `let allowedFonts = [];`,
    `let blockedFonts = [];`,
    ``,
    `if (targetOS === 'Windows') {`,
    `  allowedFonts = winFonts; blockedFonts = linuxFonts;`,
    `} else if (targetOS === 'macOS') {`,
    `  allowedFonts = macFonts; blockedFonts = linuxFonts;`,
    `} else {`,
    `  allowedFonts = linuxFonts; blockedFonts = [];`,
    `}`,
    ``,
    `if (window.FontFaceSet) {`,
    `  const originalCheck = FontFaceSet.prototype.check;`,
    `  FontFaceSet.prototype.check = function(font, text) {`,
    `    const fontName = font.replace(/[\\d\\.]+(px|em|rem|pt)\\s+/, '').replace(/['"]/g, '').split(',')[0].trim();`,
    `    if (blockedFonts.some(f => fontName.toLowerCase().includes(f.toLowerCase()))) return false;`,
    `    if (allowedFonts.some(f => fontName.toLowerCase().includes(f.toLowerCase()))) return true;`,
    `    return originalCheck.apply(this, arguments);`,
    `  };`,
    `}`,
    ``,
    `if (window.CanvasRenderingContext2D) {`,
    `  const originalMeasureText = CanvasRenderingContext2D.prototype.measureText;`,
    `  CanvasRenderingContext2D.prototype.measureText = function(text) {`,
    `    const fontStr = this.font || '';`,
    `    const matches = fontStr.match(/(?:^|\\s|['"])([^,[\\s'"]+)(?:['"]|,|$)/);`,
    `    let primaryFont = matches ? matches[1].trim() : '';`,
    `    primaryFont = primaryFont.replace(/^(normal|italic|oblique|bold|bolder|lighter|\\d+|[\\d\\.]+(px|em|rem|pt|%))\\s+/, '').trim();`,
    `    if (primaryFont) {`,
    `      if (blockedFonts.some(f => primaryFont.toLowerCase() === f.toLowerCase())) {`,
    `        const originalFont = this.font;`,
    `        this.font = fontStr.replace(primaryFont, 'sans-serif');`,
    `        const res = originalMeasureText.apply(this, arguments);`,
    `        this.font = originalFont;`,
    `        return res;`,
    `      }`,
    `      if (allowedFonts.some(f => primaryFont.toLowerCase() === f.toLowerCase())) {`,
    `        const res = originalMeasureText.apply(this, arguments);`,
    `        const originalFont = this.font;`,
    `        this.font = fontStr.replace(primaryFont, 'monospace');`,
    `        const monoMetrics = originalMeasureText.apply(this, arguments);`,
    `        this.font = originalFont;`,
    `        if (res.width === monoMetrics.width) {`,
    `          let hash = 0;`,
    `          for (let i = 0; i < text.length; i++) {`,
    `            hash = text.charCodeAt(i) + ((hash << 5) - hash);`,
    `          }`,
    `          const offset = (Math.abs(hash) % 5) + 1;`,
    `          return new Proxy(res, {`,
    `            get(target, prop) {`,
    `              if (prop === 'width') return target.width + offset;`,
    `              return target[prop];`,
    `            }`,
    `          });`,
    `        }`,
    `      }`,
    `    }`,
    `    return originalMeasureText.apply(this, arguments);`,
    `  };`,
    `}`,
    ``,
    `if (window.WebGLRenderingContext) {`,
    `  const getParameter = WebGLRenderingContext.prototype.getParameter;`,
    `  WebGLRenderingContext.prototype.getParameter = function(parameter) {`,
    `    if (parameter === 35660) return ${e(webglVendor)};`,
    `    if (parameter === 35661) return ${e(webglRenderer)};`,
    `    return getParameter.apply(this, arguments);`,
    `  };`,
    `}`,
    `if (window.WebGL2RenderingContext) {`,
    `  const getParameter2 = WebGL2RenderingContext.prototype.getParameter;`,
    `  WebGL2RenderingContext.prototype.getParameter = function(parameter) {`,
    `    if (parameter === 35660) return ${e(webglVendor)};`,
    `    if (parameter === 35661) return ${e(webglRenderer)};`,
    `    return getParameter2.apply(this, arguments);`,
    `  };`,
    `}`,
    ``,
    `if (${canvasNoise === 'enabled'} && window.CanvasRenderingContext2D) {`,
    `  const originalGetImageData = CanvasRenderingContext2D.prototype.getImageData;`,
    `  CanvasRenderingContext2D.prototype.getImageData = function() {`,
    `    const res = originalGetImageData.apply(this, arguments);`,
    `    if (res.data && res.data.length > 4) {`,
    `      res.data[res.data.length - 2] = res.data[res.data.length - 2] ^ 1;`,
    `      res.data[res.data.length - 3] = res.data[res.data.length - 3] ^ 1;`,
    `    }`,
    `    return res;`,
    `  };`,
    `}`,
    ``,
    `if (${audioNoise === 'enabled'} && window.AudioBuffer) {`,
    `  const originalGetChannelData = AudioBuffer.prototype.getChannelData;`,
    `  AudioBuffer.prototype.getChannelData = function() {`,
    `    const channelData = originalGetChannelData.apply(this, arguments);`,
    `    if (channelData && channelData.length > 10) {`,
    `      channelData[0] += 0.0000001;`,
    `      channelData[channelData.length - 1] -= 0.0000001;`,
    `    }`,
    `    return channelData;`,
    `  };`,
    `}`,
  ].join('\n');
}

module.exports = {
  resolveLanguageCode,
  resolveWebGL,
  resolvePlatform,
  resolveBrand,
  buildInjectionScript,
};
