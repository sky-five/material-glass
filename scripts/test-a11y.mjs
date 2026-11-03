// Runs axe-core on every demo page in light and dark mode.
// Fails on serious or critical violations; lists moderate/minor ones as warnings.
//   node scripts/test-a11y.mjs [page-filter]
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { serve, launch, open } from './lib/browser.mjs';

const require = createRequire(import.meta.url);
const axeSource = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const filter = process.argv[2] || '';

const PAGES = [
  'index.html?theme=sea-glass', 'index.html?theme=prism',
  'components.html?theme=sea-glass', 'components.html?theme=frost', 'components.html?theme=mono',
  'builder.html',
  'examples/index.html', 'examples/weather/index.html', 'examples/music/index.html',
  'examples/dashboard/index.html', 'examples/settings/index.html', 'examples/landing/index.html'
];

const server = await serve();
const browser = await launch();
let serious = 0, warnings = 0;
try {
  for (const p of PAGES) {
    if (filter && !p.includes(filter)) continue;
    for (const mode of ['light', 'dark']) {
      const url = `${server.url}/${p}${p.includes('?') ? '&' : '?'}mode=${mode}`;
      const page = await open(browser, url, { width: 1280, height: 900, reducedMotion: true });
      // Some examples set the mode themselves; force it for a fair run.
      await page.evaluate((m) => document.documentElement.setAttribute('data-mg-mode', m), mode);
      await new Promise((r) => setTimeout(r, 300));
      await page.evaluate(axeSource);
      const result = await page.evaluate(async () => {
        const r = await window.axe.run(document, {
          runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] },
          rules: {
            // Decorative demo art is intentionally low contrast; text contrast is covered by scripts/contrast.mjs
            // for real theme roles. axe cannot compute contrast through backdrop-filter, so it is checked there.
            'color-contrast': { enabled: false }
          }
        });
        return r.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.slice(0, 3).map((n) => n.target.join(' ')), count: v.nodes.length }));
      });
      for (const v of result) {
        const bad = v.impact === 'serious' || v.impact === 'critical';
        if (bad) serious++; else warnings++;
        console.log(`${bad ? '✗' : '!'} ${p} [${mode}] ${v.id} (${v.impact}, ${v.count}): ${v.help}\n    ${v.nodes.join('\n    ')}`);
      }
      if (!result.length) console.log(`✓ ${p} [${mode}]`);
      await page.close();
    }
  }
} finally {
  await browser.close();
  await server.close();
}
console.log(`\n${serious} serious/critical, ${warnings} other`);
process.exit(serious ? 1 : 0);
