const path = require('path');

const config = {
  port: parseInt(process.env.PORT, 10) || 4000,

  cors: {
    origins: true,
  },

  database: {
    path: process.env.DB_PATH || path.resolve(__dirname, '..', 'database', 'profiles.sqlite'),
  },

  puppeteer: {
    userDataDirBase: path.join(require('os').homedir(), '.multibrowser', 'profiles'),
    headless: process.env.HEADLESS === 'true' || false,
    sandbox: false,
  },

  proxy: {
    freeProxyUrl: 'https://api.proxyscrape.com/v2/?request=displayproxies&protocol=http&timeout=3500&country=all&ssl=all&anonymity=anonymous',
    tunnelTimeout: 2000,
    maxCandidates: 25,
  },

  geolocation: {
    apiUrl: 'http://ip-api.com/json',
    timeout: 2500,
  },

  langMap: {
    'INDONESIA': 'id-ID',
    'SINGAPORE': 'en-SG',
    'UNITED STATES': 'en-US',
    'UNITED KINGDOM': 'en-GB',
    'GERMANY': 'de-DE',
    'FRANCE': 'fr-FR',
    'JAPAN': 'ja-JP',
    'TAIWAN': 'zh-TW',
    'CHINA': 'zh-CN',
    'INDIA': 'en-IN',
    'SOUTH KOREA': 'ko-KR',
    'RUSSIA': 'ru-RU',
    'BRAZIL': 'pt-BR',
    'MEXICO': 'es-MX',
    'SPAIN': 'es-ES',
    'ITALY': 'it-IT',
    'NETHERLANDS': 'nl-NL',
    'TURKEY': 'tr-TR',
    'POLAND': 'pl-PL',
    'THAILAND': 'th-TH',
    'VIETNAM': 'vi-VN',
    'PHILIPPINES': 'en-PH',
    'AUSTRALIA': 'en-AU',
    'CANADA': 'en-CA',
  },
};

module.exports = config;
