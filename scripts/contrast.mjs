// WCAG contrast check for every theme and mode.
// Fails (exit 1) when a required pair drops below its threshold.
// Usage: node scripts/contrast.mjs
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const tokens = JSON.parse(readFileSync(join(root, 'tokens/material-glass.tokens.json'), 'utf8'));

const toRgb = (hex) => [0, 2, 4].map((i) => parseInt(hex.replace('#', '').slice(i, i + 2), 16));
const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
const over = (top, alpha, bottom) => top.map((c, i) => c * alpha + bottom[i] * (1 - alpha));

// Text pairs that must reach 4.5:1 (AA body text).
const TEXT = [
  ['on-primary', 'primary'], ['on-primary-container', 'primary-container'],
  ['on-secondary', 'secondary'], ['on-secondary-container', 'secondary-container'],
  ['on-tertiary', 'tertiary'], ['on-tertiary-container', 'tertiary-container'],
  ['on-error', 'error'], ['on-error-container', 'error-container'],
  ['inverse-on-surface', 'inverse-surface'], ['inverse-primary', 'inverse-surface'],
  ...['surface', 'surface-container-lowest', 'surface-container-low', 'surface-container', 'surface-container-high', 'surface-container-highest']
    .flatMap((s) => [['on-surface', s], ['on-surface-variant', s], ['primary', s]])
];
// Non-text UI boundaries that must reach 3:1 (WCAG 1.4.11).
const UI = [['outline', 'surface'], ['outline', 'surface-container-high'], ['primary', 'surface-container-highest']];
// Backdrops glass is checked against. Glass over arbitrary photos cannot be guaranteed;
// these are the theme's own surfaces and containers, which is what the components sit on.
const BACKDROPS = ['surface', 'surface-container-highest', 'primary-container', 'secondary-container', 'tertiary-container', 'scene-base', 'scene-1', 'scene-2', 'scene-3'];

let failures = 0;
let checks = 0;
const report = [];

for (const [themeName, theme] of Object.entries(tokens.themes)) {
  for (const modeName of ['light', 'dark']) {
    const { color: c, glass: g } = theme[modeName];
    const fail = (msg) => { failures++; report.push(`  ✗ ${themeName}/${modeName}: ${msg}`); };

    for (const [fg, bg] of TEXT) {
      checks++;
      const r = ratio(toRgb(c[fg]), toRgb(c[bg]));
      if (r < 4.5) fail(`${fg} on ${bg} = ${r.toFixed(2)} (needs 4.5)`);
    }
    for (const [fg, bg] of UI) {
      checks++;
      const r = ratio(toRgb(c[fg]), toRgb(c[bg]));
      if (r < 3) fail(`${fg} vs ${bg} = ${r.toFixed(2)} (needs 3.0)`);
    }

    // Glass tiers 1-4 carry text. Use the thinnest point of the glass gradient (alpha - 0.12).
    // Scene colors are behind glass at reduced strength in .mg-scene (≤ 0.85), so test them as-is: worst case.
    let worst = Infinity;
    for (let tier = 1; tier <= 4; tier++) {
      const a = Math.max(0, g.alpha[tier] - 0.12);
      for (const b of BACKDROPS) {
        const backdrop = toRgb(c[b]);
        const tinted = over(toRgb(g.tint), g['tint-alpha'], backdrop);
        const glass = over(toRgb(g.base), a, tinted);
        for (const [fg, min] of [['on-surface', 4.5], ['on-surface-variant', tier >= 2 ? 4.5 : 3]]) {
          checks++;
          const r = ratio(toRgb(c[fg]), glass);
          worst = Math.min(worst, r);
          if (r < min) fail(`${fg} on glass tier ${tier} over ${b} = ${r.toFixed(2)} (needs ${min})`);
        }
      }
    }
    report.push(`  ${themeName}/${modeName}: worst text-on-glass ratio ${worst.toFixed(2)}`);
  }
}

console.log(report.join('\n'));
console.log(`\n${checks} checks, ${failures} failures`);
process.exit(failures ? 1 : 0);
