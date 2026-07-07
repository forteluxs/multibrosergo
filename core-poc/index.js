const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function run() {
  const proxyHost = '127.0.0.1'; // Ganti dengan IP Proxy Anda
  const proxyPort = '8080';
  const proxyUser = 'username';
  const proxyPass = 'password';
  const useProxy = false; // Set ke true jika Anda ingin menguji dengan proxy aktif
  
  // Custom Fingerprint Parameters (Contoh)
  const customUserAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

  let launchArgs = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-infobars',
    '--window-position=0,0',
    '--ignore-certifcate-errors',
    '--ignore-certifcate-errors-spki-list',
  ];

  if (useProxy) {
    launchArgs.push(`--proxy-server=${proxyHost}:${proxyPort}`);
  }

  console.log('Menjalankan Chromium dengan Stealth Plugin...');

  const browser = await puppeteer.launch({
    headless: false, // Set ke false agar kita bisa melihat UI browser
    args: launchArgs,
  });

  const page = await browser.newPage();

  // Autentikasi Proxy jika diperlukan
  if (useProxy && proxyUser && proxyPass) {
    await page.authenticate({
      username: proxyUser,
      password: proxyPass,
    });
  }

  // Mengubah User Agent
  await page.setUserAgent(customUserAgent);

  // Manipulasi ekstra via CDP (Contoh: Timpa hardware concurrency)
  const client = await page.target().createCDPSession();
  await client.send('Page.addScriptToEvaluateOnNewDocument', {
    source: `
      Object.defineProperty(navigator, 'hardwareConcurrency', {
        get: () => 8, // Mengatur jumlah core CPU ke 8
      });
      Object.defineProperty(navigator, 'deviceMemory', {
        get: () => 16, // Mengatur jumlah RAM ke 16GB
      });
    `
  });

  console.log('Membuka halaman tes deteksi (Sannysoft Bot Test)...');
  await page.goto('https://bot.sannysoft.com/', { waitUntil: 'networkidle2' });
  
  // Tunggu agar pengguna bisa melihat hasilnya, atau simpan screenshot
  await page.screenshot({ path: 'stealth-test-result.png', fullPage: true });
  console.log('Screenshot hasil deteksi telah disimpan di stealth-test-result.png');

  console.log('Browser akan tetap terbuka selama 30 detik untuk Anda tinjau.');
  await new Promise(r => setTimeout(r, 30000));

  await browser.close();
  console.log('Selesai.');
}

run().catch(console.error);
