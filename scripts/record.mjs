// Records the launch clip: lens drag, liquid navigation, theme and mode switches.
// Writes docs/media/demo.gif (pure JS encoder) and docs/media/demo.mp4 (needs ffmpeg-static:
// `npm i --no-save ffmpeg-static`, skipped if it is not installed).
//   node scripts/record.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { PNG } from 'pngjs';
import gifenc from 'gifenc';
import { serve, launch, open, root } from './lib/browser.mjs';

const { GIFEncoder, quantize, applyPalette } = gifenc;
const W = 1280, H = 720, FPS = 25;
const outDir = join(root, 'docs/media');
mkdirSync(outDir, { recursive: true });

const server = await serve();
const browser = await launch();
const page = await open(browser, `${server.url}/index.html?theme=sea-glass&mode=dark&glass=frosted&density=comfortable&shape=soft&motion=standard`, { width: W, height: H });
await page.evaluate(() => localStorage.removeItem('mg-demo'));
// Zoom out so the whole hero, phone included, fits a 720p frame.
await page.evaluate(() => { document.documentElement.style.zoom = '0.78'; window.scrollTo(0, 0); });
await new Promise((r) => setTimeout(r, 600));
await page.evaluate(() => window.MaterialGlass && MaterialGlass.refresh());

const cdp = await page.createCDPSession();
const frames = [];
cdp.on('Page.screencastFrame', async ({ data, metadata, sessionId }) => {
  frames.push({ t: metadata.timestamp, data });
  await cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
});
await cdp.send('Page.startScreencast', { format: 'png', everyNthFrame: 1, maxWidth: W, maxHeight: H });

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const center = async (sel) => { const b = await (await page.$(sel)).boundingBox(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; };
async function glide(from, to, ms) {
  const steps = Math.round(ms / 16);
  for (let i = 1; i <= steps; i++) {
    const k = i / steps, e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    await page.mouse.move(from.x + (to.x - from.x) * e, from.y + (to.y - from.y) * e);
    await wait(16);
  }
}

// 1. Hero settles
await page.mouse.move(W / 2, H - 40);
await wait(700);
// 2. Drag the lens across the headline
const lens = await center('.mg-lens');
const word = await center('.hero h1 span');
await glide({ x: W / 2, y: H - 40 }, lens, 500);
await page.mouse.down();
await glide(lens, { x: word.x - 120, y: word.y }, 600);
await glide({ x: word.x - 120, y: word.y }, { x: word.x + 120, y: word.y - 6 }, 1300);
await glide({ x: word.x + 120, y: word.y - 6 }, { x: word.x + 10, y: word.y - 90 }, 700);
await page.mouse.up();
await wait(500);
// 3. Liquid navigation in the phone
for (const label of ['Search', 'Library', 'Home']) {
  const item = await page.evaluateHandle((l) => [...document.querySelectorAll('.device .mg-nav__item')].find((b) => b.textContent.trim() === l), label);
  const b = await item.boundingBox();
  const at = { x: b.x + b.width / 2, y: b.y + b.height / 2 };
  const now = await page.evaluate(() => ({ x: window.__mx || 640, y: window.__my || 400 }));
  await glide(now, at, 420);
  await page.evaluate((p) => { window.__mx = p.x; window.__my = p.y; }, at);
  await page.mouse.click(at.x, at.y);
  await wait(620);
}
// 4. Themes: open the menu, pick a few, then flip to light
async function pickTheme(id) {
  const btn = await center('.theme-btn');
  await glide({ x: W - 300, y: 200 }, btn, 380);
  await page.mouse.click(btn.x, btn.y);
  await wait(450);
  const item = await center(`#theme-menu [data-theme="${id}"]`);
  await glide(btn, item, 380);
  await page.mouse.click(item.x, item.y);
  await wait(1000);
}
await pickTheme('aurora');
await pickTheme('ember');
const light = await center('[data-set="mode"][data-value="light"]');
await glide({ x: W - 300, y: 200 }, light, 350);
await page.mouse.click(light.x, light.y);
await wait(1300);
await pickTheme('frost');
await wait(500);

await cdp.send('Page.stopScreencast');
await browser.close();
await server.close();
console.log(`${frames.length} raw frames captured`);

// Resample to a constant frame rate (screencast only emits frames when the page changes).
const start = frames[0].t, end = frames[frames.length - 1].t;
const out = [];
for (let t = start, i = 0; t <= end; t += 1 / FPS) {
  while (i + 1 < frames.length && frames[i + 1].t <= t) i++;
  out.push(frames[i].data);
}
console.log(`${out.length} frames at ${FPS} fps (${(out.length / FPS).toFixed(1)} s)`);

// GIF: ffmpeg palettegen when available (much smaller), otherwise the pure-JS encoder below.
let ffmpegBin = null;
try { ffmpegBin = (await import('ffmpeg-static')).default; } catch {}
const runFfmpeg = (args) => new Promise((resolve, reject) => {
  const p = spawn(ffmpegBin, args, { stdio: ['pipe', 'ignore', 'inherit'] });
  p.on('error', reject);
  p.on('close', (code) => (code ? reject(new Error('ffmpeg exited ' + code)) : resolve()));
  (async () => {
    for (const f of out) if (!p.stdin.write(Buffer.from(f, 'base64'))) await new Promise((r) => p.stdin.once('drain', r));
    p.stdin.end();
  })();
});
if (ffmpegBin) {
  await runFfmpeg(['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-', '-vf', 'fps=12,scale=720:-1:flags=lanczos,split[a][b];[a]palettegen=stats_mode=diff:max_colors=200[p];[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle', join(outDir, 'demo.gif')]);
  const { statSync } = await import('node:fs');
  console.log(`docs/media/demo.gif ${(statSync(join(outDir, 'demo.gif')).size / 1048576).toFixed(1)} MB (ffmpeg)`);
} else {
// GIF: half resolution, every second frame, one shared palette per 25 frames.
const GW = 640, GH = 360;
const gif = GIFEncoder();
let palette = null;
for (let i = 0; i < out.length; i += 2) {
  const png = PNG.sync.read(Buffer.from(out[i], 'base64'));
  const small = new Uint8Array(GW * GH * 4);
  const sx = png.width / GW, sy = png.height / GH;
  for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
    // 2x2 box filter
    let r = 0, g = 0, b = 0;
    for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) {
      const si = ((Math.min(png.height - 1, Math.floor(y * sy) + dy)) * png.width + Math.min(png.width - 1, Math.floor(x * sx) + dx)) * 4;
      r += png.data[si]; g += png.data[si + 1]; b += png.data[si + 2];
    }
    const di = (y * GW + x) * 4;
    small[di] = r >> 2; small[di + 1] = g >> 2; small[di + 2] = b >> 2; small[di + 3] = 255;
  }
  if (!palette || i % 50 === 0) palette = quantize(small, 256);
  gif.writeFrame(applyPalette(small, palette), GW, GH, { palette, delay: Math.round(2000 / FPS) });
}
gif.finish();
writeFileSync(join(outDir, 'demo.gif'), gif.bytes());
console.log(`docs/media/demo.gif ${(gif.bytes().length / 1048576).toFixed(1)} MB`);
}

// MP4 through ffmpeg-static, if present.
if (!ffmpegBin) {
  console.log('ffmpeg-static not installed: skipped demo.mp4 (npm i --no-save ffmpeg-static)');
} else {
  await runFfmpeg(['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '22', '-preset', 'slow', '-movflags', '+faststart', join(outDir, 'demo.mp4')]);
  console.log('docs/media/demo.mp4 written');
}
