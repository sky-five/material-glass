// Shared helpers for scripts that drive a real browser (screenshots, recording, visual and a11y tests).
// Uses the Chrome already installed on the machine (or CHROME_PATH), so nothing large is downloaded.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

export const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.mp4': 'video/mp4', '.woff2': 'font/woff2' };

/** Static server for the repo root on a free port. Returns { url, close }. */
export async function serve() {
  const server = createServer(async (req, res) => {
    try {
      let path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([/\\])+/, '');
      let file = join(root, path);
      if (!file.startsWith(root)) { res.writeHead(403).end(); return; }
      if (existsSync(file) && (await stat(file)).isDirectory()) file = join(file, 'index.html');
      const body = await readFile(file);
      res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
      res.end(body);
    } catch {
      res.writeHead(404).end('not found');
    }
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const { port } = server.address();
  return { url: `http://127.0.0.1:${port}`, close: () => new Promise((r) => server.close(r)) };
}

export function chromePath() {
  const candidates = [
    process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  ].filter(Boolean);
  const found = candidates.find((p) => existsSync(p));
  if (!found) throw new Error('Chrome not found. Set CHROME_PATH to a Chrome or Chromium executable.');
  return found;
}

export async function launch() {
  return puppeteer.launch({
    executablePath: chromePath(),
    headless: true,
    args: ['--no-sandbox', '--hide-scrollbars', '--force-color-profile=srgb', '--font-render-hinting=none']
  });
}

/** Open a page at a size, wait for fonts, scripts and two animation frames. */
export async function open(browser, url, { width = 1440, height = 900, scale = 1, reducedMotion = false, colorScheme } = {}) {
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: scale });
  const features = [];
  if (reducedMotion) features.push({ name: 'prefers-reduced-motion', value: 'reduce' });
  if (colorScheme) features.push({ name: 'prefers-color-scheme', value: colorScheme });
  if (features.length) await page.emulateMediaFeatures(features);
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
  await settle(page);
  return page;
}

export async function settle(page, ms = 400) {
  await page.evaluate(() => document.fonts && document.fonts.ready);
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  await new Promise((r) => setTimeout(r, ms));
}

/** Pause every CSS animation and transition so screenshots are deterministic. */
export async function freeze(page) {
  await page.addStyleTag({ content: '*, *::before, *::after { animation-play-state: paused !important; animation-delay: -1s !important; transition: none !important; caret-color: transparent !important; }' });
}
