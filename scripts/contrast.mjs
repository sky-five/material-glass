// WCAG contrast check for every theme and mode, every text-safe glass preset, and a generator sweep.
// Fails (exit 1) when a required pair drops below its threshold.
// Usage: node scripts/contrast.mjs [--no-sweep]
import * as mcu from '@material/material-color-utilities';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkMode, makeTheme } from '../src/theme-core.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const tokens = JSON.parse(readFileSync(join(root, 'tokens/material-glass.tokens.json'), 'utf8'));

let checks = 0;
let failures = 0;
const report = [];

function tally(label, r) {
  checks += r.checks;
  failures += r.failures.length;
  for (const f of r.failures) report.push(`  ✗ ${label}: ${f}`);
}

// 1. Every theme, both modes.
for (const [name, theme] of Object.entries(tokens.themes)) {
  for (const modeName of ['light', 'dark']) {
    const r = checkMode(theme[modeName]);
    tally(`${name}/${modeName}`, r);
    report.push(`  ${name}/${modeName}: worst text-on-glass ratio ${r.worst.toFixed(2)}`);
  }
}

// 2. Text-safe glass presets on every theme and mode.
for (const [preset, p] of Object.entries(tokens['glass-presets'])) {
  if (preset[0] === '$' || preset === 'frosted' || p.solid || !p['text-safe']) continue;
  for (const [name, theme] of Object.entries(tokens.themes)) {
    for (const modeName of ['light', 'dark']) {
      const v = { ...p, ...(p[modeName] || {}) };
      const glass = { ...theme[modeName].glass };
      for (const k of ['alpha', 'tint-alpha', 'specular', 'rim', 'saturate']) if (v[k] !== undefined) glass[k] = v[k];
      if (v.tint === 'shadow') glass.tint = glass.shadow;
      tally(`${name}/${modeName} + glass "${preset}"`, checkMode({ color: theme[modeName].color, glass }));
    }
  }
  report.push(`  glass preset "${preset}": ${Object.keys(tokens.themes).length} themes × 2 modes`);
}

// 3. Generator sweep: any seed with default settings must pass with no manual edits.
//    24 hues × 3 chroma levels, deterministic.
if (!process.argv.includes('--no-sweep')) {
  let failingModes = 0;
  for (let h = 0; h < 360; h += 15) {
    for (const chroma of [16, 48, 80]) {
      const seed = mcu.hexFromArgb(mcu.Hct.from(h, chroma, 55).toInt());
      const theme = makeTheme(mcu, { seed });
      for (const modeName of ['light', 'dark']) {
        const r = checkMode(theme[modeName]);
        if (r.failures.length) failingModes++;
        tally(`generator ${seed}/${modeName}`, r);
      }
    }
  }
  report.push(`  generator sweep: 72 seeds × 2 modes, ${failingModes} failing`);
}

console.log(report.join('\n'));
console.log(`\n${checks} checks, ${failures} failures`);
process.exit(failures ? 1 : 0);
