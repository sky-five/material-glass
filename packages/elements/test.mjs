// Renders every element in a real browser and checks structure, ARIA and behaviour.
import { serve, launch } from '../../scripts/lib/browser.mjs';

const server = await serve();
const browser = await launch();
let failed = 0;
const check = (name, ok, extra = '') => { if (!ok) failed++; console.log(`${ok ? '✓' : '✗'} ${name}${ok ? '' : ' ' + extra}`); };
try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`${server.url}/packages/elements/test.html`, { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 400));
  const q = (fn) => page.evaluate(fn);

  check('no page errors', errors.length === 0, errors.join(' | '));
  check('mg-theme scopes theme attributes', await q(() => { const t = document.getElementById('theme'); return t.dataset.mgTheme === 'ember' && t.dataset.mgMode === 'dark'; }));
  check('mg-card gets card + glass classes and a heading', await q(() => { const c = document.getElementById('card'); return c.classList.contains('mg-card') && c.classList.contains('mg-glass-2') && c.querySelector('h3.mg-card__title').textContent === 'Elements'; }));
  check('mg-button renders a real submit button', await q(() => { const b = document.querySelector('#save > button'); return b && b.type === 'submit' && b.className === 'mg-btn' && b.textContent.includes('Save'); }));
  check('mg-button variants map to classes', await q(() => document.querySelector('#tonal > button').classList.contains('mg-btn--tonal')));
  check('mg-button with href renders a link', await q(() => document.querySelector('#link > a').getAttribute('href') === '#x'));
  check('mg-icon-button has a label', await q(() => document.querySelector('#fav > button').getAttribute('aria-label') === 'Favourite'));
  await page.click('#fav > button');
  check('mg-icon-button toggle flips pressed', await q(() => document.getElementById('fav').pressed && document.querySelector('#fav > button').getAttribute('aria-pressed') === 'true'));
  await page.click('#chip > button');
  check('mg-chip toggles selection', await q(() => document.getElementById('chip').selected && document.querySelector('#chip > button').getAttribute('aria-pressed') === 'true'));
  await page.click('#sw > button');
  check('mg-switch toggles and reports aria-checked', await q(() => document.getElementById('sw').checked && document.querySelector('#sw > button').getAttribute('aria-checked') === 'true'));
  check('mg-slider renders a range with fill', await q(() => { const i = document.querySelector('#sl input'); return i.type === 'range' && i.value === '4' && i.style.getPropertyValue('--mg-value') === '40%'; }));
  check('mg-text-field links supporting text', await q(() => { const i = document.querySelector('#tf input'); return i.type === 'email' && i.value === 'a@b.co' && document.getElementById(i.getAttribute('aria-describedby')).textContent === 'We never share it'; }));
  check('mg-text-field error sets aria-invalid', await q(() => document.querySelector('#tf2 input').getAttribute('aria-invalid') === 'true'));
  check('form data includes switch, slider and field', await q(() => { const d = new FormData(document.getElementById('form')); return d.get('wifi') === 'on' && d.get('level') === '4' && d.get('email') === 'a@b.co'; }));
  check('mg-segmented reflects value', await q(() => document.querySelector('#seg [data-value="week"]').getAttribute('aria-pressed') === 'true'));
  await page.click('#seg [data-value="month"]');
  check('mg-segmented click updates value', await q(() => document.getElementById('seg').value === 'month'));
  check('mg-tabs wires tabs to panels', await q(() => { const t = document.querySelector('#tabs [role="tab"]'); return t.getAttribute('aria-controls') === 'p1' && t.getAttribute('aria-selected') === 'true' && document.getElementById('p2').hidden; }));
  check('mg-nav renders a liquid nav with real items', await q(() => { const n = document.querySelector('#nav > nav'); return n.classList.contains('mg-nav') && n.querySelectorAll(':scope > .mg-nav__item').length === 2 && n.querySelector('[aria-current="page"]'); }));
  check('liquid indicator attached by material-glass.js', await q(() => !!document.querySelector('#nav .mg-liquid__indicator')));
  check('mg-fab without text is round with a label', await q(() => { const b = document.querySelector('#fab > button'); return b.classList.contains('mg-fab') && !b.classList.contains('mg-fab--extended') && b.getAttribute('aria-label') === 'Create'; }));
  await q(() => document.getElementById('dlg').show());
  check('mg-dialog opens as a modal', await q(() => document.querySelector('#dlg dialog').open && document.querySelector('#dlg .mg-dialog__title').textContent === 'Discard?'));
  await page.click('#dlg .mg-dialog__actions button');
  check('mg-dialog closes and reports the return value', await q(() => !document.querySelector('#dlg dialog').open && !document.getElementById('dlg').hasAttribute('open')));
} finally {
  await browser.close();
  await server.close();
}
process.exit(failed ? 1 : 0);
