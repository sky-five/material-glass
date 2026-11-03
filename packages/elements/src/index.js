/*!
 * @material-glass/elements · Web Components for Material Glass · MIT
 * Light DOM, no dependencies. Load material-glass.css (and material-glass.js for liquid motion
 * and refraction), then import this module once.
 *
 * Elements render real native controls inside themselves, so forms, focus and keyboard behave
 * exactly like plain HTML.
 */

const ATTR = (el, name, fallback = null) => (el.hasAttribute(name) ? el.getAttribute(name) : fallback);
const BOOL = (el, name) => el.hasAttribute(name) && el.getAttribute(name) !== 'false';
const icon = (name) => (name ? `<svg aria-hidden="true"><use href="#${name.replace(/^#/, '')}"/></svg>` : '');
const define = (name, cls) => { if (!customElements.get(name)) customElements.define(name, cls); };

/** Base: renders once when connected, re-syncs when observed attributes change. */
class MgElement extends HTMLElement {
  connectedCallback() {
    if (!this.__mgRendered) {
      this.__mgRendered = true;
      this.render();
    }
    this.sync();
  }
  attributeChangedCallback() { if (this.__mgRendered) this.sync(); }
  render() {}
  sync() {}
  /** Moves the element's current children into a new inner element. */
  adopt(inner) {
    while (this.firstChild) inner.appendChild(this.firstChild);
    this.appendChild(inner);
    return inner;
  }
}

/* ─── <mg-theme theme="ember" mode="dark" glass="milk" density="compact" shape="round" motion="calm" font="inter" global> ─── */
class MgTheme extends MgElement {
  static observedAttributes = ['theme', 'mode', 'glass', 'density', 'shape', 'motion', 'font', 'global'];
  render() { if (!BOOL(this, 'global')) this.style.display = 'contents'; }
  sync() {
    const target = BOOL(this, 'global') ? document.documentElement : this;
    for (const k of ['theme', 'mode', 'glass', 'density', 'shape', 'motion', 'font']) {
      const v = ATTR(this, k);
      if (v && !(k === 'mode' && v === 'auto')) target.setAttribute(`data-mg-${k}`, v);
      else target.removeAttribute(`data-mg-${k}`);
    }
    if (window.MaterialGlass) requestAnimationFrame(() => window.MaterialGlass.refresh());
  }
}

/* ─── <mg-button variant="filled|tonal|glass|outlined|text|danger" size="sm|lg" icon="i-plus" href type disabled> ─── */
class MgButton extends MgElement {
  static observedAttributes = ['variant', 'size', 'disabled', 'href', 'type', 'icon'];
  render() {
    this.style.display = 'inline-flex';
    const href = ATTR(this, 'href');
    this.control = this.adopt(document.createElement(href ? 'a' : 'button'));
    if (ATTR(this, 'icon')) this.control.insertAdjacentHTML('afterbegin', icon(ATTR(this, 'icon')));
  }
  sync() {
    const c = this.control;
    const v = ATTR(this, 'variant', 'filled');
    const s = ATTR(this, 'size');
    c.className = ['mg-btn', v !== 'filled' && `mg-btn--${v}`, s && `mg-btn--${s}`].filter(Boolean).join(' ');
    if (c.tagName === 'A') { c.href = ATTR(this, 'href'); if (BOOL(this, 'disabled')) c.setAttribute('aria-disabled', 'true'); else c.removeAttribute('aria-disabled'); }
    else { c.type = ATTR(this, 'type', 'button'); c.disabled = BOOL(this, 'disabled'); }
  }
  focus(o) { this.control.focus(o); }
  click() { this.control.click(); }
}

/* ─── <mg-icon-button icon="i-heart" label="Favourite" toggle pressed> ─── */
class MgIconButton extends MgElement {
  static observedAttributes = ['icon', 'label', 'pressed', 'disabled', 'tier'];
  render() {
    this.style.display = 'inline-flex';
    this.control = document.createElement('button');
    this.control.type = 'button';
    this.control.innerHTML = icon(ATTR(this, 'icon'));
    this.appendChild(this.control);
    if (this.hasAttribute('toggle')) this.control.addEventListener('click', () => {
      const on = !BOOL(this, 'pressed');
      this.toggleAttribute('pressed', on);
      this.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }
  sync() {
    const c = this.control;
    c.className = 'mg-icon-btn' + (ATTR(this, 'tier') ? ` mg-glass-${ATTR(this, 'tier')}` : '');
    c.setAttribute('aria-label', ATTR(this, 'label', ''));
    if (this.hasAttribute('toggle') || this.hasAttribute('pressed')) c.setAttribute('aria-pressed', String(BOOL(this, 'pressed')));
    c.disabled = BOOL(this, 'disabled');
    const use = c.querySelector('use');
    if (use && ATTR(this, 'icon')) use.setAttribute('href', '#' + ATTR(this, 'icon').replace(/^#/, ''));
  }
  get pressed() { return BOOL(this, 'pressed'); }
  set pressed(v) { this.toggleAttribute('pressed', !!v); }
}

/* ─── <mg-fab icon="i-plus" label="Create">Optional text makes it extended</mg-fab> ─── */
class MgFab extends MgElement {
  static observedAttributes = ['icon', 'label', 'disabled'];
  render() {
    this.style.display = 'inline-flex';
    const extended = this.textContent.trim().length > 0;
    this.control = this.adopt(document.createElement('button'));
    this.control.type = 'button';
    this.control.className = 'mg-fab' + (extended ? ' mg-fab--extended' : '');
    if (ATTR(this, 'icon')) this.control.insertAdjacentHTML('afterbegin', icon(ATTR(this, 'icon')));
  }
  sync() {
    if (ATTR(this, 'label')) this.control.setAttribute('aria-label', ATTR(this, 'label'));
    this.control.disabled = BOOL(this, 'disabled');
  }
}

/* ─── <mg-chip selected value="design">Design</mg-chip> ─── */
class MgChip extends MgElement {
  static observedAttributes = ['selected', 'disabled'];
  render() {
    this.style.display = 'inline-flex';
    this.control = this.adopt(document.createElement('button'));
    this.control.type = 'button';
    this.control.className = 'mg-chip';
    this.control.insertAdjacentHTML('afterbegin', '<svg class="mg-chip__check" viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>');
    this.control.addEventListener('click', () => {
      this.toggleAttribute('selected', !BOOL(this, 'selected'));
      this.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }
  sync() { this.control.setAttribute('aria-pressed', String(BOOL(this, 'selected'))); this.control.disabled = BOOL(this, 'disabled'); }
  get selected() { return BOOL(this, 'selected'); }
  set selected(v) { this.toggleAttribute('selected', !!v); }
}

/* ─── <mg-switch checked label="Wi-Fi" name="wifi"> ─── form-associated through a hidden checkbox */
class MgSwitch extends MgElement {
  static observedAttributes = ['checked', 'label', 'disabled', 'name', 'value'];
  render() {
    this.style.display = 'inline-flex';
    this.control = document.createElement('button');
    this.control.type = 'button';
    this.control.className = 'mg-switch';
    this.control.setAttribute('role', 'switch');
    this.input = document.createElement('input');
    this.input.type = 'checkbox';
    this.input.hidden = true;
    this.append(this.control, this.input);
    this.control.addEventListener('click', () => {
      this.checked = !this.checked;
      this.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }
  sync() {
    const on = BOOL(this, 'checked');
    this.control.setAttribute('aria-checked', String(on));
    this.control.setAttribute('aria-label', ATTR(this, 'label', ''));
    this.control.disabled = BOOL(this, 'disabled');
    this.input.checked = on;
    this.input.name = ATTR(this, 'name', '');
    this.input.value = ATTR(this, 'value', 'on');
  }
  get checked() { return BOOL(this, 'checked'); }
  set checked(v) { this.toggleAttribute('checked', !!v); }
}

/* ─── <mg-slider min="0" max="100" step="1" value="40" label="Volume" name> ─── */
class MgSlider extends MgElement {
  static observedAttributes = ['min', 'max', 'step', 'value', 'label', 'disabled', 'name'];
  render() {
    this.style.display = 'block';
    this.input = document.createElement('input');
    this.input.type = 'range';
    this.input.className = 'mg-slider';
    this.appendChild(this.input);
    this.input.addEventListener('input', () => { this.setAttribute('value', this.input.value); });
  }
  sync() {
    const i = this.input;
    for (const k of ['min', 'max', 'step']) if (this.hasAttribute(k)) i[k] = ATTR(this, k);
    if (this.hasAttribute('value') && i.value !== ATTR(this, 'value')) i.value = ATTR(this, 'value');
    i.setAttribute('aria-label', ATTR(this, 'label', ''));
    i.disabled = BOOL(this, 'disabled');
    i.name = ATTR(this, 'name', '');
    const min = parseFloat(i.min) || 0, max = parseFloat(i.max) || 100;
    i.style.setProperty('--mg-value', ((parseFloat(i.value) - min) / (max - min)) * 100 + '%');
  }
  get value() { return this.input ? this.input.value : ATTR(this, 'value'); }
  set value(v) { this.setAttribute('value', v); }
}

/* ─── <mg-text-field label="Email" type="email" name value placeholder supporting="Helper" error="Message" variant="outlined|filled"> ─── */
class MgTextField extends MgElement {
  static observedAttributes = ['label', 'type', 'name', 'value', 'placeholder', 'supporting', 'error', 'variant', 'disabled', 'required', 'multiline'];
  render() {
    this.style.display = 'block';
    const id = 'mg-tf-' + Math.random().toString(36).slice(2, 8);
    this.field = document.createElement('label');
    this.labelEl = document.createElement('span');
    this.labelEl.className = 'mg-field__label';
    this.input = document.createElement(this.hasAttribute('multiline') ? 'textarea' : 'input');
    this.input.className = 'mg-field__input';
    this.support = document.createElement('div');
    this.support.className = 'mg-field__support';
    this.support.id = id + '-s';
    this.field.append(this.labelEl, this.input);
    this.append(this.field, this.support);
    this.input.addEventListener('input', () => { this.__value = this.input.value; });
  }
  sync() {
    const v = ATTR(this, 'variant');
    this.field.className = 'mg-field' + (v ? ` mg-field--${v}` : '');
    this.labelEl.textContent = ATTR(this, 'label', '');
    const i = this.input;
    if (i.tagName === 'INPUT') i.type = ATTR(this, 'type', 'text');
    i.name = ATTR(this, 'name', '');
    i.placeholder = ATTR(this, 'placeholder', '');
    i.disabled = BOOL(this, 'disabled');
    i.required = BOOL(this, 'required');
    if (this.hasAttribute('value') && this.__value === undefined) i.value = ATTR(this, 'value');
    const err = ATTR(this, 'error');
    const sup = err || ATTR(this, 'supporting');
    this.support.textContent = sup || '';
    this.support.hidden = !sup;
    this.support.classList.toggle('mg-field__support--error', !!err);
    if (err) i.setAttribute('aria-invalid', 'true'); else i.removeAttribute('aria-invalid');
    if (sup) i.setAttribute('aria-describedby', this.support.id); else i.removeAttribute('aria-describedby');
  }
  get value() { return this.input ? this.input.value : ATTR(this, 'value'); }
  set value(v) { if (this.input) { this.input.value = v; this.__value = v; } else this.setAttribute('value', v); }
}

/* ─── <mg-glass tier="2">…</mg-glass> and <mg-card tier="2" headline="Title">…</mg-card> ─── */
class MgGlass extends MgElement {
  static observedAttributes = ['tier', 'refract'];
  sync() {
    this.classList.remove('mg-glass-0', 'mg-glass-1', 'mg-glass-2', 'mg-glass-3', 'mg-glass-4');
    this.classList.add(`mg-glass-${ATTR(this, 'tier', '2')}`);
    if (this.style.display === '') this.style.display = 'block';
    if (this.hasAttribute('refract')) this.setAttribute('data-mg-refract', ATTR(this, 'refract') || '24');
  }
}
class MgCard extends MgGlass {
  static observedAttributes = ['tier', 'headline', 'variant'];
  render() {
    if (ATTR(this, 'headline')) {
      const h = document.createElement('h3');
      h.className = 'mg-card__title';
      h.textContent = ATTR(this, 'headline');
      this.prepend(h);
    }
  }
  sync() {
    const v = ATTR(this, 'variant');
    this.classList.add('mg-card');
    this.classList.toggle('mg-card--' + v, !!v);
    if (v && v !== 'glass') { this.style.display = 'block'; this.classList.remove('mg-glass-0', 'mg-glass-1', 'mg-glass-2', 'mg-glass-3', 'mg-glass-4'); }
    else super.sync();
  }
}

/* ─── <mg-nav liquid label="Main"><mg-nav-item icon="i-home" href="/" current>Home</mg-nav-item>…</mg-nav> (rail attribute for vertical) ─── */
class MgNav extends MgElement {
  static observedAttributes = ['label', 'rail', 'tier'];
  render() {
    this.nav = document.createElement('nav');
    this.appendChild(this.nav);
    for (const item of Array.from(this.children)) if (item !== this.nav) this.nav.appendChild(item);
    this.nav.setAttribute('data-mg-liquid', '');
    this.style.display = 'block';
  }
  sync() {
    this.nav.className = `mg-nav mg-glass-${ATTR(this, 'tier', '3')}` + (BOOL(this, 'rail') ? ' mg-rail' : '');
    this.nav.setAttribute('aria-label', ATTR(this, 'label', 'Navigation'));
  }
}
class MgNavItem extends MgElement {
  static observedAttributes = ['icon', 'href', 'current', 'label'];
  render() {
    const href = ATTR(this, 'href');
    const el = document.createElement(href ? 'a' : 'button');
    if (!href) el.type = 'button';
    el.className = 'mg-nav__item';
    while (this.firstChild) el.appendChild(this.firstChild);
    if (ATTR(this, 'icon')) el.insertAdjacentHTML('afterbegin', icon(ATTR(this, 'icon')));
    if (ATTR(this, 'label')) el.setAttribute('aria-label', ATTR(this, 'label'));
    if (href) el.href = href;
    if (BOOL(this, 'current')) el.setAttribute('aria-current', 'page');
    // The inner control replaces this element so the nav's liquid indicator sees direct children.
    this.replaceWith(el);
  }
}

/* ─── <mg-segmented label="View" value="week"><mg-segment value="day">Day</mg-segment>…</mg-segmented> ─── */
class MgSegmented extends MgElement {
  static observedAttributes = ['value', 'label'];
  render() {
    this.group = document.createElement('div');
    this.group.setAttribute('role', 'group');
    this.group.className = 'mg-segmented mg-glass-1';
    this.group.setAttribute('data-mg-liquid', 'manual');
    for (const seg of Array.from(this.querySelectorAll('mg-segment'))) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'mg-segmented__item';
      b.dataset.value = seg.getAttribute('value');
      while (seg.firstChild) b.appendChild(seg.firstChild);
      seg.remove();
      this.group.appendChild(b);
    }
    this.appendChild(this.group);
    this.style.display = 'inline-block';
    this.group.addEventListener('click', (e) => {
      const b = e.target.closest('.mg-segmented__item');
      if (!b) return;
      this.setAttribute('value', b.dataset.value);
      this.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }
  sync() {
    this.group.setAttribute('aria-label', ATTR(this, 'label', ''));
    const v = ATTR(this, 'value');
    this.group.querySelectorAll('.mg-segmented__item').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.value === v)));
  }
  get value() { return ATTR(this, 'value'); }
  set value(v) { this.setAttribute('value', v); }
}

/* ─── <mg-tabs label="Library"><mg-tab panel="songs" selected>Songs</mg-tab>…</mg-tabs> ─── panels are elements with those ids */
class MgTabs extends MgElement {
  static observedAttributes = ['label', 'secondary'];
  render() {
    this.list = document.createElement('div');
    this.list.setAttribute('role', 'tablist');
    this.list.setAttribute('data-mg-liquid', '');
    const tabs = Array.from(this.querySelectorAll('mg-tab'));
    const hasSelected = tabs.some((t) => t.hasAttribute('selected'));
    tabs.forEach((t, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'mg-tab';
      b.setAttribute('role', 'tab');
      const panel = t.getAttribute('panel');
      if (panel) b.setAttribute('aria-controls', panel);
      b.id = t.id || `mg-tab-${Math.random().toString(36).slice(2, 8)}`;
      b.setAttribute('aria-selected', String(t.hasAttribute('selected') || (!hasSelected && i === 0)));
      while (t.firstChild) b.appendChild(t.firstChild);
      t.remove();
      this.list.appendChild(b);
      const p = panel && document.getElementById(panel);
      if (p) { p.setAttribute('role', 'tabpanel'); p.setAttribute('aria-labelledby', b.id); p.classList.add('mg-tab-panel'); }
    });
    this.appendChild(this.list);
    this.style.display = 'block';
    this.list.addEventListener('click', (e) => {
      const b = e.target.closest('.mg-tab');
      if (b) this.dispatchEvent(new CustomEvent('change', { bubbles: true, detail: { panel: b.getAttribute('aria-controls') } }));
    });
  }
  sync() {
    this.list.className = 'mg-tabs' + (BOOL(this, 'secondary') ? ' mg-tabs--secondary' : '');
    this.list.setAttribute('aria-label', ATTR(this, 'label', ''));
    // Without material-glass.js, still show the selected tab's panel.
    this.list.querySelectorAll('[role="tab"]').forEach((t) => {
      const p = t.getAttribute('aria-controls') && document.getElementById(t.getAttribute('aria-controls'));
      if (p) p.hidden = t.getAttribute('aria-selected') !== 'true';
    });
  }
}

/* ─── <mg-dialog headline="Discard changes?" open> body … <div slot="actions">buttons</div></mg-dialog> ─── */
class MgDialog extends MgElement {
  static observedAttributes = ['open', 'headline', 'variant'];
  render() {
    this.dialog = document.createElement('dialog');
    const title = document.createElement('h2');
    title.className = 'mg-dialog__title';
    title.id = 'mg-dlg-' + Math.random().toString(36).slice(2, 8);
    this.titleEl = title;
    this.dialog.setAttribute('aria-labelledby', title.id);
    const body = document.createElement('div');
    body.className = 'mg-dialog__body';
    const actions = this.querySelector('[slot="actions"]');
    for (const n of Array.from(this.childNodes)) if (n !== actions) body.appendChild(n);
    this.dialog.append(title, body);
    if (actions) { actions.removeAttribute('slot'); actions.classList.add('mg-dialog__actions'); this.dialog.appendChild(actions); }
    this.appendChild(this.dialog);
    this.dialog.addEventListener('close', () => {
      this.removeAttribute('open');
      this.dispatchEvent(new CustomEvent('close', { detail: { returnValue: this.dialog.returnValue } }));
    });
  }
  sync() {
    const v = ATTR(this, 'variant');
    this.dialog.className = 'mg-dialog mg-glass-3' + (v ? ` mg-dialog--${v}` : '');
    this.titleEl.textContent = ATTR(this, 'headline', '');
    const want = BOOL(this, 'open');
    if (want && !this.dialog.open && this.isConnected) this.dialog.showModal();
    if (!want && this.dialog.open) this.dialog.close();
  }
  show() { this.setAttribute('open', ''); }
  close(value) { if (value !== undefined) this.dialog.returnValue = value; this.removeAttribute('open'); }
}

define('mg-theme', MgTheme);
define('mg-button', MgButton);
define('mg-icon-button', MgIconButton);
define('mg-fab', MgFab);
define('mg-chip', MgChip);
define('mg-switch', MgSwitch);
define('mg-slider', MgSlider);
define('mg-text-field', MgTextField);
define('mg-glass', MgGlass);
define('mg-card', MgCard);
define('mg-nav', MgNav);
define('mg-nav-item', MgNavItem);
define('mg-segmented', MgSegmented);
define('mg-tabs', MgTabs);
define('mg-dialog', MgDialog);

export { MgTheme, MgButton, MgIconButton, MgFab, MgChip, MgSwitch, MgSlider, MgTextField, MgGlass, MgCard, MgNav, MgNavItem, MgSegmented, MgTabs, MgDialog };
