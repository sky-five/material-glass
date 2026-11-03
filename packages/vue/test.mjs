// 1) Server-renders components with @vue/server-renderer.  2) Mounts a real Vue app in Chrome.
import { createSSRApp, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { build } from 'esbuild';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as MG from './src/index.js';
import { serve, launch } from '../../scripts/lib/browser.mjs';

const here = dirname(fileURLToPath(import.meta.url));
let failed = 0;
const check = (name, ok, extra = '') => { if (!ok) failed++; console.log(`${ok ? '✓' : '✗'} ${name}${ok ? '' : ' ' + extra}`); };
const ssr = (c, props, slots) => renderToString(createSSRApp({ render: () => h(c, props, slots) }));

check('MgButton classes', (await ssr(MG.MgButton, { variant: 'tonal', size: 'lg' }, () => 'Go')).includes('class="mg-btn mg-btn--tonal mg-btn--lg"'));
check('MgCard heading + glass', (await ssr(MG.MgCard, { headline: 'T' }, () => 'B')).includes('mg-card mg-glass-2'));
check('MgSwitch semantics', (await ssr(MG.MgSwitch, { label: 'W', modelValue: true })).includes('aria-checked="true"'));
check('MgSlider fill', (await ssr(MG.MgSlider, { modelValue: 25, label: 'L' })).includes('--mg-value:25%'));
check('MgTextField error wiring', (await ssr(MG.MgTextField, { label: 'E', id: 'e', error: 'Bad' })).includes('aria-describedby="e-support"'));
check('MgProvider attributes', (await ssr(MG.MgProvider, { theme: 'ember', mode: 'dark' }, () => 'x')).includes('data-mg-theme="ember" data-mg-mode="dark"'));
check('MgTabs ARIA', (await ssr(MG.MgTabs, { label: 'L', modelValue: 'a', items: [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }] })).includes('role="tablist"'));

await build({ entryPoints: [join(here, 'test/app.js')], outfile: join(here, 'test/app.bundle.js'), bundle: true, format: 'esm', define: { 'process.env.NODE_ENV': '"development"', __VUE_OPTIONS_API__: 'true', __VUE_PROD_DEVTOOLS__: 'false', __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false' }, alias: { vue: 'vue/dist/vue.runtime.esm-bundler.js' }, logLevel: 'error' });
const server = await serve();
const browser = await launch();
try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
  await page.goto(`${server.url}/packages/vue/test/index.html`, { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 500));
  const q = (fn) => page.evaluate(fn);
  check('Vue app renders without errors', errors.length === 0 && (await q(() => !!document.getElementById('card'))), errors.join(' | '));
  await page.click('#sw');
  check('v-model on MgSwitch', await q(() => document.getElementById('sw-state').textContent === 'true'));
  await page.click('[aria-label="View"] button:nth-child(4)');
  check('v-model on MgSegmented', await q(() => document.getElementById('view-state').textContent === 'month'));
  check('MgSegmented gets a liquid indicator', await q(() => !!document.querySelector('[aria-label="View"] .mg-liquid__indicator')));
  await page.focus('[role="tab"][aria-selected="true"]');
  await page.keyboard.press('ArrowRight');
  await new Promise((r) => setTimeout(r, 120));
  check('MgTabs arrow keys', await q(() => document.querySelector('[role="tab"][aria-selected="true"]').textContent === 'Albums' && !document.getElementById('mg-tabs-albums-panel').hidden));
  await page.click('#name', { clickCount: 3 });
  await page.keyboard.type('Grace');
  check('v-model on MgTextField', await q(() => document.getElementById('name-state').textContent === 'Grace'));
  await page.click('#chip');
  check('MgChip toggles', await q(() => document.getElementById('chip').getAttribute('aria-pressed') === 'true'));
  await page.click('#open');
  await new Promise((r) => setTimeout(r, 100));
  check('MgDialog opens', await q(() => document.querySelector('dialog.mg-dialog').open));
  await page.click('#keep');
  await new Promise((r) => setTimeout(r, 100));
  check('MgDialog closes with return value', await q(() => !document.querySelector('dialog.mg-dialog').open && document.getElementById('closed').textContent === 'keep'));
  await page.click('#theme');
  await new Promise((r) => setTimeout(r, 100));
  check('MgProvider updates theme', await q(() => !!document.querySelector('[data-mg-theme="frost"]')));
} finally {
  await browser.close();
  await server.close();
}
process.exit(failed ? 1 : 0);
