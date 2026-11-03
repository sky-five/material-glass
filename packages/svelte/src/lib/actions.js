/** use:liquid — initialise material-glass.js behaviour (liquid selection, refraction, menus) inside an element. */
export function liquid(node) {
  if (typeof window !== 'undefined') window.MaterialGlass?.init(node);
  return {
    update() { requestAnimationFrame(() => window.MaterialGlass?.refresh()); }
  };
}

/** Set theme attributes on <html> (or another element) and re-measure glass. */
export function setTheme(opts, el = document.documentElement) {
  for (const [k, v] of Object.entries(opts)) {
    if (v == null || (k === 'mode' && v === 'auto')) el.removeAttribute(`data-mg-${k}`);
    else el.setAttribute(`data-mg-${k}`, v);
  }
  requestAnimationFrame(() => window.MaterialGlass?.refresh());
}

/** MaterialGlass.toast, safe before the script loads. */
export const toast = (message, opts) => (typeof window !== 'undefined' ? window.MaterialGlass?.toast(message, opts) : undefined);
