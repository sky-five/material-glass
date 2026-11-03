/* Settings example: the screen's own switches restyle it through Material Glass data attributes. */
(function () {
  'use strict';
  var app = document.getElementById('app');
  var DEFAULTS = { glass: 'frosted', density: 'comfortable', shape: 'soft', motion: 'standard' };
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-app]');
    if (b) {
      var k = b.getAttribute('data-app'), v = b.getAttribute('data-v');
      // Set on <body> so dialogs and the scene follow too.
      if (v === DEFAULTS[k]) document.body.removeAttribute('data-mg-' + k); else document.body.setAttribute('data-mg-' + k, v);
      requestAnimationFrame(function () { MaterialGlass.refresh(); });
    }
    var sw = e.target.closest('[data-sw]');
    if (sw) {
      var on = sw.getAttribute('aria-checked') !== 'true';
      sw.setAttribute('aria-checked', String(on));
      MaterialGlass.toast(sw.getAttribute('aria-label') + (on ? ' on' : ' off'));
    }
    var chip = e.target.closest('[data-chip]');
    if (chip) chip.setAttribute('aria-pressed', String(chip.getAttribute('aria-pressed') !== 'true'));
    var open = e.target.closest('[data-open]');
    if (open) document.getElementById(open.getAttribute('data-open')).showModal();
  });
  document.getElementById('clear-dlg').addEventListener('close', function () {
    if (this.returnValue === 'clear') MaterialGlass.toast('History cleared', { action: 'Undo' });
  });
  var size = document.getElementById('text-size');
  size.addEventListener('input', function () { app.style.setProperty('--st-text', size.value + 'px'); });
})();
