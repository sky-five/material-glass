/* Dashboard example: generated sample data, no network. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var range = 30;

  // Deterministic pseudo-random so the charts look the same on every load.
  function rng(seed) { return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }
  function series(n, base, drift, noise, seed) {
    var r = rng(seed), v = base, out = [];
    for (var i = 0; i < n; i++) { v += drift + (r() - 0.5) * noise; out.push(Math.max(1, v + Math.sin(i / 3.2) * noise * 0.6)); }
    return out;
  }

  function drawTrend() {
    var cur = series(range, 36, 0.35, 9, 7 + range);
    var prior = series(range, 33, 0.25, 8, 99 + range);
    var max = Math.max.apply(null, cur.concat(prior)) * 1.1;
    var W = 640, H = 240;
    var pt = function (v, i) { return [(i / (range - 1)) * W, H - (v / max) * H]; };
    var path = function (arr) { return arr.map(function (v, i) { var p = pt(v, i); return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' '); };
    var line = path(cur);
    var last = pt(cur[range - 1], range - 1);
    $('trend').innerHTML =
      '<defs><linearGradient id="db-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--mg-chart-1)" stop-opacity="0.4"/><stop offset="1" stop-color="var(--mg-chart-1)" stop-opacity="0"/></linearGradient></defs>' +
      [0.25, 0.5, 0.75].map(function (f) { return '<line class="grid" x1="0" x2="' + W + '" y1="' + H * f + '" y2="' + H * f + '"/>'; }).join('') +
      '<path class="area" d="' + line + ' L' + W + ' ' + H + ' L0 ' + H + 'Z"/>' +
      '<path class="prior" d="' + path(prior) + '"/>' +
      '<path class="line" d="' + line + '"/>' +
      '<circle class="dot" cx="' + last[0] + '" cy="' + last[1] + '" r="5"/>';
    var axis = $('trend-axis');
    axis.textContent = '';
    var now = new Date();
    for (var k = 0; k < 6; k++) {
      var d = new Date(now.getTime() - (range - 1 - Math.round(k * (range - 1) / 5)) * 864e5);
      var s = document.createElement('span');
      s.textContent = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      axis.appendChild(s);
    }
    $('trend').setAttribute('aria-label', 'Daily revenue over the last ' + range + ' days, rising from about $' + Math.round(cur[0]) + 'k to $' + Math.round(cur[range - 1]) + 'k per day');
  }

  var KPI = {
    7: { rev: '$298k', ord: '3,511', aov: '$84.90', ref: '1.7%', d: ['6.1% vs prior', '2.9%', '3.1%', '0.2 pts'] },
    30: { rev: '$1.28M', ord: '14,902', aov: '$85.90', ref: '1.9%', d: ['8.2% vs prior', '4.6%', '3.4%', '0.3 pts'] },
    90: { rev: '$3.71M', ord: '43,770', aov: '$84.76', ref: '2.1%', d: ['11.9% vs prior', '7.8%', '3.8%', '0.1 pts'] }
  };
  function kpis() {
    var k = KPI[range];
    ['rev', 'ord', 'aov', 'ref'].forEach(function (key, i) {
      document.querySelector('[data-kpi="' + key + '"]').textContent = k[key];
      document.querySelector('[data-delta="' + key + '"]').textContent = k.d[i];
      MaterialGlass.sparkline(document.querySelector('[data-spark="' + key + '"]'), series(16, 20, key === 'ref' ? -0.2 : 0.4, 4, i * 13 + range));
    });
  }

  var PRODUCTS = [
    ['Aurora desk lamp', 'Lighting', 1840, 128800, 42], ['Frost glass tumbler set', 'Kitchen', 3210, 89880, 38], ['Obsidian keyboard', 'Electronics', 912, 145920, 31],
    ['Ember throw blanket', 'Home', 1405, 77275, 46], ['Sand linen sheets', 'Bedroom', 1122, 134640, 51], ['Prism wall art', 'Decor', 640, 51200, 57],
    ['Sea glass vase', 'Decor', 2210, 66300, 49], ['Mono desk organiser', 'Office', 1980, 39600, 35]
  ];
  function table() {
    var body = $('products').tBodies[0];
    body.textContent = '';
    PRODUCTS.forEach(function (p, i) {
      var tr = document.createElement('tr');
      tr.innerHTML = '<td></td><td><span class="mg-badge mg-badge--plain"></span></td><td class="mg-table__num">' + p[2].toLocaleString() + '</td><td class="mg-table__num" data-sort="' + p[3] + '">$' + p[3].toLocaleString() + '</td><td class="mg-table__num">' + p[4] + '%</td><td class="db-trendcell"></td>';
      tr.cells[0].textContent = p[0];
      tr.cells[1].firstChild.textContent = p[1];
      MaterialGlass.sparkline(tr.cells[5], series(12, 10, (i % 3) - 0.6, 3, i * 7));
      body.appendChild(tr);
    });
  }

  $('filter').addEventListener('input', function (e) {
    var q = e.target.value.toLowerCase();
    Array.prototype.forEach.call($('products').tBodies[0].rows, function (r) { r.hidden = q && r.textContent.toLowerCase().indexOf(q) < 0; });
  });
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-range]');
    if (b) { range = +b.getAttribute('data-range'); drawTrend(); kpis(); }
    var t = e.target.closest('[data-toggle]');
    if (t) t.setAttribute('aria-pressed', String(t.getAttribute('aria-pressed') !== 'true'));
  });
  $('open-filters').addEventListener('click', function () { $('filters').showModal(); });
  $('export').addEventListener('click', function () {
    var rows = [['Product', 'Category', 'Units', 'Revenue', 'Margin %']].concat(PRODUCTS.map(function (p) { return p; }));
    var csv = rows.map(function (r) { return r.map(function (c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(','); }).join('\n');
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'top-products.csv';
    a.click();
    MaterialGlass.toast('Exported top-products.csv');
  });

  drawTrend();
  kpis();
  table();
})();
