/* Theme builder. Uses the same engine as scripts/theme.mjs, so what you build here is what the CLI would generate. */
import * as mcu from 'https://cdn.jsdelivr.net/npm/@material/material-color-utilities@0.3.0/+esm';
import { makeTheme, themeToCss, checkMode, seedFromPixels, GLASS_DEFAULTS } from '../src/theme-core.js';

const $ = (id) => document.getElementById(id);
const html = document.documentElement;
const style = $('custom-theme');

const GLASS_FIELDS = [
  { key: 'alpha0', label: 'Opacity, thinnest tier', min: 0.05, max: 0.9, step: 0.01 },
  { key: 'alphaStep', label: 'Opacity added per tier', min: 0, max: 0.2, step: 0.01 },
  { key: 'blur0', label: 'Blur, thinnest tier', min: 0, max: 40, step: 1, unit: 'px' },
  { key: 'blurStep', label: 'Blur added per tier', min: 0, max: 16, step: 1, unit: 'px' },
  { key: 'tint-alpha', label: 'Tint', min: 0, max: 0.4, step: 0.01 },
  { key: 'specular', label: 'Specular highlight', min: 0, max: 1, step: 0.01 },
  { key: 'rim', label: 'Rim light', min: 0, max: 1, step: 0.01 },
  { key: 'saturate', label: 'Backdrop saturation', min: 0.5, max: 2.5, step: 0.05 }
];
const DEFAULT_BLUR = [8, 14, 20, 28, 36];
const glassDefaults = (mode) => {
  const d = GLASS_DEFAULTS[mode];
  return { alpha0: d.alpha[0], alphaStep: +((d.alpha[4] - d.alpha[0]) / 4).toFixed(2), blur0: DEFAULT_BLUR[0], blurStep: 7, 'tint-alpha': d['tint-alpha'], specular: d.specular, rim: d.rim, saturate: d.saturate };
};

let state = {
  name: 'my-theme',
  seed: '#26A69A',
  variant: 'tonal-spot',
  contrast: 0,
  secondary: null,
  tertiary: null,
  glass: { light: glassDefaults('light'), dark: glassDefaults('dark') }
};
let editing = html.getAttribute('data-mg-mode') === 'light' ? 'light' : 'dark';
let current = null;

// ── State ↔ URL hash ──
const encode = (o) => btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const decode = (s) => JSON.parse(decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/')))));
try { if (location.hash.length > 1) state = Object.assign(state, decode(location.hash.slice(1))); } catch (e) { /* ignore a bad link */ }

function glassFor(mode) {
  const g = state.glass[mode];
  const alpha = [0, 1, 2, 3, 4].map((i) => +Math.min(0.98, g.alpha0 + g.alphaStep * i).toFixed(2));
  const blur = [0, 1, 2, 3, 4].map((i) => Math.round(g.blur0 + g.blurStep * i));
  return { alpha, blur, 'tint-alpha': g['tint-alpha'], specular: g.specular, rim: g.rim, saturate: g.saturate };
}

function spec() {
  const s = { seed: state.seed, variant: state.variant, glass: { light: glassFor('light'), dark: glassFor('dark') } };
  if (state.contrast) s.contrast = state.contrast;
  if (state.secondary) s.secondary = state.secondary;
  if (state.tertiary) s.tertiary = state.tertiary;
  return s;
}

const safeName = () => (state.name || 'my-theme').toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '') || 'my-theme';

function render() {
  try {
    current = makeTheme(mcu, spec());
  } catch (e) {
    $('result').textContent = e.message;
    return;
  }
  style.textContent = themeToCss('builder-preview', current);
  html.setAttribute('data-mg-theme', 'builder-preview');
  document.querySelectorAll('[data-theme-name]').forEach((el) => { el.textContent = 'Custom'; });

  // Contrast
  let fails = [];
  for (const mode of ['light', 'dark']) {
    const r = checkMode(current[mode]);
    $('worst-' + mode).textContent = r.worst.toFixed(2) + ':1';
    $('worst-' + mode).className = r.failures.length ? 'is-bad' : 'is-good';
    fails = fails.concat(r.failures.map((f) => `${mode}: ${f}`));
  }
  $('result').textContent = fails.length ? `${fails.length} pair${fails.length > 1 ? 's' : ''} below AA` : 'Every pair passes WCAG AA';
  $('result').className = 'b-status__item b-status__result ' + (fails.length ? 'is-bad' : 'is-good');
  $('failures-btn').hidden = !fails.length;
  const list = $('failure-list');
  list.textContent = '';
  fails.slice(0, 30).forEach((f) => { const li = document.createElement('li'); li.textContent = f; list.appendChild(li); });

  renderPalettes();
  history.replaceState(null, '', '#' + encode(state));
  requestAnimationFrame(() => window.MaterialGlass && MaterialGlass.refresh());
}

function renderPalettes() {
  const host = $('palettes');
  host.textContent = '';
  for (const [key, tones] of Object.entries(current.palette)) {
    const row = document.createElement('div');
    row.className = 'b-pal';
    const name = document.createElement('span');
    name.className = 'b-pal__name';
    name.textContent = key;
    row.appendChild(name);
    const strip = document.createElement('div');
    strip.className = 'b-pal__strip';
    for (const [tone, hex] of Object.entries(tones)) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'b-pal__tone';
      b.style.background = hex;
      b.style.color = +tone < 60 ? '#fff' : '#111';
      b.textContent = tone;
      b.title = `${key} ${tone} · ${hex} (click to copy)`;
      b.setAttribute('aria-label', `${key} tone ${tone}, ${hex}. Copy`);
      b.addEventListener('click', () => copy(hex, `Copied ${hex}`));
      strip.appendChild(b);
    }
    row.appendChild(strip);
    host.appendChild(row);
  }
}

// ── Glass sliders ──
function renderSliders() {
  const host = $('glass-sliders');
  host.textContent = '';
  const g = state.glass[editing];
  GLASS_FIELDS.forEach((f) => {
    const id = 'g-' + f.key;
    const label = document.createElement('label');
    label.className = 'stack b-label';
    const top = document.createElement('span');
    top.className = 'control-label b-label__row';
    top.append(f.label);
    const out = document.createElement('output');
    out.htmlFor = id;
    out.textContent = g[f.key] + (f.unit || '');
    top.appendChild(out);
    const input = document.createElement('input');
    input.type = 'range';
    input.className = 'mg-slider';
    input.id = id;
    input.min = f.min;
    input.max = f.max;
    input.step = f.step;
    input.value = g[f.key];
    input.addEventListener('input', () => {
      g[f.key] = +input.value;
      out.textContent = input.value + (f.unit || '');
      schedule();
    });
    label.appendChild(top);
    label.appendChild(input);
    host.appendChild(label);
  });
  document.querySelectorAll('[data-gm]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.gm === editing)));
}

let queued = false;
function schedule() {
  if (queued) return;
  queued = true;
  requestAnimationFrame(() => { queued = false; render(); });
}

// ── Inputs ──
function setSeed(hex, from) {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return;
  state.seed = hex.toUpperCase();
  if (from !== 'color') $('seed-color').value = hex;
  if (from !== 'hex') $('seed-hex').value = state.seed;
  schedule();
}
$('seed-color').addEventListener('input', (e) => setSeed(e.target.value, 'color'));
$('seed-hex').addEventListener('input', (e) => { let v = e.target.value.trim(); if (v && v[0] !== '#') v = '#' + v; setSeed(v, 'hex'); });
$('seed-random').addEventListener('click', () => {
  const hct = mcu.Hct.from(Math.random() * 360, 30 + Math.random() * 60, 50);
  setSeed(mcu.hexFromArgb(hct.toInt()));
});
$('variant').addEventListener('change', (e) => { state.variant = e.target.value; schedule(); });
$('contrast').addEventListener('input', (e) => { state.contrast = +e.target.value; $('contrast-out').textContent = e.target.value; schedule(); });
for (const k of ['secondary', 'tertiary']) {
  const use = $('use-' + k), pick = $(k);
  use.addEventListener('change', () => { pick.disabled = !use.checked; state[k] = use.checked ? pick.value.toUpperCase() : null; schedule(); });
  pick.addEventListener('input', () => { if (use.checked) { state[k] = pick.value.toUpperCase(); schedule(); } });
}
$('theme-name').addEventListener('input', (e) => { state.name = e.target.value; history.replaceState(null, '', '#' + encode(state)); });
document.querySelectorAll('[data-gm]').forEach((b) => b.addEventListener('click', () => {
  editing = b.dataset.gm;
  if (window.MGDemo) MGDemo.set('mode', editing);
  renderSliders();
}));
$('glass-reset').addEventListener('click', () => { state.glass[editing] = glassDefaults(editing); renderSliders(); schedule(); });

// Seed from an image: downscale onto a canvas, then quantize like the CLI does.
$('seed-image').addEventListener('change', (e) => {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  const img = new Image();
  img.onload = () => {
    const c = document.createElement('canvas');
    const scale = Math.min(1, 160 / Math.max(img.width, img.height));
    c.width = Math.max(1, Math.round(img.width * scale));
    c.height = Math.max(1, Math.round(img.height * scale));
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0, c.width, c.height);
    const seed = seedFromPixels(mcu, ctx.getImageData(0, 0, c.width, c.height).data);
    URL.revokeObjectURL(img.src);
    setSeed(seed);
    MaterialGlass.toast(`Seed ${seed} from ${file.name}`);
  };
  img.src = URL.createObjectURL(file);
});

// ── Output ──
function outputs() {
  const name = safeName();
  const s = spec();
  s.description = `Built with the Material Glass theme builder from ${state.seed}.`;
  return {
    css: themeToCss(name, current),
    json: JSON.stringify({ [name]: current }, null, 2),
    config: JSON.stringify({ [name]: s }, null, 2)
  };
}
function copy(text, msg) {
  if (!navigator.clipboard) return;
  navigator.clipboard.writeText(text).then(() => MaterialGlass.toast(msg || 'Copied'));
}
document.querySelectorAll('[data-copy-out]').forEach((b) => b.addEventListener('click', () => {
  const kind = b.dataset.copyOut;
  copy(outputs()[kind], { css: 'CSS copied. Paste it after material-glass.css.', json: 'Theme tokens copied', config: 'Config copied. Add it to tokens/themes.config.json.' }[kind]);
}));
$('download-css').addEventListener('click', () => {
  const blob = new Blob([`/* ${safeName()} · Material Glass theme · use with data-mg-theme="${safeName()}" */\n` + outputs().css + '\n'], { type: 'text/css' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${safeName()}.css`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
});
$('share-link').addEventListener('click', () => copy(location.href, 'Link copied. It opens this exact theme.'));

// Keep the custom theme when the top-bar mode changes; switching theme in the menu leaves the builder preview.
if (window.MGDemo) MGDemo.onChange(() => {
  const mode = html.getAttribute('data-mg-mode');
  if (mode === 'light' || mode === 'dark') { editing = mode; renderSliders(); }
});

// Restore controls from state
$('seed-color').value = state.seed;
$('seed-hex').value = state.seed;
$('variant').value = state.variant;
$('contrast').value = state.contrast;
$('contrast-out').textContent = state.contrast;
$('theme-name').value = state.name;
for (const k of ['secondary', 'tertiary']) if (state[k]) { $('use-' + k).checked = true; $(k).disabled = false; $(k).value = state[k]; }
renderSliders();
render();
