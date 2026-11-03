/* Demo site: shared top-bar controls (theme menu, mode, glass, customize panel). Not part of the library. */
(function () {
  'use strict';
  var html = document.documentElement;
  var THEMES = window.MG_THEMES || [];
  var listeners = [];
  var CUSTOM = { glass: 'frosted', density: 'comfortable', shape: 'soft', motion: 'standard', font: 'default' };

  function get(k) {
    if (k === 'theme') return html.getAttribute('data-mg-theme') || 'sea-glass';
    if (k === 'mode') return html.getAttribute('data-mg-mode') || 'auto';
    return html.getAttribute('data-mg-' + k) || CUSTOM[k];
  }
  function isDark() {
    var m = html.getAttribute('data-mg-mode');
    return m === 'dark' || (!m && window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches);
  }
  function save() {
    var s = { reduced: html.getAttribute('data-mg-transparency') === 'reduced' };
    ['theme', 'mode'].concat(Object.keys(CUSTOM)).forEach(function (k) { s[k] = get(k); });
    // Only remember real themes (the builder previews under a temporary name).
    if (!THEMES.some(function (t) { return t.id === s.theme; })) { try { s.theme = JSON.parse(localStorage.getItem('mg-demo') || '{}').theme; } catch (e) { delete s.theme; } }
    try { localStorage.setItem('mg-demo', JSON.stringify(s)); } catch (e) {}
  }
  function set(k, v) {
    if (k === 'theme') html.setAttribute('data-mg-theme', v);
    else if (k === 'mode') { if (v === 'auto') html.removeAttribute('data-mg-mode'); else html.setAttribute('data-mg-mode', v); }
    else if (v === CUSTOM[k]) html.removeAttribute('data-mg-' + k);
    else html.setAttribute('data-mg-' + k, v);
    changed();
  }
  function changed() {
    requestAnimationFrame(function () {
      sync();
      save();
      if (window.MaterialGlass) MaterialGlass.refresh();
      listeners.forEach(function (fn) { fn(); });
    });
  }

  /* Theme menu */
  var menu = document.getElementById('theme-menu');
  if (menu) {
    THEMES.forEach(function (t) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'mg-menu__item';
      b.setAttribute('role', 'menuitemradio');
      b.dataset.theme = t.id;
      var sw = document.createElement('span');
      sw.className = 'mg-menu__swatch';
      var text = document.createElement('span');
      text.className = 'theme-item';
      var name = document.createElement('b');
      name.textContent = t.label;
      var desc = document.createElement('small');
      desc.textContent = t.description.split('.')[0];
      text.appendChild(name);
      text.appendChild(desc);
      b.appendChild(sw);
      b.appendChild(text);
      b.addEventListener('click', function () { set('theme', t.id); });
      menu.appendChild(b);
    });
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-set]');
    if (b) set(b.getAttribute('data-set'), b.getAttribute('data-value'));
    if (e.target.closest('[data-reset-custom]')) {
      Object.keys(CUSTOM).forEach(function (k) { html.removeAttribute('data-mg-' + k); });
      changed();
    }
  });
  document.querySelectorAll('[data-set-select]').forEach(function (sel) {
    sel.addEventListener('change', function () { set(sel.getAttribute('data-set-select'), sel.value); });
  });
  var glassSwitch = document.getElementById('glass-switch');
  if (glassSwitch) glassSwitch.addEventListener('click', function () {
    if (html.getAttribute('data-mg-transparency') === 'reduced') html.removeAttribute('data-mg-transparency');
    else html.setAttribute('data-mg-transparency', 'reduced');
    changed();
  });
  if (window.matchMedia) matchMedia('(prefers-color-scheme: dark)').addEventListener('change', changed);

  function sync() {
    var theme = get('theme');
    var t = THEMES.filter(function (x) { return x.id === theme; })[0];
    var dark = isDark();
    document.querySelectorAll('[data-theme-name]').forEach(function (el) { el.textContent = t ? t.label : theme; });
    document.querySelectorAll('#theme-menu [data-theme]').forEach(function (b) {
      var th = THEMES.filter(function (x) { return x.id === b.dataset.theme; })[0];
      var m = dark ? th.dark : th.light;
      b.querySelector('.mg-menu__swatch').style.background = 'conic-gradient(from 200deg, ' + m.primary + ', ' + m.tertiary + ', ' + m.scene[1] + ', ' + m.primary + ')';
      b.setAttribute('aria-checked', String(b.dataset.theme === theme));
    });
    document.querySelectorAll('[data-set]').forEach(function (b) {
      var on = get(b.getAttribute('data-set')) === b.getAttribute('data-value');
      if (b.getAttribute('role') === 'menuitemradio') b.setAttribute('aria-checked', String(on));
      else b.setAttribute('aria-pressed', String(on));
    });
    document.querySelectorAll('[data-set-select]').forEach(function (sel) { sel.value = get(sel.getAttribute('data-set-select')); });
    if (glassSwitch) glassSwitch.setAttribute('aria-checked', String(html.getAttribute('data-mg-transparency') !== 'reduced'));
    var dot = document.querySelector('.theme-btn__dot');
    if (dot && t) { var m2 = dark ? t.dark : t.light; dot.style.background = 'conic-gradient(from 200deg, ' + m2.primary + ', ' + m2.tertiary + ', ' + m2.scene[1] + ', ' + m2.primary + ')'; }
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', getComputedStyle(html).getPropertyValue('--mg-scene-base').trim());
    var customized = Object.keys(CUSTOM).some(function (k) { return html.hasAttribute('data-mg-' + k); });
    document.querySelectorAll('[data-customized-dot]').forEach(function (el) { el.hidden = !customized; });
  }

  window.MGDemo = { onChange: function (fn) { listeners.push(fn); }, set: set, get: get, isDark: isDark };
  sync();
})();
