// Compiles the preset with Tailwind v3 and the theme with the real Tailwind v4 compiler,
// then checks the generated utilities.
import postcss from 'postcss';
import tailwind from 'tailwindcss';
import { compile } from 'tailwindcss-v4';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import preset from './index.js';

const here = dirname(fileURLToPath(import.meta.url));
let failed = 0;
const check = (name, ok) => { if (!ok) failed++; console.log(`${ok ? '✓' : '✗'} ${name}`); };

// ── v3 ──
const html = '<div class="bg-primary/50 text-on-surface rounded-mg-lg glass-3 liquid:bg-secondary-container font-display ease-spring duration-spring backdrop-blur-glass-2"></div>';
const v3 = (await postcss([tailwind({ presets: [preset], content: [{ raw: html }], corePlugins: { preflight: false } })]).process('@tailwind utilities;', { from: undefined })).css;
check('v3 bg-primary/50', /rgb\(var\(--mg-primary-rgb\) \/ 0\.5\)/.test(v3));
check('v3 text-on-surface', /var\(--mg-on-surface-rgb\)/.test(v3));
check('v3 rounded-mg-lg', /border-radius: var\(--mg-shape-lg\)/.test(v3));
check('v3 glass-3', /\.glass-3[\s\S]*backdrop-filter: blur\(var\(--_blur\)\)/.test(v3));
check('v3 liquid variant', /aria-pressed="true"/.test(v3));
check('v3 font-display', /font-family: var\(--mg-font-display\)/.test(v3));
check('v3 ease-spring', /transition-timing-function: var\(--mg-spring\)/.test(v3));
check('v3 backdrop-blur-glass-2', /var\(--mg-glass-blur-2\)/.test(v3));

// ── v4 ──
const req = createRequire(import.meta.url);
const twDir = dirname(req.resolve('tailwindcss-v4/package.json'));
const compiler = await compile('@import "tailwindcss/utilities";\n@import "./theme.css";', {
  base: here,
  loadStylesheet: async (id, base) => {
    const file = id === 'tailwindcss/utilities' ? join(twDir, 'utilities.css') : join(base, id);
    return { path: file, base: dirname(file), content: await readFile(file, 'utf8') };
  }
});
const v4 = compiler.build(['bg-primary/50', 'text-on-surface', 'rounded-mg-lg', 'glass-3', 'liquid:bg-secondary-container', 'font-display', 'ease-spring', 'backdrop-blur-glass-2']);
check('v4 bg-primary/50', /var\(--mg-primary\)/.test(v4));
check('v4 rounded-mg-lg', /var\(--mg-shape-lg\)/.test(v4));
check('v4 glass-3', /\.glass-3[\s\S]*backdrop-filter/.test(v4));
check('v4 liquid variant', /aria-pressed="true"/.test(v4));
check('v4 backdrop-blur-glass-2', /var\(--mg-glass-blur-2\)/.test(v4));

process.exit(failed ? 1 : 0);
