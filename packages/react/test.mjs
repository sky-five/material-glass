// 1) Server-renders components and checks the markup.  2) Runs a real React app in Chrome.
import * as React from 'react';
import { renderToString } from 'react-dom/server';
import { build } from 'esbuild';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as MG from './dist/index.js';
import { serve, launch } from '../../scripts/lib/browser.mjs';

const here = dirname(fileURLToPath(import.meta.url));
let failed = 0;
const check = (name, ok, extra = '') => { if (!ok) failed++; console.log(`${ok ? '✓' : '✗'} ${name}${ok ? '' : ' ' + extra}`); };
const h = React.createElement;
const ssr = (el) => renderToString(el);

// ── SSR markup ──
check('Button classes', ssr(h(MG.Button, { variant: 'tonal', size: 'lg' }, 'Go')).includes('class="mg-btn mg-btn--tonal mg-btn--lg"'));
check('Button defaults to type=button', ssr(h(MG.Button, null, 'Go')).includes('type="button"'));
check('Glass tier and refraction', /class="mg-glass-3"[^>]*data-mg-refract="24"|data-mg-refract="24"[^>]*class="mg-glass-3"/.test(ssr(h(MG.Glass, { tier: 3, refract: true }))));
check('Card heading and actions', (() => { const s = ssr(h(MG.Card, { headline: 'T', actions: 'A' }, 'B')); return s.includes('mg-card mg-glass-2') && s.includes('<h3 class="mg-card__title">T</h3>') && s.includes('mg-card__actions'); })());
check('Card variant drops glass', ssr(h(MG.Card, { variant: 'outlined' })).includes('class="mg-card mg-card--outlined"'));
check('IconButton requires a label', ssr(h(MG.IconButton, { label: 'Fav', icon: 'x', pressed: true })).includes('aria-label="Fav"'));
check('Switch semantics', (() => { const s = ssr(h(MG.Switch, { label: 'Wi-Fi', checked: true })); return s.includes('role="switch"') && s.includes('aria-checked="true"'); })());
check('Slider fill variable', ssr(h(MG.Slider, { label: 'L', min: 0, max: 10, value: 5, onChange() {} })).includes('--mg-value:50%'));
check('TextField error wiring', (() => { const s = ssr(h(MG.TextField, { label: 'E', id: 'e', error: 'Bad' })); return s.includes('aria-invalid="true"') && s.includes('aria-describedby="e-support"') && s.includes('mg-field__support--error'); })());
check('Provider scopes attributes', ssr(h(MG.MaterialGlassProvider, { theme: 'ember', mode: 'dark', glass: 'milk' }, 'x')).includes('data-mg-theme="ember" data-mg-mode="dark" data-mg-glass="milk"'));
check('Provider omits auto mode', !ssr(h(MG.MaterialGlassProvider, { theme: 'ember', mode: 'auto' })).includes('data-mg-mode'));
check('CircularProgress determinate', ssr(h(MG.CircularProgress, { label: 'L', value: 40 })).includes('aria-valuenow="40"'));
check('Tabs ARIA', (() => { const s = ssr(h(MG.Tabs, { label: 'L', value: 'a', onChange() {}, items: [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }] })); return s.includes('role="tablist"') && s.includes('aria-selected="true"') && s.includes('tabindex="-1"'); })());

// ── Browser ──
await build({ entryPoints: [join(here, 'test/app.jsx')], outfile: join(here, 'test/app.bundle.js'), bundle: true, format: 'esm', jsx: 'automatic', define: { 'process.env.NODE_ENV': '"development"' }, logLevel: 'error' });
const server = await serve();
const browser = await launch();
try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
  await page.goto(`${server.url}/packages/react/test/index.html`, { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 500));
  const q = (fn) => page.evaluate(fn);
  check('React app renders without errors', errors.length === 0 && (await q(() => !!document.getElementById('card'))), errors.join(' | '));
  check('Provider wrapper carries theme', await q(() => !!document.querySelector('[data-mg-theme="ember"][data-mg-density="compact"]')));
  await page.click('#sw');
  check('Switch is controlled', await q(() => document.getElementById('sw-state').textContent === 'true' && document.getElementById('sw').getAttribute('aria-checked') === 'true'));
  await page.click('[role="group"][aria-label="View"] button:nth-child(4)');
  check('Segmented onChange', await q(() => document.getElementById('view-state').textContent === 'month'));
  check('Segmented gets a liquid indicator', await q(() => !!document.querySelector('[aria-label="View"] .mg-liquid__indicator')));
  await page.focus('[role="tab"][aria-selected="true"]');
  await page.keyboard.press('ArrowRight');
  await new Promise((r) => setTimeout(r, 100));
  check('Tabs arrow keys', await q(() => document.querySelector('[role="tab"][aria-selected="true"]').textContent === 'Albums' && !document.getElementById('mg-tabs-albums-panel').hidden));
  await page.click('#chip');
  check('Chip toggles', await q(() => document.getElementById('chip').getAttribute('aria-pressed') === 'true'));
  await page.click('#open');
  await new Promise((r) => setTimeout(r, 100));
  check('Dialog opens as modal', await q(() => document.querySelector('dialog.mg-dialog').open));
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
