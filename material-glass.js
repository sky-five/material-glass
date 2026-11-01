/*!
 * Material Glass v0.1.0 · optional enhancements · MIT
 * https://github.com/sky-five/material-glass
 *
 *  [data-mg-refract]     Edge refraction: the backdrop bends at the rim like a real lens.
 *                        Chromium only (needs SVG filters in backdrop-filter). Elsewhere the
 *                        element keeps its normal frosted blur. Value = strength in px (default 28).
 *                        data-mg-bezel = width of the bending edge in px (default 16).
 *                        data-mg-magnify = lens zoom across the face, 0 to 0.5 (default 0).
 *  [data-mg-liquid]      On a .mg-nav, .mg-rail or .mg-segmented: the selection pill flows
 *                        between items like a drop. "manual" = you set aria-* yourself.
 *  [data-mg-draggable]   Pointer-draggable inside its offset parent (used by .mg-lens).
 *  input.mg-slider       Keeps the filled track in sync with the value.
 *
 * Everything degrades to plain CSS. Respects prefers-reduced-motion.
 */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  var SVGNS = 'http://www.w3.org/2000/svg';
  var uid = 0;

  /* ─────────── Refraction ─────────── */

  function supportsRefraction() {
    var brands = navigator.userAgentData && navigator.userAgentData.brands;
    if (brands && brands.some(function (b) { return /Chromium/.test(b.brand); })) return true;
    return /Chrome\/\d+/.test(navigator.userAgent) && !/Edge\/1\d|OPR\/[0-5]\d/.test(navigator.userAgent);
  }

  var defs = null;
  function getDefs() {
    if (defs) return defs;
    var svg = document.createElementNS(SVGNS, 'svg');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('width', '0');
    svg.setAttribute('height', '0');
    svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none';
    defs = document.createElementNS(SVGNS, 'defs');
    svg.appendChild(defs);
    document.body.appendChild(svg);
    return defs;
  }

  // Displacement map for a rounded rectangle. Red/green hold the x/y sample offset:
  // near the rim, pixels sample from further inside, so the edge magnifies and bends
  // what is behind it. The interior is neutral (128,128) and stays undistorted.
  // `strength` is the max edge offset in px; `magnify` (0-0.5) adds a lens zoom across the face.
  // Returns { url, scale } where scale is the feDisplacementMap scale that decodes the map.
  function buildMap(w, h, radius, bezel, strength, magnify) {
    var canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    var ctx = canvas.getContext('2d');
    var img = ctx.createImageData(w, h);
    var d = img.data;
    var hw = w / 2, hh = h / 2;
    var r = Math.min(radius, hw, hh);
    var scale = strength + 2 * magnify * Math.max(hw, hh);
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        var px = x + 0.5 - hw, py = y + 0.5 - hh;
        var qx = Math.abs(px) - hw + r, qy = Math.abs(py) - hh + r;
        var ox = Math.max(qx, 0), oy = Math.max(qy, 0);
        var sd = Math.sqrt(ox * ox + oy * oy) + Math.min(Math.max(qx, qy), 0) - r; // < 0 inside
        var dist = -sd;
        var i = (y * w + x) * 4;
        var offX = 0, offY = 0;
        if (magnify && dist >= 0) { offX = -px * magnify; offY = -py * magnify; }
        if (dist >= 0 && dist < bezel) {
          var nx, ny;
          if (qx > 0 && qy > 0) {
            var len = Math.sqrt(ox * ox + oy * oy) || 1;
            nx = (ox / len) * Math.sign(px);
            ny = (oy / len) * Math.sign(py);
          } else if (qx > qy) { nx = Math.sign(px); ny = 0; }
          else { nx = 0; ny = Math.sign(py); }
          var t = 1 - dist / bezel;              // 1 at the rim, 0 where the flat face starts
          var m = t * t * (3 - 2 * t);            // smooth convex profile
          offX -= nx * m * strength / 2;          // sample inward (against the outward normal)
          offY -= ny * m * strength / 2;
        }
        d[i] = Math.max(0, Math.min(255, 128 + (offX / scale) * 255));
        d[i + 1] = Math.max(0, Math.min(255, 128 + (offY / scale) * 255));
        d[i + 2] = 128;
        d[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    return { url: canvas.toDataURL(), scale: scale };
  }

  function refract(el) {
    if (el.__mgRefract) return;
    var id = 'mg-refract-' + (++uid);
    var filter = document.createElementNS(SVGNS, 'filter');
    filter.setAttribute('id', id);
    filter.setAttribute('filterUnits', 'userSpaceOnUse');
    filter.setAttribute('primitiveUnits', 'userSpaceOnUse');
    filter.setAttribute('color-interpolation-filters', 'sRGB');
    filter.setAttribute('x', '0');
    filter.setAttribute('y', '0');
    var blur = document.createElementNS(SVGNS, 'feGaussianBlur');
    blur.setAttribute('in', 'SourceGraphic');
    blur.setAttribute('result', 'blurred');
    var image = document.createElementNS(SVGNS, 'feImage');
    image.setAttribute('x', '0');
    image.setAttribute('y', '0');
    image.setAttribute('preserveAspectRatio', 'none');
    image.setAttribute('result', 'map');
    var disp = document.createElementNS(SVGNS, 'feDisplacementMap');
    disp.setAttribute('in', 'blurred');
    disp.setAttribute('in2', 'map');
    disp.setAttribute('xChannelSelector', 'R');
    disp.setAttribute('yChannelSelector', 'G');
    disp.setAttribute('result', 'bent');
    // feDisplacementMap samples without interpolation; a sub-pixel blur hides the stair-steps.
    var smooth = document.createElementNS(SVGNS, 'feGaussianBlur');
    smooth.setAttribute('in', 'bent');
    smooth.setAttribute('stdDeviation', '0.6');
    smooth.setAttribute('result', 'smooth');
    var sat = document.createElementNS(SVGNS, 'feColorMatrix');
    sat.setAttribute('in', 'smooth');
    sat.setAttribute('type', 'saturate');
    filter.appendChild(blur);
    filter.appendChild(image);
    filter.appendChild(disp);
    filter.appendChild(smooth);
    filter.appendChild(sat);
    getDefs().appendChild(filter);

    var last = '';
    function update() {
      var w = Math.round(el.offsetWidth), h = Math.round(el.offsetHeight);
      if (!w || !h || w * h > 2500000) return;
      var cs = getComputedStyle(el);
      var radius = parseFloat(cs.borderTopLeftRadius) || 0;
      var bezel = parseFloat(el.getAttribute('data-mg-bezel')) || 16;
      var strength = parseFloat(el.getAttribute('data-mg-refract')) || 28;
      var magnify = Math.max(0, Math.min(0.5, parseFloat(el.getAttribute('data-mg-magnify')) || 0));
      var blurPx = parseFloat(cs.getPropertyValue('--_blur')) || 0;
      var satVal = parseFloat(cs.getPropertyValue('--mg-glass-saturate')) || 1.4;
      var key = [w, h, radius, bezel, strength, magnify, blurPx, satVal].join();
      if (key === last) return;
      last = key;
      var map = buildMap(w, h, radius, Math.min(bezel, w / 2, h / 2), strength, magnify);
      filter.setAttribute('width', w);
      filter.setAttribute('height', h);
      image.setAttribute('width', w);
      image.setAttribute('height', h);
      image.setAttribute('href', map.url);
      blur.setAttribute('stdDeviation', String(blurPx / 2));
      disp.setAttribute('scale', String(map.scale));
      sat.setAttribute('values', String(satVal));
      el.style.setProperty('-webkit-backdrop-filter', 'url(#' + id + ')');
      el.style.setProperty('backdrop-filter', 'url(#' + id + ')');
      el.classList.add('mg-refracting');
    }
    var queued = false;
    function schedule() {
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () { queued = false; update(); });
    }
    el.__mgRefract = { update: schedule };
    if (window.ResizeObserver) new ResizeObserver(schedule).observe(el);
    schedule();
  }

  /* ─────────── Liquid selection ─────────── */

  function isSelected(item) {
    var cur = item.getAttribute('aria-current');
    return (cur && cur !== 'false') || item.getAttribute('aria-selected') === 'true' || item.getAttribute('aria-pressed') === 'true';
  }

  function selectAttr(item) {
    if (item.hasAttribute('aria-current')) return 'aria-current';
    if (item.hasAttribute('aria-selected')) return 'aria-selected';
    if (item.hasAttribute('aria-pressed')) return 'aria-pressed';
    return item.classList.contains('mg-nav__item') ? 'aria-current' : 'aria-pressed';
  }

  function liquid(group) {
    if (group.__mgLiquid) return;
    var items = function () {
      return Array.prototype.filter.call(group.children, function (c) {
        return c.classList.contains('mg-nav__item') || c.classList.contains('mg-segmented__item');
      });
    };
    var pill = document.createElement('span');
    pill.className = 'mg-liquid__indicator';
    pill.setAttribute('aria-hidden', 'true');
    group.insertBefore(pill, group.firstChild);
    group.classList.add('mg-liquid-ready');

    var rect = null;
    function measure(item) {
      return { x: item.offsetLeft, y: item.offsetTop, w: item.offsetWidth, h: item.offsetHeight };
    }
    function place(r) {
      pill.style.width = r.w + 'px';
      pill.style.height = r.h + 'px';
      pill.style.transform = 'translate(' + r.x + 'px,' + r.y + 'px)';
      pill.style.opacity = '1';
    }
    function sync(animate) {
      var target = items().filter(isSelected)[0];
      if (!target) { pill.style.opacity = '0'; rect = null; return; }
      var next = measure(target);
      if (!animate || !rect || reduceMotion.matches || !pill.animate) { place(next); rect = next; return; }
      var a = rect, b = next;
      if (a.x === b.x && a.y === b.y && a.w === b.w) { place(b); return; }
      var horizontal = Math.abs(b.x - a.x) >= Math.abs(b.y - a.y);
      var mid;
      if (horizontal) {
        var mw = Math.max(a.w, b.w) + Math.abs(b.x - a.x) * 0.55;
        var mc = (a.x + a.w / 2 + b.x + b.w / 2) / 2;
        var mh = Math.max(a.h, b.h) * 0.84;
        mid = { x: mc - mw / 2, y: (a.y + b.y) / 2 + (Math.max(a.h, b.h) - mh) / 2, w: mw, h: mh };
      } else {
        var vh = Math.max(a.h, b.h) + Math.abs(b.y - a.y) * 0.55;
        var vc = (a.y + a.h / 2 + b.y + b.h / 2) / 2;
        var vw = Math.max(a.w, b.w) * 0.84;
        mid = { x: (a.x + b.x) / 2 + (Math.max(a.w, b.w) - vw) / 2, y: vc - vh / 2, w: vw, h: vh };
      }
      var frame = function (r, offset) {
        var f = { transform: 'translate(' + r.x + 'px,' + r.y + 'px)', width: r.w + 'px', height: r.h + 'px' };
        if (offset != null) f.offset = offset;
        return f;
      };
      place(b);
      pill.animate([frame(a), frame(mid, 0.42), frame(b)], { duration: 560, easing: 'cubic-bezier(.3,.7,.12,1)' });
      rect = b;
    }

    if (group.getAttribute('data-mg-liquid') !== 'manual') {
      group.addEventListener('click', function (e) {
        var item = e.target.closest && e.target.closest('.mg-nav__item, .mg-segmented__item');
        if (!item || item.parentNode !== group) return;
        var attr = selectAttr(item);
        items().forEach(function (i) {
          if (attr === 'aria-current') { if (i === item) i.setAttribute(attr, 'page'); else i.removeAttribute(attr); }
          else i.setAttribute(attr, i === item ? 'true' : 'false');
        });
      });
    }
    new MutationObserver(function () { sync(true); }).observe(group, { subtree: true, attributes: true, attributeFilter: ['aria-current', 'aria-selected', 'aria-pressed'] });
    if (window.ResizeObserver) new ResizeObserver(function () { sync(false); }).observe(group);
    group.__mgLiquid = { sync: sync };
    sync(false);
  }

  /* ─────────── Draggable ─────────── */

  function draggable(el) {
    if (el.__mgDrag) return;
    el.__mgDrag = true;
    var start = null;
    el.addEventListener('pointerdown', function (e) {
      if (e.button !== 0) return;
      el.setPointerCapture(e.pointerId);
      start = { x: e.clientX, y: e.clientY, l: el.offsetLeft, t: el.offsetTop };
      if (!reduceMotion.matches) {
        el.style.transition = 'transform 320ms cubic-bezier(.3,0,0,1.3)';
        el.style.transform = 'scale(1.06)';
      }
    });
    el.addEventListener('pointermove', function (e) {
      if (!start) return;
      var p = el.offsetParent || document.body;
      var l = Math.max(0, Math.min(p.clientWidth - el.offsetWidth, start.l + e.clientX - start.x));
      var t = Math.max(0, Math.min(p.clientHeight - el.offsetHeight, start.t + e.clientY - start.y));
      el.style.left = l + 'px';
      el.style.top = t + 'px';
      el.style.right = 'auto';
      el.style.bottom = 'auto';
    });
    var end = function () {
      if (!start) return;
      start = null;
      el.style.transition = 'transform 520ms cubic-bezier(.3,0,0,1.6)';
      el.style.transform = '';
    };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
  }

  /* ─────────── Slider ─────────── */

  function slider(input) {
    if (input.__mgSlider) return;
    input.__mgSlider = true;
    var set = function () {
      var min = parseFloat(input.min) || 0, max = parseFloat(input.max) || 100;
      var v = ((parseFloat(input.value) - min) / (max - min)) * 100;
      input.style.setProperty('--mg-value', v + '%');
    };
    input.addEventListener('input', set);
    set();
  }

  /* ─────────── API ─────────── */

  var canRefract = supportsRefraction();

  function init(root) {
    root = root || document;
    if (canRefract) Array.prototype.forEach.call(root.querySelectorAll('[data-mg-refract]'), refract);
    Array.prototype.forEach.call(root.querySelectorAll('[data-mg-liquid]'), liquid);
    Array.prototype.forEach.call(root.querySelectorAll('[data-mg-draggable]'), draggable);
    Array.prototype.forEach.call(root.querySelectorAll('input.mg-slider'), slider);
  }

  function refresh() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-mg-refract]'), function (el) { if (el.__mgRefract) el.__mgRefract.update(); });
    Array.prototype.forEach.call(document.querySelectorAll('[data-mg-liquid]'), function (el) { if (el.__mgLiquid) el.__mgLiquid.sync(false); });
  }

  function setTheme(theme, mode) {
    var html = document.documentElement;
    if (theme) html.setAttribute('data-mg-theme', theme);
    if (mode === 'auto') html.removeAttribute('data-mg-mode');
    else if (mode) html.setAttribute('data-mg-mode', mode);
    requestAnimationFrame(refresh);
  }

  window.MaterialGlass = { init: init, refresh: refresh, setTheme: setTheme, supportsRefraction: canRefract, version: '0.1.0' };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { init(); });
  else init();
})();
