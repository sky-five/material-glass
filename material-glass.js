/*!
 * Material Glass v0.2.0 · optional enhancements · MIT
 * https://github.com/sky-five/material-glass
 *
 * Everything here is progressive: without this file the CSS still works.
 * Auto-initialises on load and on any element added to the page later.
 *
 *  Glass
 *   [data-mg-refract]          Edge refraction (Chromium). Value = strength px (default 28).
 *     data-mg-bezel            Width of the bending edge in px (default 16).
 *     data-mg-magnify          Lens zoom across the face, 0–0.5.
 *     data-mg-refract-profile  edge (default) | lens | ripple
 *     data-mg-chroma           Chromatic aberration at the rim, 0–1 (default 0).
 *   [data-mg-specular=pointer] Highlight follows the pointer.
 *   [data-mg-draggable]        Pointer-draggable inside its offset parent (.mg-lens).
 *
 *  Selection and navigation
 *   [data-mg-liquid]           Selection flows between items (.mg-nav, .mg-rail, .mg-segmented, .mg-tabs).
 *                              "manual" = you manage aria-* yourself.
 *   [role=tablist].mg-tabs     Arrow keys, and shows the tab's aria-controls panel.
 *   [data-mg-top-bar]          Adds .is-scrolled when content scrolls beneath it.
 *   [data-mg-sheet]            Drag the handle to dismiss a sheet <dialog>.
 *   [data-mg-carousel]         Builds dots that track scroll position.
 *   [data-mg-command]          Ctrl/⌘+K command palette with filtering and arrow keys.
 *
 *  Inputs
 *   [popover].mg-menu etc.     Anchored to the button that opened it, arrow-key navigation.
 *   [data-mg-combobox]         Filters a listbox as you type.
 *   [data-mg-datepicker]       Calendar. data-value="YYYY-MM-DD", data-range for ranges.
 *   [data-mg-timepicker]       Dial time picker. data-value="HH:MM", data-24h.
 *   [data-mg-stepper]          − / + around a number input.
 *   [data-mg-dropzone]         Drag-and-drop files onto a label with a file input.
 *   [data-mg-tag-input]        Enter or comma turns text into removable chips.
 *   .mg-range                  Keeps two-thumb sliders from crossing.
 *   input.mg-slider            Keeps the filled track in sync.
 *
 *  Data
 *   table[data-mg-sortable]    Click headers to sort. data-mg-resizable for column resize.
 *   [data-mg-split]            Resizable split pane (pointer and arrow keys).
 *   [data-mg-kanban]           Drag cards between .mg-kanban__col columns.
 *
 *  API: MaterialGlass.init(root) · refresh() · setTheme(theme, mode) · toast(msg, opts)
 *       sparkline(el, values) · chartTheme() · supportsRefraction · version
 */
(function () {
  'use strict';

  const doc = document;
  const html = doc.documentElement;
  const reduceMotion = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  const SVGNS = 'http://www.w3.org/2000/svg';
  let uid = 0;
  const $$ = (root, sel) => Array.from(root.querySelectorAll(sel));
  const cssVar = (el, name) => getComputedStyle(el).getPropertyValue(name).trim();
  const ms = (v, fallback) => { const n = parseFloat(v); return isNaN(n) ? fallback : /ms$/.test(v) ? n : /s$/.test(v) ? n * 1000 : n; };
  const once = (el, key) => { if (el[key]) return false; el[key] = true; return true; };
  const icon = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" d="${d}"/></svg>`;

  /* ══════════ Refraction ══════════ */

  function supportsRefraction() {
    const brands = navigator.userAgentData && navigator.userAgentData.brands;
    if (brands && brands.some((b) => /Chromium/.test(b.brand))) return true;
    return /Chrome\/\d+/.test(navigator.userAgent) && !/Edge\/1\d|OPR\/[0-5]\d/.test(navigator.userAgent);
  }

  let defs = null;
  function getDefs() {
    if (defs) return defs;
    const svg = doc.createElementNS(SVGNS, 'svg');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('width', '0');
    svg.setAttribute('height', '0');
    svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none';
    defs = doc.createElementNS(SVGNS, 'defs');
    svg.appendChild(defs);
    doc.body.appendChild(svg);
    return defs;
  }

  // Displacement map for a rounded rectangle. Red/green hold the x/y sample offset:
  // near the rim, pixels sample from further inside, so the edge bends what is behind it.
  // profile: edge = bend only at the rim; lens = rim + zoom; ripple = rim + gentle waves across the face.
  function buildMap(w, h, radius, bezel, strength, magnify, profile) {
    const canvas = doc.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    const img = ctx.createImageData(w, h);
    const d = img.data;
    const hw = w / 2, hh = h / 2;
    const r = Math.min(radius, hw, hh);
    const ripple = profile === 'ripple' ? Math.min(6, strength / 5) : 0;
    const scale = strength + 2 * magnify * Math.max(hw, hh) + 2 * ripple;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const px = x + 0.5 - hw, py = y + 0.5 - hh;
        const qx = Math.abs(px) - hw + r, qy = Math.abs(py) - hh + r;
        const ox = Math.max(qx, 0), oy = Math.max(qy, 0);
        const dist = -(Math.sqrt(ox * ox + oy * oy) + Math.min(Math.max(qx, qy), 0) - r);
        const i = (y * w + x) * 4;
        let offX = 0, offY = 0;
        if (dist >= 0) {
          if (magnify) { offX = -px * magnify; offY = -py * magnify; }
          if (ripple) { offX += Math.sin(py / 9) * ripple; offY += Math.sin(px / 11) * ripple; }
        }
        if (dist >= 0 && dist < bezel) {
          let nx, ny;
          if (qx > 0 && qy > 0) {
            const len = Math.sqrt(ox * ox + oy * oy) || 1;
            nx = (ox / len) * Math.sign(px);
            ny = (oy / len) * Math.sign(py);
          } else if (qx > qy) { nx = Math.sign(px); ny = 0; } else { nx = 0; ny = Math.sign(py); }
          const t = 1 - dist / bezel;
          const m = t * t * (3 - 2 * t);
          offX -= (nx * m * strength) / 2;
          offY -= (ny * m * strength) / 2;
        }
        d[i] = Math.max(0, Math.min(255, 128 + (offX / scale) * 255));
        d[i + 1] = Math.max(0, Math.min(255, 128 + (offY / scale) * 255));
        d[i + 2] = 128;
        d[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    return { url: canvas.toDataURL(), scale };
  }

  function fe(tag, attrs, parent) {
    const n = doc.createElementNS(SVGNS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }

  function refract(el) {
    if (!once(el, '__mgRefract')) return;
    const id = 'mg-refract-' + ++uid;
    const filter = fe('filter', { id, filterUnits: 'userSpaceOnUse', primitiveUnits: 'userSpaceOnUse', 'color-interpolation-filters': 'sRGB', x: 0, y: 0 }, getDefs());
    let last = '';
    function update() {
      const w = Math.round(el.offsetWidth), h = Math.round(el.offsetHeight);
      if (!w || !h || w * h > 2500000) return;
      const cs = getComputedStyle(el);
      const radius = parseFloat(cs.borderTopLeftRadius) || 0;
      const profile = el.getAttribute('data-mg-refract-profile') || 'edge';
      const bezel = parseFloat(el.getAttribute('data-mg-bezel')) || (profile === 'lens' ? 24 : 16);
      const strength = parseFloat(el.getAttribute('data-mg-refract')) || 28;
      let magnify = parseFloat(el.getAttribute('data-mg-magnify'));
      if (isNaN(magnify)) magnify = profile === 'lens' ? 0.12 : 0;
      magnify = Math.max(0, Math.min(0.5, magnify));
      const chroma = Math.max(0, Math.min(1, parseFloat(el.getAttribute('data-mg-chroma')) || 0));
      const blurPx = parseFloat(cs.getPropertyValue('--_blur')) || 0;
      const sat = parseFloat(cs.getPropertyValue('--mg-glass-saturate')) || 1.4;
      const key = [w, h, radius, bezel, strength, magnify, profile, chroma, blurPx, sat].join();
      if (key === last) return;
      last = key;
      const map = buildMap(w, h, radius, Math.min(bezel, w / 2, h / 2), strength, magnify, profile);
      filter.textContent = '';
      fe('feGaussianBlur', { in: 'SourceGraphic', stdDeviation: blurPx / 2, result: 'blurred' }, filter);
      fe('feImage', { x: 0, y: 0, width: w, height: h, preserveAspectRatio: 'none', href: map.url, result: 'map' }, filter);
      if (chroma > 0) {
        // Bend each colour channel by a slightly different amount, then add them back together.
        const spread = 0.12 * chroma;
        const chans = [['r', 1 - spread, '1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0'], ['g', 1, '0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0'], ['b', 1 + spread, '0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0']];
        chans.forEach(([c, k, matrix]) => {
          fe('feDisplacementMap', { in: 'blurred', in2: 'map', scale: map.scale * k, xChannelSelector: 'R', yChannelSelector: 'G', result: 'd' + c }, filter);
          fe('feColorMatrix', { in: 'd' + c, type: 'matrix', values: matrix, result: 'c' + c }, filter);
        });
        fe('feComposite', { in: 'cr', in2: 'cg', operator: 'arithmetic', k1: 0, k2: 1, k3: 1, k4: 0, result: 'rg' }, filter);
        fe('feComposite', { in: 'rg', in2: 'cb', operator: 'arithmetic', k1: 0, k2: 1, k3: 1, k4: 0, result: 'bent' }, filter);
      } else {
        fe('feDisplacementMap', { in: 'blurred', in2: 'map', scale: map.scale, xChannelSelector: 'R', yChannelSelector: 'G', result: 'bent' }, filter);
      }
      // feDisplacementMap samples without interpolation; a sub-pixel blur hides the stair-steps.
      fe('feGaussianBlur', { in: 'bent', stdDeviation: 0.6, result: 'smooth' }, filter);
      fe('feColorMatrix', { in: 'smooth', type: 'saturate', values: sat }, filter);
      filter.setAttribute('width', w);
      filter.setAttribute('height', h);
      el.style.setProperty('-webkit-backdrop-filter', `url(#${id})`);
      el.style.setProperty('backdrop-filter', `url(#${id})`);
      el.classList.add('mg-refracting');
    }
    let queued = false;
    const schedule = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => { queued = false; update(); });
    };
    el.__mgRefractUpdate = schedule;
    if (window.ResizeObserver) new ResizeObserver(schedule).observe(el);
    new MutationObserver(schedule).observe(el, { attributes: true, attributeFilter: ['data-mg-refract', 'data-mg-bezel', 'data-mg-magnify', 'data-mg-refract-profile', 'data-mg-chroma'] });
    schedule();
  }

  function pointerSpecular(el) {
    if (!once(el, '__mgSpec')) return;
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mg-px', ((e.clientX - r.left) / r.width) * 100 + '%');
      el.style.setProperty('--mg-py', ((e.clientY - r.top) / r.height) * 100 + '%');
    });
    el.addEventListener('pointerleave', () => { el.style.removeProperty('--mg-px'); el.style.removeProperty('--mg-py'); });
  }

  /* ══════════ Liquid selection ══════════ */

  const ITEM = '.mg-nav__item, .mg-segmented__item, .mg-tab';
  const isSelected = (item) => {
    const cur = item.getAttribute('aria-current');
    return (cur && cur !== 'false') || item.getAttribute('aria-selected') === 'true' || item.getAttribute('aria-pressed') === 'true';
  };
  const selectAttr = (item) => {
    for (const a of ['aria-current', 'aria-selected', 'aria-pressed']) if (item.hasAttribute(a)) return a;
    if (item.classList.contains('mg-tab')) return 'aria-selected';
    return item.classList.contains('mg-nav__item') ? 'aria-current' : 'aria-pressed';
  };

  function liquid(group) {
    if (!once(group, '__mgLiquidInit')) return;
    const items = () => Array.from(group.children).filter((c) => c.matches(ITEM));
    const underline = group.classList.contains('mg-tabs');
    const pill = doc.createElement('span');
    pill.className = 'mg-liquid__indicator';
    pill.setAttribute('aria-hidden', 'true');
    group.insertBefore(pill, group.firstChild);
    group.classList.add('mg-liquid-ready');

    let rect = null;
    const measure = (item) => {
      if (!underline) return { x: item.offsetLeft, y: item.offsetTop, w: item.offsetWidth, h: item.offsetHeight };
      const inset = group.classList.contains('mg-tabs--secondary') ? 0 : 12;
      return { x: item.offsetLeft + inset, y: item.offsetTop + item.offsetHeight - 3, w: item.offsetWidth - inset * 2, h: 3 };
    };
    const place = (r) => {
      pill.style.width = r.w + 'px';
      pill.style.height = r.h + 'px';
      pill.style.transform = `translate(${r.x}px,${r.y}px)`;
      pill.style.opacity = '1';
    };
    function sync(animate) {
      const target = items().filter(isSelected)[0];
      if (!target) { pill.style.opacity = '0'; rect = null; return; }
      const b = measure(target);
      const duration = ms(cssVar(group, '--mg-liquid-duration'), 560);
      const stretch = parseFloat(cssVar(group, '--mg-liquid-stretch')) || 0;
      if (!animate || !rect || reduceMotion.matches || !pill.animate || duration === 0) { place(b); rect = b; return; }
      const a = rect;
      if (a.x === b.x && a.y === b.y && a.w === b.w) { place(b); return; }
      let mid;
      if (Math.abs(b.x - a.x) >= Math.abs(b.y - a.y)) {
        const mw = Math.max(a.w, b.w) + Math.abs(b.x - a.x) * stretch;
        const mc = (a.x + a.w / 2 + b.x + b.w / 2) / 2;
        const mh = underline ? a.h : Math.max(a.h, b.h) * (1 - 0.3 * stretch);
        mid = { x: mc - mw / 2, y: (a.y + b.y) / 2 + (Math.max(a.h, b.h) - mh) / 2, w: mw, h: mh };
      } else {
        const vh = Math.max(a.h, b.h) + Math.abs(b.y - a.y) * stretch;
        const vc = (a.y + a.h / 2 + b.y + b.h / 2) / 2;
        const vw = Math.max(a.w, b.w) * (1 - 0.3 * stretch);
        mid = { x: (a.x + b.x) / 2 + (Math.max(a.w, b.w) - vw) / 2, y: vc - vh / 2, w: vw, h: vh };
      }
      const frame = (r, offset) => Object.assign({ transform: `translate(${r.x}px,${r.y}px)`, width: r.w + 'px', height: r.h + 'px' }, offset != null ? { offset } : {});
      place(b);
      pill.animate([frame(a), frame(mid, 0.42), frame(b)], { duration, easing: 'cubic-bezier(.3,.7,.12,1)' });
      rect = b;
    }

    if (group.getAttribute('data-mg-liquid') !== 'manual') {
      group.addEventListener('click', (e) => {
        const item = e.target.closest && e.target.closest(ITEM);
        if (!item || item.parentNode !== group || item.disabled) return;
        select(group, item);
      });
    }
    new MutationObserver(() => sync(true)).observe(group, { subtree: true, attributes: true, attributeFilter: ['aria-current', 'aria-selected', 'aria-pressed'] });
    if (window.ResizeObserver) new ResizeObserver(() => sync(false)).observe(group);
    group.__mgLiquid = { sync };
    sync(false);
  }

  function select(group, item) {
    const attr = selectAttr(item);
    Array.from(group.children).filter((c) => c.matches(ITEM)).forEach((i) => {
      if (attr === 'aria-current') { if (i === item) i.setAttribute(attr, 'page'); else i.removeAttribute(attr); }
      else i.setAttribute(attr, i === item ? 'true' : 'false');
    });
  }

  /* ══════════ Tabs ══════════ */

  function tabs(list) {
    if (!once(list, '__mgTabs')) return;
    const all = () => $$(list, '[role="tab"]');
    const show = () => all().forEach((t) => {
      t.tabIndex = t.getAttribute('aria-selected') === 'true' ? 0 : -1;
      const panel = t.getAttribute('aria-controls') && doc.getElementById(t.getAttribute('aria-controls'));
      if (panel) panel.hidden = t.getAttribute('aria-selected') !== 'true';
    });
    list.addEventListener('click', (e) => {
      const t = e.target.closest('[role="tab"]');
      if (!t || !list.contains(t)) return;
      if (!list.hasAttribute('data-mg-liquid')) all().forEach((x) => x.setAttribute('aria-selected', String(x === t)));
      requestAnimationFrame(show);
    });
    list.addEventListener('keydown', (e) => {
      const tabsArr = all();
      const i = tabsArr.indexOf(doc.activeElement);
      if (i < 0) return;
      let n = -1;
      if (e.key === 'ArrowRight') n = (i + 1) % tabsArr.length;
      else if (e.key === 'ArrowLeft') n = (i - 1 + tabsArr.length) % tabsArr.length;
      else if (e.key === 'Home') n = 0;
      else if (e.key === 'End') n = tabsArr.length - 1;
      if (n < 0) return;
      e.preventDefault();
      tabsArr[n].focus();
      tabsArr[n].click();
    });
    show();
  }

  /* ══════════ Top app bar ══════════ */

  function scrollParent(el) {
    for (let p = el.parentElement; p && p !== doc.body; p = p.parentElement) {
      const o = getComputedStyle(p).overflowY;
      if ((o === 'auto' || o === 'scroll') && p.scrollHeight > p.clientHeight) return p;
    }
    return window;
  }
  function topBar(bar) {
    if (!once(bar, '__mgTopBar')) return;
    const sp = scrollParent(bar);
    const check = () => bar.classList.toggle('is-scrolled', (sp === window ? window.scrollY : sp.scrollTop) > 2);
    sp.addEventListener('scroll', check, { passive: true });
    check();
  }

  /* ══════════ Popovers: menus, popovers, rich tooltips ══════════ */

  let lastInvoker = null;
  doc.addEventListener('pointerdown', (e) => { const b = e.target.closest && e.target.closest('[popovertarget]'); if (b) lastInvoker = b; }, true);
  doc.addEventListener('keydown', (e) => { const b = e.target.closest && e.target.closest('[popovertarget]'); if (b && (e.key === 'Enter' || e.key === ' ')) lastInvoker = b; }, true);

  function position(pop, anchor) {
    const a = anchor.getBoundingClientRect();
    const p = pop.getBoundingClientRect();
    const vw = innerWidth, vh = innerHeight, gap = 6;
    const align = pop.getAttribute('data-mg-align') || 'start';
    let top = a.bottom + gap;
    if (top + p.height > vh - 8 && a.top - gap - p.height > 8) top = a.top - gap - p.height;
    let left = align === 'end' ? a.right - p.width : align === 'center' ? a.left + a.width / 2 - p.width / 2 : a.left;
    left = Math.max(8, Math.min(vw - p.width - 8, left));
    top = Math.max(8, Math.min(vh - p.height - 8, top));
    pop.style.position = 'fixed';
    pop.style.top = top + 'px';
    pop.style.left = left + 'px';
    pop.style.setProperty('--mg-anchor-width', a.width + 'px');
  }

  const menuItems = (menu) => $$(menu, '.mg-menu__item, [role="menuitem"], [role="menuitemradio"], [role="menuitemcheckbox"], [role="option"]')
    .filter((i) => !i.disabled && i.getAttribute('aria-disabled') !== 'true' && !i.hidden && i.offsetParent !== null);

  function moveFocus(e, items) {
    const i = items.indexOf(doc.activeElement);
    let n = -1;
    if (e.key === 'ArrowDown') n = i < 0 ? 0 : (i + 1) % items.length;
    else if (e.key === 'ArrowUp') n = i < 0 ? items.length - 1 : (i - 1 + items.length) % items.length;
    else if (e.key === 'Home') n = 0;
    else if (e.key === 'End') n = items.length - 1;
    if (n < 0 || !items.length) return false;
    e.preventDefault();
    items[n].focus();
    return true;
  }

  function popover(pop) {
    if (!pop.hasAttribute('popover') || !once(pop, '__mgPop')) return;
    let anchor = null;
    const reposition = () => { if (anchor && pop.matches(':popover-open')) position(pop, anchor); };
    pop.addEventListener('toggle', (e) => {
      if (e.newState === 'open') {
        anchor = e.source || lastInvoker || doc.querySelector(`[popovertarget="${pop.id}"]`);
        if (anchor) { anchor.setAttribute('aria-expanded', 'true'); position(pop, anchor); }
        addEventListener('scroll', reposition, true);
        addEventListener('resize', reposition);
        if (pop.classList.contains('mg-menu') && pop.getAttribute('popover') !== 'manual') {
          const items = menuItems(pop);
          const current = items.find((i) => i.getAttribute('aria-checked') === 'true' || i.getAttribute('aria-current') === 'true');
          const target = current || items[0];
          if (target) target.focus({ preventScroll: true });
        }
      } else {
        if (anchor) anchor.setAttribute('aria-expanded', 'false');
        removeEventListener('scroll', reposition, true);
        removeEventListener('resize', reposition);
      }
    });
    if (pop.classList.contains('mg-menu')) {
      pop.addEventListener('keydown', (e) => {
        if (moveFocus(e, menuItems(pop))) return;
        if (e.key === 'Tab') pop.hidePopover();
      });
      pop.addEventListener('click', (e) => {
        const item = e.target.closest('.mg-menu__item');
        if (item && !item.hasAttribute('data-mg-keep-open') && pop.getAttribute('popover') !== 'manual') {
          pop.hidePopover();
          if (anchor) anchor.focus({ preventScroll: true });
        }
      });
    }
  }

  // Rich tooltips: data-mg-tooltip-target="id" opens that [popover] on hover/focus.
  function richTooltip(trigger) {
    if (!once(trigger, '__mgRich')) return;
    const pop = doc.getElementById(trigger.getAttribute('data-mg-tooltip-target'));
    if (!pop || !pop.showPopover) return;
    let t;
    const open = () => { clearTimeout(t); t = setTimeout(() => { lastInvoker = trigger; try { pop.showPopover(); } catch (_) {} }, 350); };
    const close = () => { clearTimeout(t); t = setTimeout(() => { try { pop.hidePopover(); } catch (_) {} }, 200); };
    trigger.addEventListener('pointerenter', open);
    trigger.addEventListener('pointerleave', close);
    trigger.addEventListener('focus', open);
    trigger.addEventListener('blur', close);
    pop.addEventListener('pointerenter', () => clearTimeout(t));
    pop.addEventListener('pointerleave', close);
    trigger.setAttribute('aria-describedby', pop.id);
  }

  /* ══════════ Combobox ══════════ */

  function combobox(box) {
    if (!once(box, '__mgCombo')) return;
    const input = box.querySelector('[role="combobox"]');
    const list = box.querySelector('[role="listbox"]');
    if (!input || !list) return;
    if (!list.hasAttribute('popover')) list.setAttribute('popover', 'manual');
    popover(list);
    const options = $$(list, '[role="option"]');
    options.forEach((o, i) => { if (!o.id) o.id = `mg-opt-${++uid}-${i}`; o.dataset.mgLabel = o.textContent.trim(); });
    let empty = list.querySelector('.mg-combobox__empty');
    if (!empty) { empty = doc.createElement('div'); empty.className = 'mg-combobox__empty'; empty.textContent = 'No matches'; list.appendChild(empty); }
    let active = -1;
    const visible = () => options.filter((o) => !o.hidden);
    const setActive = (i) => {
      const v = visible();
      options.forEach((o) => o.setAttribute('aria-selected', 'false'));
      active = v.length && i >= 0 ? i % v.length : -1;
      if (active >= 0) { v[active].setAttribute('aria-selected', 'true'); input.setAttribute('aria-activedescendant', v[active].id); v[active].scrollIntoView({ block: 'nearest' }); }
      else input.removeAttribute('aria-activedescendant');
    };
    const open = () => { if (!list.matches(':popover-open')) { lastInvoker = input.closest('.mg-field') || input; list.showPopover(); } input.setAttribute('aria-expanded', 'true'); };
    const close = () => { if (list.matches(':popover-open')) list.hidePopover(); input.setAttribute('aria-expanded', 'false'); active = -1; };
    const filter = () => {
      const q = input.value.trim().toLowerCase();
      options.forEach((o) => {
        const label = o.dataset.mgLabel;
        const at = label.toLowerCase().indexOf(q);
        o.hidden = !!q && at < 0;
        o.textContent = '';
        if (q && at >= 0) {
          o.append(label.slice(0, at));
          const m = doc.createElement('mark');
          m.textContent = label.slice(at, at + q.length);
          o.append(m, label.slice(at + q.length));
        } else o.textContent = label;
      });
      empty.hidden = visible().length > 0;
      setActive(q ? 0 : -1);
    };
    const choose = (o) => {
      input.value = o.dataset.mgLabel;
      close();
      input.dispatchEvent(new CustomEvent('mg-change', { bubbles: true, detail: { value: o.dataset.value || o.dataset.mgLabel } }));
    };
    input.addEventListener('input', () => { open(); filter(); });
    input.addEventListener('focus', () => { open(); filter(); });
    input.addEventListener('keydown', (e) => {
      const n = visible().length;
      if (e.key === 'ArrowDown') { e.preventDefault(); open(); setActive(active < 0 ? 0 : (active + 1) % n); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); open(); setActive(active <= 0 ? n - 1 : active - 1); }
      else if (e.key === 'Enter' && active >= 0) { e.preventDefault(); choose(visible()[active]); }
      else if (e.key === 'Escape') close();
    });
    list.addEventListener('pointerdown', (e) => e.preventDefault());
    list.addEventListener('click', (e) => { const o = e.target.closest('[role="option"]'); if (o) choose(o); });
    input.addEventListener('blur', () => setTimeout(close, 120));
  }

  /* ══════════ Date picker ══════════ */

  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const parseIso = (s) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || ''); return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null; };

  function datepicker(root) {
    if (!once(root, '__mgDate')) return;
    const langEl = root.closest('[lang]');
    const lang = (langEl && langEl.getAttribute('lang')) || navigator.language;
    const range = root.hasAttribute('data-range');
    let [start, end] = (root.getAttribute('data-value') || '').split('/').map(parseIso);
    const base = start || new Date();
    let view = new Date(base.getFullYear(), base.getMonth(), 1);
    let focusDate = base;
    const today = iso(new Date());
    const monthFmt = new Intl.DateTimeFormat(lang, { month: 'long', year: 'numeric' });
    const dayFmt = new Intl.DateTimeFormat(lang, { weekday: 'narrow' });
    const longFmt = new Intl.DateTimeFormat(lang, { dateStyle: 'full' });
    root.setAttribute('role', 'group');
    root.innerHTML = `<div class="mg-datepicker__head"><button type="button" class="mg-icon-btn" data-step="-1" aria-label="Previous month">${icon('M15 6l-6 6 6 6')}</button><p class="mg-datepicker__month" aria-live="polite"></p><button type="button" class="mg-icon-btn" data-step="1" aria-label="Next month">${icon('M9 6l6 6-6 6')}</button></div><div class="mg-datepicker__grid"></div>`;
    const grid = root.querySelector('.mg-datepicker__grid');
    const title = root.querySelector('.mg-datepicker__month');
    const weekStart = 1;
    function render(focus) {
      title.textContent = monthFmt.format(view);
      grid.textContent = '';
      for (let i = 0; i < 7; i++) {
        const dow = doc.createElement('span');
        dow.className = 'mg-datepicker__dow';
        dow.setAttribute('aria-hidden', 'true');
        dow.textContent = dayFmt.format(new Date(2024, 0, 1 + ((i + weekStart - 1) % 7)));
        grid.appendChild(dow);
      }
      const first = new Date(view);
      first.setDate(1 - ((first.getDay() - weekStart + 7) % 7));
      for (let i = 0; i < 42; i++) {
        const d = new Date(first.getFullYear(), first.getMonth(), first.getDate() + i);
        const b = doc.createElement('button');
        b.type = 'button';
        b.className = 'mg-datepicker__day';
        b.textContent = d.getDate();
        b.dataset.date = iso(d);
        b.setAttribute('aria-label', longFmt.format(d));
        if (d.getMonth() !== view.getMonth()) b.classList.add('is-outside');
        if (iso(d) === today) b.setAttribute('aria-current', 'date');
        const sel = (start && iso(d) === iso(start)) || (end && iso(d) === iso(end));
        b.setAttribute('aria-pressed', String(!!sel));
        if (range && start && end && d > start && d < end) b.classList.add('is-in-range');
        b.tabIndex = iso(d) === iso(focusDate) ? 0 : -1;
        grid.appendChild(b);
      }
      if (focus) { const f = grid.querySelector('[tabindex="0"]'); if (f) f.focus(); }
    }
    const go = (d, focus) => {
      focusDate = d;
      if (d.getMonth() !== view.getMonth() || d.getFullYear() !== view.getFullYear()) view = new Date(d.getFullYear(), d.getMonth(), 1);
      render(focus);
    };
    root.addEventListener('click', (e) => {
      const step = e.target.closest('[data-step]');
      if (step) { view.setMonth(view.getMonth() + +step.dataset.step); focusDate = new Date(view); render(false); return; }
      const day = e.target.closest('.mg-datepicker__day');
      if (!day) return;
      const d = parseIso(day.dataset.date);
      if (range && start && !end && d >= start) end = d;
      else { start = d; end = null; }
      const value = range ? [start, end].filter(Boolean).map(iso).join('/') : iso(start);
      root.setAttribute('data-value', value);
      go(d, true);
      root.dispatchEvent(new CustomEvent('mg-change', { bubbles: true, detail: { value, start, end } }));
    });
    grid.addEventListener('keydown', (e) => {
      const map = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
      const f = focusDate;
      const dow = (f.getDay() - weekStart + 7) % 7;
      let d = null;
      if (map[e.key]) d = new Date(f.getFullYear(), f.getMonth(), f.getDate() + map[e.key]);
      else if (e.key === 'PageUp') d = new Date(f.getFullYear(), f.getMonth() - 1, f.getDate());
      else if (e.key === 'PageDown') d = new Date(f.getFullYear(), f.getMonth() + 1, f.getDate());
      else if (e.key === 'Home') d = new Date(f.getFullYear(), f.getMonth(), f.getDate() - dow);
      else if (e.key === 'End') d = new Date(f.getFullYear(), f.getMonth(), f.getDate() + 6 - dow);
      if (!d) return;
      e.preventDefault();
      go(d, true);
    });
    render(false);
  }

  /* ══════════ Time picker ══════════ */

  function timepicker(root) {
    if (!once(root, '__mgTime')) return;
    const h24 = root.hasAttribute('data-24h');
    const parts = (root.getAttribute('data-value') || '09:00').split(':').map(Number);
    let hour = parts[0] || 0, minute = parts[1] || 0, mode = 'h';
    root.innerHTML = `<div class="mg-timepicker__display"><button type="button" class="mg-timepicker__part" data-part="h" aria-label="Hour"></button><span class="mg-timepicker__colon" aria-hidden="true">:</span><button type="button" class="mg-timepicker__part" data-part="m" aria-label="Minute"></button>${h24 ? '' : '<div class="mg-timepicker__period mg-segmented mg-glass-1" role="group" aria-label="AM or PM"><button type="button" class="mg-segmented__item" data-p="am">AM</button><button type="button" class="mg-segmented__item" data-p="pm">PM</button></div>'}</div><div class="mg-timepicker__dial" role="group" aria-label="Clock dial"><div class="mg-timepicker__hand"></div></div>`;
    const dial = root.querySelector('.mg-timepicker__dial');
    const hand = root.querySelector('.mg-timepicker__hand');
    const partH = root.querySelector('[data-part="h"]');
    const partM = root.querySelector('[data-part="m"]');
    const display12 = () => ((hour + 11) % 12) + 1;
    function render() {
      partH.textContent = String(h24 ? hour : display12()).padStart(2, '0');
      partM.textContent = String(minute).padStart(2, '0');
      partH.setAttribute('aria-pressed', String(mode === 'h'));
      partM.setAttribute('aria-pressed', String(mode === 'm'));
      $$(root, '[data-p]').forEach((b) => b.setAttribute('aria-pressed', String((b.dataset.p === 'pm') === hour >= 12)));
      $$(dial, '.mg-timepicker__num').forEach((n) => n.remove());
      const values = mode === 'h'
        ? (h24 ? Array.from({ length: 24 }, (_, i) => (i < 12 ? (i === 0 ? 12 : i) : i === 12 ? 0 : i)) : [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])
        : [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
      const current = mode === 'h' ? (h24 ? hour : display12()) : Math.round(minute / 5) * 5 % 60;
      values.forEach((v, i) => {
        const inner = h24 && mode === 'h' && i >= 12;
        const angle = ((i % 12) / 12) * Math.PI * 2;
        const r = inner ? 62 : 96;
        const b = doc.createElement('button');
        b.type = 'button';
        b.className = 'mg-timepicker__num';
        b.textContent = mode === 'm' ? String(v).padStart(2, '0') : v;
        b.style.left = 116 + Math.sin(angle) * r + 'px';
        b.style.top = 116 - Math.cos(angle) * r + 'px';
        b.dataset.v = v;
        b.setAttribute('aria-pressed', String(v === current));
        dial.appendChild(b);
      });
      const unit = mode === 'h' ? (hour % 12) / 12 : minute / 60;
      hand.style.rotate = unit * 360 + 180 + 'deg';
      hand.style.height = (h24 && mode === 'h' && (hour === 0 || hour > 12) ? 62 : 96) + 'px';
      root.setAttribute('data-value', `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
    }
    const emit = () => root.dispatchEvent(new CustomEvent('mg-change', { bubbles: true, detail: { value: root.getAttribute('data-value') } }));
    root.addEventListener('click', (e) => {
      const part = e.target.closest('[data-part]');
      if (part) { mode = part.dataset.part; render(); return; }
      const p = e.target.closest('[data-p]');
      if (p) { if ((p.dataset.p === 'pm') !== hour >= 12) hour = (hour + 12) % 24; render(); emit(); return; }
      const n = e.target.closest('.mg-timepicker__num');
      if (!n) return;
      const v = +n.dataset.v;
      if (mode === 'h') { hour = h24 ? v : (v % 12) + (hour >= 12 ? 12 : 0); mode = 'm'; }
      else minute = v;
      render();
      emit();
      const next = root.querySelector('.mg-timepicker__num[aria-pressed="true"]');
      if (next) next.focus();
    });
    render();
  }

  /* ══════════ Small inputs ══════════ */

  function slider(input) {
    if (!once(input, '__mgSlider')) return;
    const set = () => {
      const min = parseFloat(input.min) || 0, max = parseFloat(input.max) || 100;
      input.style.setProperty('--mg-value', ((parseFloat(input.value) - min) / (max - min)) * 100 + '%');
      const out = input.id && doc.querySelector(`output[for~="${input.id}"]`);
      if (out) out.textContent = input.value;
    };
    input.addEventListener('input', set);
    set();
  }

  function rangeSlider(wrap) {
    if (!once(wrap, '__mgRange')) return;
    const [a, b] = $$(wrap, 'input[type="range"]');
    if (!a || !b) return;
    const pct = (i) => ((+i.value - (+i.min || 0)) / ((+i.max || 100) - (+i.min || 0))) * 100;
    const sync = (e) => {
      if (+a.value > +b.value) { if (e && e.target === a) a.value = b.value; else b.value = a.value; }
      wrap.style.setProperty('--from', pct(a) + '%');
      wrap.style.setProperty('--to', pct(b) + '%');
    };
    a.addEventListener('input', sync);
    b.addEventListener('input', sync);
    sync();
  }

  function stepper(root) {
    if (!once(root, '__mgStep')) return;
    const input = root.querySelector('input');
    const [dec, inc] = $$(root, 'button');
    const sync = () => {
      if (dec) dec.disabled = input.min !== '' && +input.value <= +input.min;
      if (inc) inc.disabled = input.max !== '' && +input.value >= +input.max;
    };
    const step = (dir) => {
      if (dir > 0) input.stepUp(); else input.stepDown();
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      sync();
    };
    if (dec) dec.addEventListener('click', () => step(-1));
    if (inc) inc.addEventListener('click', () => step(1));
    input.addEventListener('input', sync);
    sync();
  }

  function dropzone(zone) {
    if (!once(zone, '__mgDrop')) return;
    const input = zone.querySelector('input[type="file"]');
    let list = zone.querySelector('.mg-dropzone__files');
    const show = (files) => {
      if (!list) { list = doc.createElement('ul'); list.className = 'mg-dropzone__files'; zone.appendChild(list); }
      list.textContent = '';
      Array.from(files).forEach((f) => { const li = doc.createElement('li'); li.className = 'mg-badge'; li.textContent = f.name; list.appendChild(li); });
    };
    ['dragenter', 'dragover'].forEach((t) => zone.addEventListener(t, (e) => { e.preventDefault(); zone.classList.add('is-over'); }));
    ['dragleave', 'dragend', 'drop'].forEach((t) => zone.addEventListener(t, () => zone.classList.remove('is-over')));
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      if (!e.dataTransfer || !e.dataTransfer.files.length) return;
      try { input.files = e.dataTransfer.files; } catch (_) {}
      show(e.dataTransfer.files);
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
    if (input) input.addEventListener('change', () => show(input.files));
  }

  function tagInput(root) {
    if (!once(root, '__mgTag')) return;
    const input = root.querySelector('input');
    const tags = () => $$(root, '.mg-chip').map((c) => c.firstChild.textContent);
    const changed = () => root.dispatchEvent(new CustomEvent('mg-change', { bubbles: true, detail: { tags: tags() } }));
    const add = (text) => {
      text = text.trim();
      if (!text) return;
      const chip = doc.createElement('span');
      chip.className = 'mg-chip';
      chip.append(text);
      const x = doc.createElement('button');
      x.type = 'button';
      x.className = 'mg-chip__remove';
      x.setAttribute('aria-label', `Remove ${text}`);
      x.innerHTML = icon('M6 6l12 12M18 6L6 18');
      chip.appendChild(x);
      root.insertBefore(chip, input);
      changed();
    };
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(input.value); input.value = ''; }
      else if (e.key === 'Backspace' && !input.value) { const last = $$(root, '.mg-chip').pop(); if (last) { last.remove(); changed(); } }
    });
    root.addEventListener('click', (e) => {
      const x = e.target.closest('.mg-chip__remove');
      if (x) { x.parentNode.remove(); input.focus(); changed(); }
      else if (e.target === root) input.focus();
    });
  }

  function autogrow(ta) {
    if (!once(ta, '__mgGrow') || (window.CSS && CSS.supports('field-sizing', 'content'))) return;
    const fit = () => { ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 320) + 'px'; };
    ta.addEventListener('input', fit);
    fit();
  }

  /* ══════════ Draggable, sheets, split pane ══════════ */

  function draggable(el) {
    if (!once(el, '__mgDrag')) return;
    let start = null;
    el.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      el.setPointerCapture(e.pointerId);
      start = { x: e.clientX, y: e.clientY, l: el.offsetLeft, t: el.offsetTop };
      if (!reduceMotion.matches) { el.style.transition = 'transform 320ms cubic-bezier(.3,0,0,1.3)'; el.style.transform = 'scale(1.06)'; }
    });
    el.addEventListener('pointermove', (e) => {
      if (!start) return;
      const p = el.offsetParent || doc.body;
      el.style.left = Math.max(0, Math.min(p.clientWidth - el.offsetWidth, start.l + e.clientX - start.x)) + 'px';
      el.style.top = Math.max(0, Math.min(p.clientHeight - el.offsetHeight, start.t + e.clientY - start.y)) + 'px';
      el.style.right = 'auto';
      el.style.bottom = 'auto';
    });
    const end = () => { if (!start) return; start = null; el.style.transition = 'transform 520ms cubic-bezier(.3,0,0,1.6)'; el.style.transform = ''; };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
  }

  function sheet(dlg) {
    if (!once(dlg, '__mgSheet')) return;
    const handle = dlg.querySelector('.mg-sheet__handle');
    const side = dlg.classList.contains('mg-sheet--side');
    // A click on the backdrop (outside the sheet's box) closes it.
    dlg.addEventListener('click', (e) => {
      if (e.target !== dlg || !dlg.close) return;
      const r = dlg.getBoundingClientRect();
      if (e.clientY < r.top || e.clientX < r.left || e.clientX > r.right || e.clientY > r.bottom) dlg.close();
    });
    if (!handle) return;
    let start = null, delta = 0;
    handle.addEventListener('pointerdown', (e) => { handle.setPointerCapture(e.pointerId); start = side ? e.clientX : e.clientY; dlg.classList.add('is-dragging'); });
    handle.addEventListener('pointermove', (e) => {
      if (start == null) return;
      delta = Math.max(0, (side ? e.clientX : e.clientY) - start);
      dlg.style.setProperty('--mg-sheet-drag', delta + 'px');
    });
    const end = () => {
      if (start == null) return;
      start = null;
      dlg.classList.remove('is-dragging');
      const size = side ? dlg.offsetWidth : dlg.offsetHeight;
      dlg.style.transition = 'translate 260ms cubic-bezier(.2,0,0,1)';
      if (delta > size * 0.3) {
        dlg.style.setProperty('--mg-sheet-drag', size + 'px');
        setTimeout(() => { if (dlg.close) dlg.close(); dlg.style.removeProperty('--mg-sheet-drag'); dlg.style.transition = ''; }, 260);
      } else {
        dlg.style.setProperty('--mg-sheet-drag', '0px');
        setTimeout(() => { dlg.style.transition = ''; }, 260);
      }
      delta = 0;
    };
    handle.addEventListener('pointerup', end);
    handle.addEventListener('pointercancel', end);
  }

  function split(root) {
    if (!once(root, '__mgSplit')) return;
    const handle = root.querySelector('.mg-split__handle');
    if (!handle) return;
    const vertical = root.classList.contains('mg-split--vertical');
    handle.setAttribute('role', 'separator');
    handle.setAttribute('aria-orientation', vertical ? 'horizontal' : 'vertical');
    handle.setAttribute('aria-valuemin', '10');
    handle.setAttribute('aria-valuemax', '90');
    if (!handle.hasAttribute('tabindex')) handle.tabIndex = 0;
    const set = (p) => {
      p = Math.max(10, Math.min(90, p));
      root.style.setProperty('--split', p + '%');
      handle.setAttribute('aria-valuenow', Math.round(p));
    };
    const current = () => parseFloat(getComputedStyle(root).getPropertyValue('--split')) || 50;
    handle.addEventListener('pointerdown', (e) => { handle.setPointerCapture(e.pointerId); handle.classList.add('is-dragging'); });
    handle.addEventListener('pointermove', (e) => {
      if (!handle.classList.contains('is-dragging')) return;
      const r = root.getBoundingClientRect();
      set(vertical ? ((e.clientY - r.top) / r.height) * 100 : ((e.clientX - r.left) / r.width) * 100);
    });
    const end = () => handle.classList.remove('is-dragging');
    handle.addEventListener('pointerup', end);
    handle.addEventListener('pointercancel', end);
    handle.addEventListener('keydown', (e) => {
      const k = vertical ? { ArrowUp: -5, ArrowDown: 5 } : { ArrowLeft: -5, ArrowRight: 5 };
      if (k[e.key]) { e.preventDefault(); set(current() + k[e.key]); }
      else if (e.key === 'Home') { e.preventDefault(); set(10); }
      else if (e.key === 'End') { e.preventDefault(); set(90); }
    });
    set(current());
  }

  /* ══════════ Carousel ══════════ */

  function carousel(root) {
    if (!once(root, '__mgCarousel')) return;
    const track = root.querySelector('.mg-carousel__track');
    const dots = root.querySelector('.mg-carousel__dots');
    if (!track) return;
    const items = $$(track, '.mg-carousel__item');
    // A scrolling region must be reachable by keyboard (arrow keys then scroll it).
    if (!track.hasAttribute('tabindex')) track.tabIndex = 0;
    if (!track.hasAttribute('aria-label') && !track.hasAttribute('aria-labelledby')) track.setAttribute('aria-label', root.getAttribute('aria-label') || 'Slides');
    const behavior = () => (reduceMotion.matches ? 'auto' : 'smooth');
    if (dots) {
      dots.setAttribute('role', 'group');
      dots.setAttribute('aria-label', 'Slides');
      dots.textContent = '';
      items.forEach((it, i) => {
        const b = doc.createElement('button');
        b.type = 'button';
        b.className = 'mg-segmented__item';
        b.setAttribute('aria-label', `Slide ${i + 1}`);
        b.setAttribute('aria-pressed', String(i === 0));
        b.addEventListener('click', () => track.scrollTo({ left: it.offsetLeft - track.offsetLeft, behavior: behavior() }));
        dots.appendChild(b);
      });
      if (!dots.hasAttribute('data-mg-liquid')) dots.setAttribute('data-mg-liquid', 'manual');
      liquid(dots);
    }
    const nav = (dir) => track.scrollBy({ left: dir * track.clientWidth * 0.8, behavior: behavior() });
    const prev = root.querySelector('.mg-carousel__nav--prev');
    const next = root.querySelector('.mg-carousel__nav--next');
    if (prev) prev.addEventListener('click', () => nav(-1));
    if (next) next.addEventListener('click', () => nav(1));
    let t;
    track.addEventListener('scroll', () => {
      clearTimeout(t);
      t = setTimeout(() => {
        const x = track.scrollLeft;
        let best = 0;
        items.forEach((it, i) => { if (Math.abs(it.offsetLeft - track.offsetLeft - x) < Math.abs(items[best].offsetLeft - track.offsetLeft - x)) best = i; });
        if (track.scrollLeft + track.clientWidth >= track.scrollWidth - 4) best = items.length - 1;
        if (dots) Array.from(dots.children).filter((c) => c.matches('.mg-segmented__item')).forEach((b, i) => b.setAttribute('aria-pressed', String(i === best)));
      }, 60);
    }, { passive: true });
  }

  /* ══════════ Command palette ══════════ */

  function command(dlg) {
    if (!once(dlg, '__mgCmd')) return;
    const input = dlg.querySelector('input');
    const list = dlg.querySelector('.mg-command__list');
    const items = () => $$(list, '.mg-menu__item');
    items().forEach((it) => { it.setAttribute('role', 'option'); it.dataset.mgLabel = it.textContent.trim().toLowerCase(); });
    let active = 0;
    const visible = () => items().filter((i) => !i.hidden);
    const mark = () => visible().forEach((it, i) => { it.setAttribute('aria-selected', String(i === active)); if (i === active) it.scrollIntoView({ block: 'nearest' }); });
    const filter = () => {
      const q = input.value.trim().toLowerCase();
      items().forEach((it) => { it.hidden = !!q && !it.dataset.mgLabel.includes(q); });
      $$(list, '.mg-menu__label').forEach((label) => {
        let n = label.nextElementSibling, any = false;
        while (n && !n.classList.contains('mg-menu__label')) { if (n.matches('.mg-menu__item') && !n.hidden) any = true; n = n.nextElementSibling; }
        label.hidden = !any;
      });
      active = 0;
      mark();
    };
    input.addEventListener('input', filter);
    input.addEventListener('keydown', (e) => {
      const v = visible();
      if (!v.length) return;
      if (e.key === 'ArrowDown') { e.preventDefault(); active = (active + 1) % v.length; mark(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); active = (active - 1 + v.length) % v.length; mark(); }
      else if (e.key === 'Enter' && v[active]) { e.preventDefault(); v[active].click(); }
    });
    list.addEventListener('click', (e) => { if (e.target.closest('.mg-menu__item')) dlg.close(); });
    dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener('close', () => { input.value = ''; filter(); });
    dlg.__mgOpen = () => { if (!dlg.open) { dlg.showModal(); filter(); input.focus(); } };
  }
  doc.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      const dlg = doc.querySelector('dialog[data-mg-command]');
      if (!dlg) return;
      e.preventDefault();
      command(dlg);
      if (dlg.open) dlg.close(); else dlg.__mgOpen();
    }
  });

  /* ══════════ Tables ══════════ */

  function sortable(table) {
    if (!once(table, '__mgSort')) return;
    const heads = $$(table, 'thead th');
    heads.forEach((th, col) => {
      if (th.hasAttribute('data-mg-nosort')) return;
      let btn = th.querySelector('.mg-table__sort');
      if (!btn) {
        btn = doc.createElement('button');
        btn.type = 'button';
        btn.className = 'mg-table__sort';
        while (th.firstChild) btn.appendChild(th.firstChild);
        th.appendChild(btn);
      }
      if (!th.hasAttribute('aria-sort')) th.setAttribute('aria-sort', 'none');
      btn.addEventListener('click', () => {
        const dir = th.getAttribute('aria-sort') === 'ascending' ? 'descending' : 'ascending';
        heads.forEach((h) => { if (h.hasAttribute('aria-sort')) h.setAttribute('aria-sort', 'none'); });
        th.setAttribute('aria-sort', dir);
        const body = table.tBodies[0];
        const rows = Array.from(body.rows);
        const val = (r) => {
          const c = r.cells[col];
          const raw = ((c && (c.getAttribute('data-sort') ?? c.textContent)) || '').trim();
          const n = parseFloat(raw.replace(/[^0-9.\-]/g, ''));
          return /^[\s$€£¥%+\-0-9.,kKmM]+$/.test(raw) && !isNaN(n) ? n : raw.toLowerCase();
        };
        rows.sort((a, b) => { const x = val(a), y = val(b); const r = x < y ? -1 : x > y ? 1 : 0; return dir === 'ascending' ? r : -r; });
        rows.forEach((r) => body.appendChild(r));
      });
    });
  }

  function resizable(table) {
    if (!once(table, '__mgResize')) return;
    const heads = $$(table, 'thead th');
    heads.forEach((th) => { th.style.width = th.offsetWidth + 'px'; });
    table.style.tableLayout = 'fixed';
    heads.forEach((th) => {
      const h = doc.createElement('span');
      h.className = 'mg-table__resizer';
      h.setAttribute('aria-hidden', 'true');
      th.appendChild(h);
      let x0 = null, w0 = 0;
      h.addEventListener('pointerdown', (e) => { e.stopPropagation(); h.setPointerCapture(e.pointerId); x0 = e.clientX; w0 = th.offsetWidth; h.classList.add('is-dragging'); });
      h.addEventListener('pointermove', (e) => { if (x0 != null) th.style.width = Math.max(48, w0 + e.clientX - x0) + 'px'; });
      const end = () => { x0 = null; h.classList.remove('is-dragging'); };
      h.addEventListener('pointerup', end);
      h.addEventListener('pointercancel', end);
    });
  }

  /* ══════════ Kanban ══════════ */

  function kanban(board) {
    if (!once(board, '__mgKanban')) return;
    let dragged = null;
    $$(board, '.mg-kanban__card').forEach((c) => { c.draggable = true; });
    const updateCounts = () => $$(board, '.mg-kanban__col').forEach((col) => { const n = col.querySelector('.mg-kanban__count'); if (n) n.textContent = col.querySelectorAll('.mg-kanban__card').length; });
    board.addEventListener('dragstart', (e) => {
      dragged = e.target.closest('.mg-kanban__card');
      if (!dragged) return;
      dragged.classList.add('is-dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', '');
    });
    board.addEventListener('dragend', () => {
      if (dragged) dragged.classList.remove('is-dragging');
      $$(board, '.is-over').forEach((c) => c.classList.remove('is-over'));
      dragged = null;
      updateCounts();
    });
    board.addEventListener('dragover', (e) => {
      const col = e.target.closest('.mg-kanban__col');
      if (!col || !dragged) return;
      e.preventDefault();
      $$(board, '.is-over').forEach((c) => { if (c !== col) c.classList.remove('is-over'); });
      col.classList.add('is-over');
      const after = $$(col, '.mg-kanban__card:not(.is-dragging)').find((c) => e.clientY < c.getBoundingClientRect().top + c.offsetHeight / 2);
      if (after) col.insertBefore(dragged, after); else col.appendChild(dragged);
    });
    board.addEventListener('drop', (e) => { e.preventDefault(); updateCounts(); board.dispatchEvent(new CustomEvent('mg-change', { bubbles: true })); });
  }

  /* ══════════ Toasts ══════════ */

  function toast(message, opts) {
    opts = opts || {};
    let host = doc.querySelector('.mg-toasts');
    if (!host) {
      host = doc.createElement('div');
      host.className = 'mg-toasts';
      host.setAttribute('role', 'status');
      host.setAttribute('aria-live', 'polite');
      doc.body.appendChild(host);
    }
    const t = doc.createElement('div');
    t.className = 'mg-snackbar';
    const text = doc.createElement('span');
    text.textContent = message;
    t.appendChild(text);
    let timer;
    const dismiss = () => {
      clearTimeout(timer);
      t.classList.add('is-leaving');
      setTimeout(() => t.remove(), reduceMotion.matches ? 0 : 320);
    };
    const arm = () => { if (opts.duration !== 0) timer = setTimeout(dismiss, opts.duration || 4000); };
    if (opts.action) {
      const b = doc.createElement('button');
      b.type = 'button';
      b.className = 'mg-btn mg-btn--text mg-btn--sm';
      b.textContent = opts.action;
      b.addEventListener('click', () => { if (opts.onAction) opts.onAction(); dismiss(); });
      t.appendChild(b);
    }
    const close = doc.createElement('button');
    close.type = 'button';
    close.className = 'mg-icon-btn';
    close.style.cssText = 'color:inherit;width:36px;height:36px';
    close.setAttribute('aria-label', 'Dismiss');
    close.innerHTML = icon('M6 6l12 12M18 6L6 18');
    close.addEventListener('click', dismiss);
    t.appendChild(close);
    // Swipe sideways to dismiss.
    let x0 = null;
    t.addEventListener('pointerdown', (e) => { if (e.target.closest('button')) return; x0 = e.clientX; t.setPointerCapture(e.pointerId); t.classList.add('is-dragging'); clearTimeout(timer); });
    t.addEventListener('pointermove', (e) => { if (x0 == null) return; const dx = e.clientX - x0; t.style.translate = dx + 'px 0'; t.style.opacity = String(1 - Math.min(1, Math.abs(dx) / 240)); });
    t.addEventListener('pointerup', (e) => {
      if (x0 == null) return;
      const dx = e.clientX - x0;
      x0 = null;
      t.classList.remove('is-dragging');
      if (Math.abs(dx) > 100) { t.style.translate = Math.sign(dx) * 400 + 'px 0'; t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }
      else { t.style.translate = ''; t.style.opacity = ''; arm(); }
    });
    host.appendChild(t);
    while (host.children.length > 3) host.firstElementChild.remove();
    arm();
    return { dismiss };
  }

  /* ══════════ Charts ══════════ */

  function sparkline(el, values) {
    if (!values || values.length < 2) return;
    const w = 100, h = 32;
    const min = Math.min(...values), max = Math.max(...values);
    const span = max - min || 1;
    const pts = values.map((v, i) => [(i / (values.length - 1)) * w, h - ((v - min) / span) * (h - 4) - 2]);
    const line = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(2) + ' ' + p[1].toFixed(2)).join(' ');
    el.innerHTML = `<svg class="mg-spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true"><path d="${line} L${w} ${h} L0 ${h} Z"/><path d="${line}"/></svg>`;
  }

  // Colours and fonts for Chart.js (or any chart library), read from the live theme.
  function chartTheme(el) {
    el = el || html;
    const v = (n) => cssVar(el, '--mg-' + n);
    return {
      series: [1, 2, 3, 4, 5, 6, 7, 8].map((i) => v('chart-' + i)),
      text: v('on-surface-variant'),
      grid: `rgb(${v('outline-variant-rgb')} / 0.6)`,
      surface: v('surface-container-high'),
      font: v('font-body'),
      chartjs: {
        color: v('on-surface-variant'),
        font: { family: v('font-body') },
        borderColor: `rgb(${v('outline-variant-rgb')} / 0.6)`,
        plugins: { tooltip: { backgroundColor: v('inverse-surface'), titleColor: v('inverse-on-surface'), bodyColor: v('inverse-on-surface'), cornerRadius: 10, padding: 10 } }
      }
    };
  }

  /* ══════════ Init ══════════ */

  const canRefract = supportsRefraction();
  const INIT = [
    ['[data-mg-refract]', (el) => { if (canRefract) refract(el); }],
    ['[data-mg-specular="pointer"]', pointerSpecular],
    ['[data-mg-liquid]', liquid],
    ['.mg-tabs[role="tablist"]', tabs],
    ['[data-mg-top-bar]', topBar],
    ['[data-mg-draggable]', draggable],
    ['input.mg-slider', slider],
    ['.mg-range', rangeSlider],
    ['[data-mg-stepper]', stepper],
    ['[data-mg-dropzone]', dropzone],
    ['[data-mg-tag-input]', tagInput],
    ['textarea.mg-field__input', autogrow],
    ['.mg-menu[popover], .mg-popover[popover], .mg-tooltip-rich[popover]', popover],
    ['[data-mg-tooltip-target]', richTooltip],
    ['[data-mg-combobox]', combobox],
    ['[data-mg-datepicker]', datepicker],
    ['[data-mg-timepicker]', timepicker],
    ['dialog.mg-sheet, [data-mg-sheet]', sheet],
    ['[data-mg-split]', split],
    ['[data-mg-carousel]', carousel],
    ['dialog[data-mg-command]', command],
    ['table[data-mg-sortable]', sortable],
    ['table[data-mg-resizable]', resizable],
    ['[data-mg-kanban]', kanban]
  ];

  function init(root) {
    root = root || doc;
    for (const [sel, fn] of INIT) {
      if (root.matches && root.matches(sel)) fn(root);
      $$(root, sel).forEach(fn);
    }
  }

  function refresh() {
    $$(doc, '[data-mg-refract]').forEach((el) => { if (el.__mgRefractUpdate) el.__mgRefractUpdate(); });
    $$(doc, '[data-mg-liquid]').forEach((el) => { if (el.__mgLiquid) el.__mgLiquid.sync(false); });
  }

  function setTheme(theme, mode) {
    if (theme) html.setAttribute('data-mg-theme', theme);
    if (mode === 'auto') html.removeAttribute('data-mg-mode');
    else if (mode) html.setAttribute('data-mg-mode', mode);
    requestAnimationFrame(refresh);
  }

  // Elements added later (frameworks, fetched HTML) are picked up automatically.
  let pending = new Set();
  let scheduled = false;
  const observer = new MutationObserver((records) => {
    for (const r of records) r.addedNodes.forEach((n) => { if (n.nodeType === 1) pending.add(n); });
    if (scheduled || !pending.size) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      const nodes = pending;
      pending = new Set();
      nodes.forEach((n) => { if (n.isConnected) init(n); });
    });
  });

  // Re-measure when theme or customization attributes change on <html>.
  new MutationObserver(() => requestAnimationFrame(refresh)).observe(html, { attributes: true, attributeFilter: ['data-mg-theme', 'data-mg-mode', 'data-mg-glass', 'data-mg-density', 'data-mg-shape', 'data-mg-font', 'data-mg-type', 'data-mg-transparency', 'dir', 'lang'] });

  window.MaterialGlass = { init, refresh, setTheme, toast, sparkline, chartTheme, supportsRefraction: canRefract, version: '0.2.0' };

  const start = () => { init(); observer.observe(doc.body, { childList: true, subtree: true }); };
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', start);
  else start();
})();
