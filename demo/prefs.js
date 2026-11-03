/* Demo site: restore saved look before first paint. Load synchronously in <head>. Not part of the library. */
(function () {
  var html = document.documentElement;
  var KEYS = ['theme', 'mode', 'glass', 'density', 'shape', 'motion', 'font'];
  var s = {};
  try { s = JSON.parse(localStorage.getItem('mg-demo') || '{}'); } catch (e) {}
  var q = new URLSearchParams(location.search);
  KEYS.forEach(function (k) {
    var v = q.get(k) || s[k];
    if (!v) return;
    if (k === 'mode' && v === 'auto') { html.removeAttribute('data-mg-mode'); return; }
    if ((k === 'glass' && v === 'frosted') || (k === 'density' && v === 'comfortable') || (k === 'shape' && v === 'soft') || (k === 'motion' && v === 'standard') || (k === 'font' && v === 'default')) { html.removeAttribute('data-mg-' + k); return; }
    html.setAttribute('data-mg-' + k, v);
  });
  if (q.get('reduced') === '1' || (s.reduced && q.get('reduced') !== '0')) html.setAttribute('data-mg-transparency', 'reduced');
})();
