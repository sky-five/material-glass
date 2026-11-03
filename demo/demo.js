/* Overview page behaviour. Not part of the library. Theme controls live in demo/controls.js. */
(function () {
  'use strict';
  var html = document.documentElement;
  function css(name) { return getComputedStyle(html).getPropertyValue(name).trim(); }

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
    if (!roles) return;
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
  if (window.MGDemo) MGDemo.onChange(renderPalette);

  /* Small interactions */
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-toggle]');
    if (t) t.setAttribute('aria-pressed', String(t.getAttribute('aria-pressed') !== 'true'));
    var s = e.target.closest('[data-toggle-switch]');
    if (s) s.setAttribute('aria-checked', String(s.getAttribute('aria-checked') !== 'true'));
    var d = e.target.closest('[data-open-dialog]');
    if (d) { var dlg = document.getElementById(d.getAttribute('data-open-dialog') || 'demo-dialog'); if (dlg && dlg.showModal) dlg.showModal(); }
    var sn = e.target.closest('[data-show-snack]');
    if (sn && window.MaterialGlass) MaterialGlass.toast(sn.getAttribute('data-show-snack') || 'Design review moved to Thursday', { action: 'Undo' });
  });

  document.querySelectorAll('[data-copy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var code = btn.parentNode.querySelector('code').textContent;
      if (navigator.clipboard) navigator.clipboard.writeText(code).then(function () {
        btn.setAttribute('aria-label', 'Copied');
        if (window.MaterialGlass) MaterialGlass.toast('Copied to clipboard');
        setTimeout(function () { btn.setAttribute('aria-label', 'Copy code'); }, 1600);
      });
    });
  });

  renderPalette();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (window.MaterialGlass) MaterialGlass.refresh(); });
})();
