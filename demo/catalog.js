/* Component catalog behaviour. Not part of the library. */
(function () {
  'use strict';
  var $ = function (s) { return document.querySelector(s); };

  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-toggle]');
    if (t) t.setAttribute('aria-pressed', String(t.getAttribute('aria-pressed') !== 'true'));
    var s = e.target.closest('[data-toggle-switch]');
    if (s) s.setAttribute('aria-checked', String(s.getAttribute('aria-checked') !== 'true'));
    var d = e.target.closest('[data-open-dialog]');
    if (d) { var dlg = document.getElementById(d.getAttribute('data-open-dialog')); if (dlg && dlg.showModal) dlg.showModal(); }
    var sn = e.target.closest('[data-show-snack]');
    if (sn) MaterialGlass.toast(sn.getAttribute('data-show-snack'));
    if (e.target.closest('[data-toast-undo]')) MaterialGlass.toast('Theme deleted', { action: 'Undo', onAction: function () { MaterialGlass.toast('Restored'); } });
    if (e.target.closest('[data-open-command]')) { var cmd = $('dialog[data-mg-command]'); if (cmd.__mgOpen) cmd.__mgOpen(); }
    var ct = e.target.closest('[data-cmd-theme]');
    if (ct && window.MGDemo) MGDemo.set('theme', ct.getAttribute('data-cmd-theme'));
    var radio = e.target.closest('[data-menu-radio]');
    if (radio) radio.parentNode.querySelectorAll('[data-menu-radio]').forEach(function (r) { r.setAttribute('aria-checked', String(r === radio)); });
    var ov = e.target.closest('[data-overlay]');
    if (ov) {
      var card = ov.closest('.mg-card');
      var o = document.createElement('div');
      o.className = 'mg-overlay';
      o.setAttribute('aria-busy', 'true');
      o.innerHTML = '<div class="mg-progress-circle is-indeterminate" role="progressbar" aria-label="Working"></div>';
      card.appendChild(o);
      setTimeout(function () { o.remove(); MaterialGlass.toast('Done'); }, 2000);
    }
  });

  // Character counter
  document.querySelectorAll('[data-counter]').forEach(function (ta) {
    var out = document.getElementById(ta.getAttribute('data-counter'));
    var sync = function () { out.textContent = ta.value.length + '/' + ta.maxLength; };
    ta.addEventListener('input', sync);
    sync();
  });

  // Sparklines
  document.querySelectorAll('[data-spark]').forEach(function (el) {
    MaterialGlass.sparkline(el, el.getAttribute('data-spark').split(',').map(Number));
  });

  // Calendar: November 2026, weeks start Monday
  var cal = document.getElementById('cat-calendar');
  if (cal) {
    var events = { 4: ['Design review', 1], 9: ['Token freeze', 2], 12: ['v0.2 release', 1], 13: ['Launch posts', 3], 19: ['Figma export', 2], 25: ['Retro', 3] };
    ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].forEach(function (d) { var h = document.createElement('div'); h.className = 'mg-calendar__dow'; h.textContent = d; cal.appendChild(h); });
    var first = new Date(2026, 10, 1);
    var start = new Date(2026, 10, 1 - ((first.getDay() + 6) % 7));
    for (var i = 0; i < 35; i++) {
      var day = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      var cell = document.createElement('div');
      cell.className = 'mg-calendar__cell';
      if (day.getMonth() !== 10) cell.classList.add('is-outside');
      if (day.getMonth() === 10 && day.getDate() === 2) cell.classList.add('is-today');
      var num = document.createElement('span');
      num.className = 'mg-calendar__date';
      num.textContent = day.getDate();
      cell.appendChild(num);
      var ev = day.getMonth() === 10 && events[day.getDate()];
      if (ev) { var tag = document.createElement('span'); tag.className = 'mg-calendar__event' + (ev[1] > 1 ? ' mg-calendar__event--' + ev[1] : ''); tag.textContent = ev[0]; cell.appendChild(tag); }
      cal.appendChild(cell);
    }
  }

  // Section index follows scroll
  var links = Array.prototype.slice.call(document.querySelectorAll('.catalog__nav a'));
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (a) { a.classList.toggle('is-active', a.getAttribute('href') === '#' + en.target.id); });
      });
    }, { rootMargin: '-30% 0px -60% 0px' });
    document.querySelectorAll('.cat-section').forEach(function (s) { io.observe(s); });
  }
})();
