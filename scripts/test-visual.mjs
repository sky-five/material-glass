// Visual regression: screenshots of the catalog compared with per-platform baselines.
//   node scripts/test-visual.mjs            compare (missing baselines are created, not failed)
//   node scripts/test-visual.mjs --update   rewrite every baseline
// Baselines: test/__screenshots__/<platform>/  ·  diffs on failure: test/__diff__/
import { mkdirSync, existsSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { PNG } from 'pngjs';
import { serve, launch, freeze, settle, root } from './lib/browser.mjs';

const UPDATE = process.argv.includes('--update');
const base = join(root, 'test/__screenshots__', process.platform);
const diffDir = join(root, 'test/__diff__');
mkdirSync(base, { recursive: true });
rmSync(diffDir, { recursive: true, force: true });

const SECTIONS = ['actions', 'selection', 'inputs', 'pickers', 'navigation', 'overlays', 'containment', 'feedback', 'data', 'media'];
const THEMES = ['prism', 'obsidian', 'frost', 'ember', 'aurora', 'mono', 'sand'];
const CASES = [];
for (const mode of ['light', 'dark']) for (const s of SECTIONS) CASES.push({ name: `sea-glass-${mode}-${s}`, query: `theme=sea-glass&mode=${mode}`, section: s });
for (const t of THEMES) for (const mode of ['light', 'dark']) CASES.push({ name: `${t}-${mode}-actions`, query: `theme=${t}&mode=${mode}`, section: 'actions' });
for (const g of ['milk', 'smoked', 'crystal', 'clear', 'paper']) CASES.push({ name: `glass-${g}-containment`, query: `theme=sea-glass&mode=dark&glass=${g}`, section: 'containment' });
CASES.push({ name: 'density-dense-inputs', query: 'theme=sea-glass&mode=light&density=dense', section: 'inputs' });
CASES.push({ name: 'shape-sharp-actions', query: 'theme=sea-glass&mode=light&shape=sharp', section: 'actions' });
CASES.push({ name: 'reduced-transparency-containment', query: 'theme=sea-glass&mode=dark&reduced=1', section: 'containment' });
CASES.push({ name: 'rtl-navigation', query: 'theme=sea-glass&mode=light', section: 'navigation', rtl: true });

const PIXEL_TOLERANCE = 40;   // per-channel difference that still counts as "same"
const MAX_DIFF_RATIO = 0.003; // fail above 0.3% differing pixels

function compare(a, b) {
  if (a.width !== b.width || a.height !== b.height) return { ratio: 1, diff: null, reason: `size ${a.width}x${a.height} vs ${b.width}x${b.height}` };
  const diff = new PNG({ width: a.width, height: a.height });
  let bad = 0;
  for (let i = 0; i < a.data.length; i += 4) {
    const d = Math.max(Math.abs(a.data[i] - b.data[i]), Math.abs(a.data[i + 1] - b.data[i + 1]), Math.abs(a.data[i + 2] - b.data[i + 2]));
    if (d > PIXEL_TOLERANCE) { bad++; diff.data[i] = 255; diff.data[i + 1] = 0; diff.data[i + 2] = 80; diff.data[i + 3] = 255; }
    else { const g = (a.data[i] + a.data[i + 1] + a.data[i + 2]) / 3; diff.data[i] = diff.data[i + 1] = diff.data[i + 2] = g * 0.35; diff.data[i + 3] = 255; }
  }
  return { ratio: bad / (a.width * a.height), diff };
}

const server = await serve();
const browser = await launch();
let failed = 0, created = 0, passed = 0;
try {
  const page = await browser.newPage();
  // Half pixel density keeps baselines small; layout and colour regressions still show.
  await page.setViewport({ width: 1180, height: 900, deviceScaleFactor: 0.5 });
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  // Freeze time so "today" markers never change the pixels.
  await page.evaluateOnNewDocument(() => {
    const fixed = new Date('2026-11-02T10:00:00').getTime();
    const D = Date;
    // eslint-disable-next-line no-global-assign
    Date = class extends D { constructor(...a) { super(...(a.length ? a : [fixed])); } static now() { return fixed; } };
    Math.random = () => 0.42;
  });
  for (const c of CASES) {
    await page.goto(`${server.url}/components.html?${c.query}`, { waitUntil: 'networkidle0', timeout: 60000 });
    if (c.rtl) await page.evaluate(() => document.documentElement.setAttribute('dir', 'rtl'));
    await freeze(page);
    await settle(page, 250);
    const el = await page.$(`#${c.section}`);
    await el.evaluate((e) => e.scrollIntoView({ block: 'start' }));
    await settle(page, 150);
    const buf = Buffer.from(await el.screenshot({ type: 'png', captureBeyondViewport: true }));
    const file = join(base, `${c.name}.png`);
    if (UPDATE || !existsSync(file)) {
      writeFileSync(file, buf);
      created++;
      console.log(`+ ${c.name} (baseline written)`);
      continue;
    }
    const r = compare(PNG.sync.read(readFileSync(file)), PNG.sync.read(buf));
    if (r.ratio > MAX_DIFF_RATIO) {
      failed++;
      mkdirSync(diffDir, { recursive: true });
      writeFileSync(join(diffDir, `${c.name}.actual.png`), buf);
      if (r.diff) writeFileSync(join(diffDir, `${c.name}.diff.png`), PNG.sync.write(r.diff));
      console.log(`✗ ${c.name}: ${(r.ratio * 100).toFixed(2)}% pixels differ${r.reason ? ' (' + r.reason + ')' : ''}`);
    } else {
      passed++;
      console.log(`✓ ${c.name}${r.ratio ? ` (${(r.ratio * 100).toFixed(3)}%)` : ''}`);
    }
  }
} finally {
  await browser.close();
  await server.close();
}
console.log(`\n${passed} matched, ${failed} differ, ${created} baselines written (${process.platform})`);
if (created && !UPDATE) console.log('New baselines were written. Commit them to lock in the current look.');
process.exit(failed ? 1 : 0);
