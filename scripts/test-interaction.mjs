// Behaviour tests in a real browser: no page errors anywhere, and keyboard/pointer behaviour of the
// interactive components on the catalog page.
//   node scripts/test-interaction.mjs
import { serve, launch, open } from './lib/browser.mjs';

const PAGES = ['index.html', 'components.html', 'builder.html', 'guide/index.html', 'guide/theming.html', 'guide/customization.html', 'examples/index.html', 'examples/weather/index.html', 'examples/music/index.html', 'examples/dashboard/index.html', 'examples/settings/index.html', 'examples/landing/index.html'];

const server = await serve();
const browser = await launch();
let failed = 0, passed = 0;
const ok = (name, cond, extra = '') => { if (cond) { passed++; console.log(`✓ ${name}`); } else { failed++; console.log(`✗ ${name} ${extra}`); } };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

try {
  // 1. Every page loads without script errors.
  for (const p of PAGES) {
    const errors = [];
    const page = await browser.newPage();
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error' && !/favicon|Failed to load resource/.test(m.text())) errors.push(m.text()); });
    await page.setViewport({ width: 1280, height: 900 });
    await page.goto(`${server.url}/${p}`, { waitUntil: 'networkidle0', timeout: 60000 });
    await wait(500);
    ok(`${p} loads without errors`, errors.length === 0, errors.join(' | '));
    await page.close();
  }

  // 2. Component behaviour on the catalog.
  const page = await open(browser, `${server.url}/components.html?theme=sea-glass&mode=dark`, { width: 1280, height: 900, reducedMotion: true });
  const q = (fn, ...a) => page.evaluate(fn, ...a);
  const active = () => q(() => { const a = document.activeElement; return a ? (a.id || a.textContent.trim().slice(0, 30)) : null; });

  // Theme menu: Enter opens, focus moves in, arrows move, Escape closes and returns focus.
  await page.focus('.theme-btn');
  await page.keyboard.press('Enter');
  await wait(200);
  ok('menu opens from keyboard', await q(() => document.getElementById('theme-menu').matches(':popover-open')));
  const first = await active();
  await page.keyboard.press('ArrowDown');
  const second = await active();
  ok('menu arrow keys move focus', first && second && first !== second, `${first} → ${second}`);
  await page.keyboard.press('Escape');
  await wait(150);
  ok('menu closes on Escape', await q(() => !document.getElementById('theme-menu').matches(':popover-open')));
  ok('menu has an anchored position', await q(() => document.getElementById('theme-menu').style.top !== ''));

  // Choosing a theme from the menu.
  await page.click('.theme-btn');
  await wait(150);
  await page.click('#theme-menu [data-theme="ember"]');
  await wait(200);
  ok('menu item changes theme', (await q(() => document.documentElement.getAttribute('data-mg-theme'))) === 'ember');

  // Tabs: arrow keys select and show the right panel.
  await page.focus('#t-1');
  await page.keyboard.press('ArrowRight');
  await wait(150);
  ok('tabs: ArrowRight selects next tab', await q(() => document.getElementById('t-2').getAttribute('aria-selected') === 'true'));
  ok('tabs: panel follows selection', await q(() => !document.getElementById('tp-2').hidden && document.getElementById('tp-1').hidden));

  // Slider keeps its filled track in sync.
  await page.focus('#s-vol');
  await page.keyboard.press('ArrowRight');
  ok('slider value and fill update', await q(() => { const s = document.getElementById('s-vol'); return s.value === '63' && s.style.getPropertyValue('--mg-value').startsWith('63'); }));
  ok('slider output updates', await q(() => document.querySelector('output[for="s-vol"]').textContent === '63'));

  // Date picker: arrow then Enter selects the next day.
  await page.focus('.mg-datepicker:not([data-range]) .mg-datepicker__day[tabindex="0"]');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  await wait(100);
  ok('date picker keyboard selection', (await q(() => document.querySelector('.mg-datepicker:not([data-range])').getAttribute('data-value'))) === '2026-11-13');

  // Combobox filters and chooses.
  await page.click('[data-mg-combobox] input');
  await page.keyboard.type('ge');
  await wait(100);
  ok('combobox filters options', (await q(() => [...document.querySelectorAll('#fonts-list [role="option"]')].filter((o) => !o.hidden).map((o) => o.textContent))).join() === 'Geist');
  await page.keyboard.press('Enter');
  ok('combobox Enter chooses', (await q(() => document.querySelector('[data-mg-combobox] input').value)) === 'Geist');

  // Stepper.
  await page.click('[data-mg-stepper] button:last-of-type');
  ok('stepper increments', (await q(() => document.querySelector('[data-mg-stepper] input').value)) === '3');

  // Split pane via keyboard.
  await page.focus('.mg-split__handle');
  await page.keyboard.press('ArrowRight');
  ok('split pane resizes from keyboard', (await q(() => document.querySelector('.mg-split').style.getPropertyValue('--split'))) === '43%');

  // Sortable table: sort by worst ratio ascending.
  await page.click('th:nth-child(3) .mg-table__sort');
  ok('table sorts numerically', (await q(() => document.querySelector('[data-mg-sortable] tbody tr td:nth-child(3)').textContent.trim())) === '4.18');
  ok('table header reports sort', (await q(() => document.querySelector('th:nth-child(3)').getAttribute('aria-sort'))) === 'ascending');

  // Dialog: opens and closes with Escape.
  await page.click('[data-open-dialog="dlg-basic"]');
  await wait(100);
  ok('dialog opens', await q(() => document.getElementById('dlg-basic').open));
  await page.keyboard.press('Escape');
  await wait(100);
  ok('dialog closes on Escape', await q(() => !document.getElementById('dlg-basic').open));

  // Command palette: Ctrl+K, filter, Enter runs.
  await page.keyboard.down('Control');
  await page.keyboard.press('k');
  await page.keyboard.up('Control');
  await wait(150);
  ok('command palette opens on Ctrl+K', await q(() => document.querySelector('dialog[data-mg-command]').open));
  await page.keyboard.type('frost');
  await page.keyboard.press('Enter');
  await wait(200);
  ok('command palette runs the highlighted command', (await q(() => document.documentElement.getAttribute('data-mg-theme'))) === 'frost');

  // Toasts stack and cap at three.
  await q(() => { for (let i = 0; i < 5; i++) MaterialGlass.toast('Toast ' + i); });
  ok('toasts cap at three', (await q(() => document.querySelector('.mg-toasts').children.length)) === 3);

  // Carousel builds dots and makes the track focusable.
  ok('carousel builds one dot per slide', (await q(() => document.querySelectorAll('.mg-carousel__dots .mg-segmented__item').length)) === 5);

  // Customization attributes change computed tokens.
  await q(() => document.documentElement.setAttribute('data-mg-density', 'dense'));
  ok('density changes control height', (await q(() => getComputedStyle(document.querySelector('.mg-btn')).minHeight)) === '36px');
  await q(() => document.documentElement.setAttribute('data-mg-transparency', 'reduced'));
  ok('reduced transparency removes backdrop blur', (await q(() => getComputedStyle(document.querySelector('.mg-card.mg-glass-2')).backdropFilter)) === 'none');
  await page.close();
} finally {
  await browser.close();
  await server.close();
}
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
