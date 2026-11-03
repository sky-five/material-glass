/* Weather example: static sample data, no network. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var ICON = { clear: 'i-sun', clouds: 'i-cloud', rain: 'i-rain', night: 'i-moon' };
  var COND = {
    clear: { label: 'Clear and sunny', t: 17, hi: 19, lo: 8, feels: 17, hum: 41, wind: 9, deg: 160, uv: 6 },
    clouds: { label: 'Partly cloudy', t: 12, hi: 14, lo: 6, feels: 10, hum: 68, wind: 18, deg: 220, uv: 3 },
    rain: { label: 'Light rain', t: 9, hi: 11, lo: 6, feels: 6, hum: 91, wind: 26, deg: 250, uv: 1 },
    night: { label: 'Clear night', t: 5, hi: 14, lo: 3, feels: 2, hum: 74, wind: 7, deg: 300, uv: 0 }
  };
  var PLACES = { Toronto: 0, Lisbon: 7, Tokyo: 4, 'Reykjavík': -10 };
  var place = 'Toronto';
  var cond = 'clouds';
  var sky = document.querySelector('.wx-sky');

  function svg(id) { return '<svg aria-hidden="true"><use href="#' + id + '"/></svg>'; }

  function render() {
    var c = COND[cond];
    var off = PLACES[place];
    var t = c.t + off;
    sky.setAttribute('data-cond', cond);
    $('city').textContent = place;
    $('temp').textContent = t;
    $('cond').textContent = c.label;
    $('hi').textContent = (c.hi + off) + '°';
    $('lo').textContent = (c.lo + off) + '°';
    $('feels').textContent = (c.feels + off) + '°';
    $('hum').textContent = c.hum + '%';
    $('hum-ring').style.setProperty('--value', c.hum);
    $('hum-ring').setAttribute('aria-valuenow', c.hum);
    $('wind').textContent = c.wind + ' km/h';
    $('needle').style.setProperty('--deg', c.deg + 'deg');
    $('uv').textContent = c.uv;
    $('uv-dot').style.setProperty('--uv', Math.min(1, c.uv / 11));

    // Hourly
    var hours = $('hours');
    hours.textContent = '';
    for (var i = 0; i < 12; i++) {
      var h = (14 + i) % 24;
      var night = h >= 19 || h < 6;
      var kind = cond === 'rain' ? (i % 3 === 2 ? 'clouds' : 'rain') : night ? 'night' : cond === 'night' ? 'clear' : (i % 4 === 3 ? 'clouds' : cond);
      var li = document.createElement('li');
      if (i === 0) li.className = 'is-now';
      li.innerHTML = '<span>' + (i === 0 ? 'Now' : String(h).padStart(2, '0')) + '</span>' + svg(ICON[kind]) + '<b>' + Math.round(t - Math.sin(i / 3) * 3 - (night ? 2 : 0)) + '°</b>' + (kind === 'rain' ? '<small>' + (60 + i * 3) + '%</small>' : '<small>&nbsp;</small>');
      hours.appendChild(li);
    }

    // Daily
    var days = $('days');
    days.textContent = '';
    var names = ['Today', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon', 'Tue', 'Wed'];
    var kinds = [cond === 'night' ? 'clear' : cond, 'rain', 'clouds', 'clear', 'clear', 'clouds', 'rain', 'clouds', 'clear', 'clouds'];
    var min = 0, max = 26;
    names.forEach(function (n, i) {
      var lo = c.lo + off + Math.round(Math.sin(i) * 2);
      var hi = c.hi + off + Math.round(Math.cos(i / 2) * 3);
      var li = document.createElement('li');
      li.innerHTML = '<span>' + n + '</span>' + svg(ICON[kinds[i]]) + '<span class="lo">' + lo + '°</span><span class="wx-bar" aria-hidden="true"><i style="--a:' + ((lo - min + 10) / (max - min + 10) * 100) + '%;--b:' + ((hi - min + 10) / (max - min + 10) * 100) + '%"></i></span><span class="hi">' + hi + '°</span>';
      li.setAttribute('aria-label', n + ': ' + kinds[i] + ', low ' + lo + ', high ' + hi);
      days.appendChild(li);
    });

    var now = new Date();
    $('when').textContent = now.toLocaleDateString(undefined, { weekday: 'long' }) + ' · ' + now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest('.wx-switch [data-cond]');
    if (b) { cond = b.getAttribute('data-cond'); render(); }
    var p = e.target.closest('[data-place]');
    if (p) {
      place = p.getAttribute('data-place');
      document.querySelectorAll('[data-place]').forEach(function (x) { x.setAttribute('aria-checked', String(x === p)); });
      render();
      MaterialGlass.toast('Showing ' + place);
    }
    if (e.target.closest('#refresh')) { render(); MaterialGlass.toast('Updated just now'); }
  });

  render();
})();
