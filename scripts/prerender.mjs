import { createServer } from 'node:http';
import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const distDir = join(__dirname, '..', 'dist');

const ROUTES = [
  '/',
  '/butceleme',
  '/web-sitesi',
  '/otomasyon',
  '/uctan-uca-yazilim',
  '/hakkimizda',
  '/iletisim',
  '/blog',
  '/blog/eticaret-muhasebe-yazilimi-reklam-takip-fark',
  '/blog/trendyol-reklam-net-kar-komisyon-kargo-hesaplama',
  '/blog/roas-net-kar-marji-fark-eticaret',
  '/blog/eticaret-reklam-butcesi-sizinti-noktalari',
  '/blog/meta-google-trendyol-reklam-karsilastirma',
  '/blog/reklam-takip-yazilimi-secim-rehberi-turkiye',
  '/blog/basabas-analizi-nedir-eticaret',
  '/blog/excel-eticaret-muhasebe-hatalari',
  '/blog/butcecrm-nedir-eticaret-reklam-muhasebe',
  '/blog/butcecrm-ilk-30-gun-kurulum-rehberi',
  '/blog/trendyol-sku-bazli-karlilik-analizi',
  '/kar-hesaplayici',
  '/hepsiburada-kar-hesaplayici',
];

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
};

function readFileSafe(p) {
  try {
    if (!existsSync(p)) return null;
    return readFileSync(p);
  } catch {
    return null;
  }
}

function createStaticServer(dir, port) {
  const server = createServer((req, res) => {
    const filePath = req.url.split('?')[0];
    let fullPath = join(dir, filePath);

    const content = readFileSafe(fullPath);
    if (!content) {
      fullPath = join(dir, 'index.html');
    }

    const ext = extname(fullPath) || '.html';
    const finalContent = content || readFileSafe(fullPath);
    if (!finalContent) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }

    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    res.end(finalContent);
  });

  server.listen(port);
  return server;
}

async function launchBrowser() {
  const isCI = process.env.CI || process.env.VERCEL;

  if (isCI) {
    const chromium = await import('@sparticuz/chromium');
    const { default: puppeteerCore } = await import('puppeteer-core');
    return puppeteerCore.launch({
      executablePath: await chromium.default.executablePath(),
      args: chromium.default.args,
      headless: chromium.default.headless,
    });
  } else {
    const { default: puppeteer } = await import('puppeteer');
    return puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });
  }
}

async function prerender() {
  const PORT = 4173;
  const BASE = `http://localhost:${PORT}`;

  console.log('Starting static server...');
  const server = createStaticServer(distDir, PORT);

  const browser = await launchBrowser();

  console.log(`Prerendering ${ROUTES.length} routes...`);

  for (const route of ROUTES) {
    const page = await browser.newPage();

    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const type = req.resourceType();
      if (['image', 'media', 'font'].includes(type)) req.abort();
      else req.continue();
    });

    await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle0', timeout: 30000 });

    await page
      .waitForFunction(
        () => document.querySelector('script[type="application/ld+json"]') !== null,
        { timeout: 10000 }
      )
      .catch(() =>
        console.warn(`  Warning: No JSON-LD found on ${route} — check head() definition`)
      );

    const html = await page.evaluate(() => document.documentElement.outerHTML);

    const outDir = route === '/' ? distDir : join(distDir, route.slice(1));
    const outPath = join(outDir, 'index.html');

    mkdirSync(outDir, { recursive: true });
    writeFileSync(outPath, `<!DOCTYPE html>\n${html}`);

    console.log(`  ✓ ${route} → ${outPath.replace(distDir, 'dist')}`);
    await page.close();
  }

  await browser.close();
  server.close();
  console.log('Prerender complete.');
}

prerender().catch((err) => {
  console.error(err);
  process.exit(1);
});
