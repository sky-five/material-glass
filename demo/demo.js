/* Demo-site behaviour. Not part of the library. */
(function () {
  'use strict';
  var html = document.documentElement;
  var THEME_NAMES = { 'sea-glass': 'Sea Glass', prism: 'Prism' };

  function css(name) { return getComputedStyle(html).getPropertyValue(name).trim(); }
  function save() {
    try {
      localStorage.setItem('mg-demo', JSON.stringify({
        theme: html.getAttribute('data-mg-theme'),
        mode: html.getAttribute('data-mg-mode') || 'auto',
        reduced: html.getAttribute('data-mg-transparency') === 'reduced'
      }));
    } catch (e) {}
  }

  /* Theme controls */
  function syncControls() {
    var theme = html.getAttribute('data-mg-theme') || 'sea-glass';
    var mode = html.getAttribute('data-mg-mode') || 'auto';
    document.querySelectorAll('[data-theme]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.theme === theme)); });
    document.querySelectorAll('[data-mode]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.mode === mode)); });
    document.querySelectorAll('[data-theme-name]').forEach(function (el) { el.textContent = THEME_NAMES[theme] || theme; });
    document.getElementById('glass-switch').setAttribute('aria-checked', String(html.getAttribute('data-mg-transparency') !== 'reduced'));
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', css('--mg-scene-base'));
  }
  document.querySelectorAll('[data-theme]').forEach(function (b) {
    b.addEventListener('click', function () { MaterialGlass.setTheme(b.dataset.theme); afterThemeChange(); });
  });
  document.querySelectorAll('[data-mode]').forEach(function (b) {
    b.addEventListener('click', function () { MaterialGlass.setTheme(null, b.dataset.mode); afterThemeChange(); });
  });
  document.getElementById('glass-switch').addEventListener('click', function () {
    if (html.getAttribute('data-mg-transparency') === 'reduced') html.removeAttribute('data-mg-transparency');
    else html.setAttribute('data-mg-transparency', 'reduced');
    afterThemeChange();
  });
  if (window.matchMedia) window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () { afterThemeChange(); });

  /* Live palette, read from the CSS so it can never drift from the tokens */
  var ROLES = [
    ['primary', 'on-primary'], ['on-primary', 'primary'], ['primary-container', 'on-primary-container'], ['on-primary-container', 'primary-container'],
    ['secondary', 'on-secondary'], ['on-secondary', 'secondary'], ['secondary-container', 'on-secondary-container'], ['on-secondary-container', 'secondary-container'],
    ['tertiary', 'on-tertiary'], ['on-tertiary', 'tertiary'], ['tertiary-container', 'on-tertiary-container'], ['on-tertiary-container', 'tertiary-container'],
    ['surface', 'on-surface'], ['on-surface', 'surface'], ['surface-container-high', 'on-surface'], ['outline', 'surface']
  ];
  var TONES = ['0', '10', '20', '30', '40', '50', '60', '70', '80', '90', '95', '99', '100'];
  var PALETTES = ['primary', 'secondary', 'tertiary', 'neutral', 'error'];
  var label = function (s) { return s.replace(/-/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); }); };

  function renderPalette() {
    var roles = document.getElementById('roles');
    roles.textContent = '';
    ROLES.forEach(function (r) {
      var cell = document.createElement('div');
      cell.className = 'role';
      cell.style.background = 'var(--mg-' + r[0] + ')';
      cell.style.color = 'var(--mg-' + r[1] + ')';
      var b = document.createElement('b');
      b.textContent = label(r[0]);
      var code = document.createElement('code');
      code.textContent = css('--mg-' + r[0]);
      cell.appendChild(b);
      cell.appendChild(code);
      roles.appendChild(cell);
    });

    var tonal = document.getElementById('tonal');
    tonal.textContent = '';
    PALETTES.forEach(function (p) {
      var row = document.createElement('div');
      row.className = 'tonal__row';
      var name = document.createElement('span');
      name.className = 'tonal__name';
      name.textContent = label(p);
      var strip = document.createElement('div');
      strip.className = 'tonal__strip';
      strip.setAttribute('role', 'img');
      strip.setAttribute('aria-label', label(p) + ' tonal palette, tones 0 to 100');
      TONES.forEach(function (t) {
        var tone = document.createElement('span');
        tone.className = 'tone';
        tone.style.background = 'var(--mg-ref-' + p + '-' + t + ')';
        tone.style.color = Number(t) < 60 ? '#FFFFFF' : '#111111';
        tone.textContent = t;
        tone.title = p + ' ' + t + ' · ' + css('--mg-ref-' + p + '-' + t);
        strip.appendChild(tone);
      });
      row.appendChild(name);
      row.appendChild(strip);
      tonal.appendChild(row);
    });

    document.querySelectorAll('[data-hex-of]').forEach(function (el) { el.textContent = css('--mg-' + el.dataset.hexOf); });
  }

  function afterThemeChange() {
    requestAnimationFrame(function () { syncControls(); renderPalette(); MaterialGlass.refresh(); save(); });
  }

  /* Small interactions */
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-toggle]');
    if (t) t.setAttribute('aria-pressed', String(t.getAttribute('aria-pressed') !== 'true'));
    var s = e.target.closest('[data-toggle-switch]');
    if (s) s.setAttribute('aria-checked', String(s.getAttribute('aria-checked') !== 'true'));
  });

  var dialog = document.getElementById('demo-dialog');
  document.querySelector('[data-open-dialog]').addEventListener('click', function () {
    if (dialog.showModal) dialog.showModal();
  });

  var snack = document.getElementById('snack');
  var slot = snack.parentNode;
  var snackTimer;
  function hideSnack() { slot.classList.remove('is-open'); clearTimeout(snackTimer); }
  document.querySelector('[data-show-snack]').addEventListener('click', function () {
    snack.hidden = false;
    requestAnimationFrame(function () { slot.classList.add('is-open'); });
    clearTimeout(snackTimer);
    snackTimer = setTimeout(hideSnack, 4000);
  });
  document.querySelector('[data-hide-snack]').addEventListener('click', hideSnack);

  document.querySelectorAll('[data-copy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var code = btn.parentNode.querySelector('code').textContent;
      if (navigator.clipboard) navigator.clipboard.writeText(code).then(function () {
        btn.setAttribute('aria-label', 'Copied');
        setTimeout(function () { btn.setAttribute('aria-label', 'Copy code'); }, 1600);
      });
    });
  });

  syncControls();
  renderPalette();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { MaterialGlass.refresh(); });
})();
