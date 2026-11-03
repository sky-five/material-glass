// 1) Compiles every component (client + server) and fails on errors or warnings, including a11y warnings.
// 2) Bundles a real Svelte 5 app and drives it in Chrome.
import { compile } from 'svelte/compiler';
import { build } from 'esbuild';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { serve, launch } from '../../scripts/lib/browser.mjs';

const here = dirname(fileURLToPath(import.meta.url));
let failed = 0;
const check = (name, ok, extra = '') => { if (!ok) failed++; console.log(`${ok ? '✓' : '✗'} ${name}${ok ? '' : ' ' + extra}`); };

for (const f of readdirSync(join(here, 'src/lib')).filter((f) => f.endsWith('.svelte'))) {
  const source = readFileSync(join(here, 'src/lib', f), 'utf8');
  try {
    const warnings = [];
    for (const generate of ['client', 'server']) warnings.push(...compile(source, { filename: f, generate }).warnings);
    check(`${f} compiles cleanly`, warnings.length === 0, warnings.map((w) => w.code + ': ' + w.message).join(' | '));
  } catch (e) {
    check(`${f} compiles cleanly`, false, e.message);
  }
}

const sveltePlugin = {
  name: 'svelte',
  setup(b) {
    b.onLoad({ filter: /\.svelte$/ }, (args) => {
      const { js } = compile(readFileSync(args.path, 'utf8'), { filename: args.path, generate: 'client', css: 'external' });
      return { contents: js.code, loader: 'js', resolveDir: dirname(args.path) };
    });
  }
};
await build({ entryPoints: [join(here, 'test/main.js')], outfile: join(here, 'test/app.bundle.js'), bundle: true, format: 'esm', conditions: ['svelte', 'browser'], mainFields: ['svelte', 'browser', 'module', 'main'], plugins: [sveltePlugin], logLevel: 'error' });

const server = await serve();
const browser = await launch();
try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
  await page.goto(`${server.url}/packages/svelte/test/index.html`, { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 500));
  const q = (fn) => page.evaluate(fn);
  check('Svelte app renders without errors', errors.length === 0 && (await q(() => !!document.getElementById('card'))), errors.join(' | '));
  check('Provider scopes theme', await q(() => !!document.querySelector('[data-mg-theme="ember"][data-mg-mode="dark"]')));
  await page.click('#sw');
  check('bind:checked on Switch', await q(() => document.getElementById('sw-state').textContent === 'true'));
  await page.click('[aria-label="View"] button:nth-child(4)');
  check('bind:value on Segmented', await q(() => document.getElementById('view-state').textContent === 'month'));
  check('use:liquid attaches the indicator', await q(() => !!document.querySelector('[aria-label="View"] .mg-liquid__indicator')));
  await page.focus('[role="tab"][aria-selected="true"]');
  await page.keyboard.press('ArrowRight');
  await new Promise((r) => setTimeout(r, 120));
  check('Tabs arrow keys', await q(() => document.querySelector('[role="tab"][aria-selected="true"]').textContent === 'Albums' && !document.getElementById('mg-tabs-albums-panel').hidden));
  await page.click('#name', { clickCount: 3 });
  await page.keyboard.type('Grace');
  check('bind:value on TextField', await q(() => document.getElementById('name-state').textContent === 'Grace'));
  await page.click('#chip');
  check('bind:selected on Chip', await q(() => document.getElementById('chip').getAttribute('aria-pressed') === 'true'));
  await page.click('#open');
  await new Promise((r) => setTimeout(r, 100));
  check('Dialog opens', await q(() => document.querySelector('dialog.mg-dialog').open));
  await page.click('#keep');
  await new Promise((r) => setTimeout(r, 100));
  check('Dialog closes with return value', await q(() => !document.querySelector('dialog.mg-dialog').open && document.getElementById('closed').textContent === 'keep'));
  await page.click('#theme');
  await new Promise((r) => setTimeout(r, 100));
  check('Provider updates theme', await q(() => !!document.querySelector('[data-mg-theme="frost"]')));
} finally {
  await browser.close();
  await server.close();
}
process.exit(failed ? 1 : 0);
