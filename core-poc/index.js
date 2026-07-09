const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function run() {
  const proxyHost = process.env.PROXY_HOST || '127.0.0.1';
  const proxyPort = process.env.PROXY_PORT || '8080';
  const proxyUser = process.env.PROXY_USER || '';
  const proxyPass = process.env.PROXY_PASS || '';
  const useProxy = process.env.PROXY_ENABLED === 'true' || false;
  const headless = process.env.HEADLESS === 'true' || false;

  const customUserAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

  const launchArgs = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-infobars',
    '--window-position=0,0',
    '--ignore-certificate-errors',
    '--ignore-certificate-errors-spki-list',
  ];

  if (useProxy) {
    launchArgs.push(`--proxy-server=${proxyHost}:${proxyPort}`);
  }

  console.log('Launching Chromium with Stealth Plugin...');

  let browser;
  try {
    browser = await puppeteer.launch({
      headless,
      args: launchArgs,
    });

    const page = await browser.newPage();

    if (useProxy && proxyUser && proxyPass) {
      await page.authenticate({ username: proxyUser, password: proxyPass });
    }

    await page.setUserAgent(customUserAgent);

    const client = await page.target().createCDPSession();
    await client.send('Page.addScriptToEvaluateOnNewDocument', {
      source: `
        Object.defineProperty(navigator, 'hardwareConcurrency', {
          get: () => 8,
        });
        Object.defineProperty(navigator, 'deviceMemory', {
          get: () => 16,
        });
      `,
    });

    console.log('Opening detection test page (Sannysoft Bot Test)...');
    await page.goto('https://bot.sannysoft.com/', { waitUntil: 'networkidle2' });

    await page.screenshot({ path: 'stealth-test-result.png', fullPage: true });
    console.log('Screenshot saved to stealth-test-result.png');

    console.log('Browser will remain open for 30 seconds for inspection.');
    await new Promise((r) => setTimeout(r, 30000));
  } catch (err) {
    console.error('POC run failed:', err.message || err);
  } finally {
    if (browser) {
      await browser.close();
      console.log('Browser closed.');
    }
  }

  console.log('Done.');
}

run().catch(console.error);
