/* Docs site behaviour: current page, search, copy buttons, active section. Not part of the library. */
(function () {
  'use strict';
  var page = window.MG_DOCS_PAGE;
  document.querySelectorAll('.d-nav [data-slug]').forEach(function (a) { if (a.getAttribute('data-slug') === page) a.setAttribute('aria-current', 'page'); });

  // Search
  var input = document.getElementById('doc-search');
  var results = document.getElementById('doc-results');
  var index = window.MG_DOCS_INDEX || [];
  function search() {
    var q = input.value.trim().toLowerCase();
    results.textContent = '';
    if (q.length < 2) { results.hidden = true; return; }
    var words = q.split(/\s+/);
    var hits = index.map(function (e) {
      var hay = (e.heading + ' ' + e.text).toLowerCase();
      var score = words.reduce(function (s, w) { return s + (e.heading.toLowerCase().indexOf(w) >= 0 ? 3 : 0) + (hay.indexOf(w) >= 0 ? 1 : 0); }, 0);
      var all = words.every(function (w) { return hay.indexOf(w) >= 0; });
      return { e: e, score: all ? score : 0 };
    }).filter(function (h) { return h.score > 0; }).sort(function (a, b) { return b.score - a.score; }).slice(0, 8);
    results.hidden = false;
    if (!hits.length) { var none = document.createElement('div'); none.className = 'd-results__empty'; none.textContent = 'No matches'; results.appendChild(none); return; }
    hits.forEach(function (h) {
      var a = document.createElement('a');
      a.setAttribute('role', 'listitem');
      a.href = h.e.page + '.html' + (h.e.id ? '#' + h.e.id : '');
      a.textContent = h.e.heading;
      var s = document.createElement('small');
      s.textContent = h.e.title + ' · ' + h.e.text.slice(0, 80) + (h.e.text.length > 80 ? '…' : '');
      a.appendChild(s);
      results.appendChild(a);
    });
  }
  if (input) {
    input.addEventListener('input', search);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { var first = results.querySelector('a'); if (first) location.href = first.href; }
      if (e.key === 'Escape') { input.value = ''; search(); }
    });
    document.addEventListener('keydown', function (e) { if (e.key === '/' && document.activeElement === document.body) { e.preventDefault(); input.focus(); } });
  }

  // Copy code
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-copy-code]');
    if (!b || !navigator.clipboard) return;
    navigator.clipboard.writeText(b.parentNode.querySelector('code').textContent).then(function () { if (window.MaterialGlass) MaterialGlass.toast('Copied'); });
  });

  // Highlight the section in view
  var toc = Array.prototype.slice.call(document.querySelectorAll('.d-toc a'));
  if (toc.length && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) toc.forEach(function (a) { a.classList.toggle('is-active', a.getAttribute('href') === '#' + en.target.id); }); });
    }, { rootMargin: '-20% 0px -70% 0px' });
    document.querySelectorAll('.d-prose h2[id]').forEach(function (h) { io.observe(h); });
  }
})();
