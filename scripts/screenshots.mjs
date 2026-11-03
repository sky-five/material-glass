// Regenerates docs/screenshots/*.jpg from the live demo pages.
//   node scripts/screenshots.mjs            all shots
//   node scripts/screenshots.mjs examples   only shots whose name contains "examples"
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { serve, launch, open, freeze, root } from './lib/browser.mjs';

const out = join(root, 'docs/screenshots');
mkdirSync(out, { recursive: true });
const filter = process.argv[2] || '';

// [file, path, viewport, clip selector or null, options]
const SHOTS = [];
for (const theme of ['sea-glass', 'prism']) {
  for (const mode of ['dark', 'light']) {
    const q = `index.html?theme=${theme}&mode=${mode}&glass=frosted&density=comfortable&shape=soft&motion=standard`;
    SHOTS.push([`hero-${theme}-${mode}`, q, { width: 1440, height: 940 }, null]);
    SHOTS.push([`palette-${theme}-${mode}`, q, { width: 1440, height: 900 }, '#palette']);
    SHOTS.push([`components-${theme}-${mode}`, q, { width: 1440, height: 900 }, '#components']);
    SHOTS.push([`workspace-${theme}-${mode}`, q, { width: 1440, height: 900 }, '#example']);
  }
}
SHOTS.push(['themes', 'docs/themes-grid.html', { width: 1520, height: 540 }, null, 'themes']);
SHOTS.push(['social', 'docs/social.html', { width: 1280, height: 640 }, null, '../media/social']);
SHOTS.push(['catalog', 'components.html?theme=sea-glass&mode=dark', { width: 1440, height: 1400 }, null]);
SHOTS.push(['builder', 'builder.html?mode=dark', { width: 1440, height: 1300 }, null]);
SHOTS.push(['examples-weather', 'examples/weather/index.html', { width: 1280, height: 860 }, null, 'example-weather']);
SHOTS.push(['examples-music', 'examples/music/index.html', { width: 1280, height: 860 }, null, 'example-music']);
SHOTS.push(['examples-dashboard', 'examples/dashboard/index.html', { width: 1280, height: 860 }, null, 'example-dashboard']);
SHOTS.push(['examples-settings', 'examples/settings/index.html', { width: 1280, height: 860 }, null, 'example-settings']);
SHOTS.push(['examples-landing', 'examples/landing/index.html', { width: 1280, height: 860 }, null, 'example-landing']);

const server = await serve();
const browser = await launch();
try {
  for (const [name, path, vp, clip, file] of SHOTS) {
    if (filter && !name.includes(filter)) continue;
    const page = await open(browser, `${server.url}/${path}`, vp);
    // Demo pages remember choices in localStorage; start every shot clean.
    await page.evaluate(() => localStorage.removeItem('mg-demo'));
    await freeze(page);
    let opts = { type: 'jpeg', quality: 82 };
    if (clip) {
      const el = await page.$(clip);
      await el.evaluate((e) => e.scrollIntoView({ block: 'start' }));
      await new Promise((r) => setTimeout(r, 300));
      const box = await el.boundingBox();
      opts.clip = { x: 0, y: Math.max(0, box.y - 24), width: vp.width, height: Math.min(box.height + 48, 1600) };
      opts.captureBeyondViewport = true;
    }
    const target = join(out, `${file || name}.jpg`);
    await page.screenshot({ path: target, ...opts });
    await page.close();
    console.log('✓', file || name);
  }
} finally {
  await browser.close();
  await server.close();
}
