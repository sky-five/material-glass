// Material Glass theme engine.
// Turns a seed colour (plus optional palette overrides and glass settings) into a
// complete Material Glass theme object, in the same shape as tokens/material-glass.tokens.json.
//
// Pure ES module with no imports: pass in Material Color Utilities (v0.3.x) as `mcu`.
// Used by scripts/theme.mjs (Node) and builder/ (browser, MCU loaded from a CDN).

export const VARIANTS = {
  'tonal-spot': 'SchemeTonalSpot',
  vibrant: 'SchemeVibrant',
  expressive: 'SchemeExpressive',
  neutral: 'SchemeNeutral',
  monochrome: 'SchemeMonochrome',
  fidelity: 'SchemeFidelity',
  content: 'SchemeContent',
  rainbow: 'SchemeRainbow',
  'fruit-salad': 'SchemeFruitSalad'
};

export const TONES = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 99, 100];

const ROLES = {
  primary: 'primary', 'on-primary': 'onPrimary',
  'primary-container': 'primaryContainer', 'on-primary-container': 'onPrimaryContainer',
  secondary: 'secondary', 'on-secondary': 'onSecondary',
  'secondary-container': 'secondaryContainer', 'on-secondary-container': 'onSecondaryContainer',
  tertiary: 'tertiary', 'on-tertiary': 'onTertiary',
  'tertiary-container': 'tertiaryContainer', 'on-tertiary-container': 'onTertiaryContainer',
  error: 'error', 'on-error': 'onError',
  'error-container': 'errorContainer', 'on-error-container': 'onErrorContainer',
  surface: 'surface', 'on-surface': 'onSurface', 'on-surface-variant': 'onSurfaceVariant',
  'surface-container-lowest': 'surfaceContainerLowest', 'surface-container-low': 'surfaceContainerLow',
  'surface-container': 'surfaceContainer', 'surface-container-high': 'surfaceContainerHigh',
  'surface-container-highest': 'surfaceContainerHighest',
  outline: 'outline', 'outline-variant': 'outlineVariant',
  'inverse-surface': 'inverseSurface', 'inverse-on-surface': 'inverseOnSurface', 'inverse-primary': 'inversePrimary'
};

// Default glass, matching the hand-tuned Sea Glass values. Every key can be overridden per theme and mode.
export const GLASS_DEFAULTS = {
  light: { 'tint-alpha': 0.1, alpha: [0.36, 0.48, 0.6, 0.72, 0.84], specular: 1, rim: 0.6, saturate: 1.6, 'shadow-alpha': 0.14 },
  dark: { 'tint-alpha': 0.16, alpha: [0.34, 0.46, 0.58, 0.68, 0.78], specular: 0.26, rim: 0.13, saturate: 1.4, 'shadow-alpha': 0.45 }
};

const upper = (hex) => hex.toUpperCase();

/**
 * @param {object} mcu  Material Color Utilities module.
 * @param {object} spec
 *   seed: '#RRGGBB'               required
 *   variant: key of VARIANTS      default 'tonal-spot'
 *   contrast: -1..1               default 0
 *   secondary / tertiary: '#RRGGBB' or {hue, chroma}   optional palette overrides
 *   neutral: {hue, chroma}        optional neutral override (neutral-variant follows, +4 chroma)
 *   scene: { light: {...}, dark: {...} }  optional scene colour overrides (hex)
 *   glass: { light: {...}, dark: {...} }  optional glass overrides
 *   description: string
 */
export function makeTheme(mcu, spec) {
  const { Hct, TonalPalette, DynamicScheme, MaterialDynamicColors: MDC, argbFromHex, hexFromArgb } = mcu;
  const variantKey = spec.variant || 'tonal-spot';
  const Scheme = mcu[VARIANTS[variantKey]];
  if (!Scheme) throw new Error(`Unknown variant "${variantKey}". Use one of: ${Object.keys(VARIANTS).join(', ')}`);
  const seedArgb = argbFromHex(spec.seed);
  const seedHct = Hct.fromInt(seedArgb);
  const contrast = spec.contrast ?? 0;

  const paletteFrom = (o, fallback) => {
    if (!o) return fallback;
    if (typeof o === 'string') {
      const h = Hct.fromInt(argbFromHex(o));
      return TonalPalette.fromHueAndChroma(h.hue, h.chroma);
    }
    return TonalPalette.fromHueAndChroma(o.hue, o.chroma);
  };

  const build = (isDark) => {
    const base = new Scheme(seedHct, isDark, contrast);
    const custom = spec.secondary || spec.tertiary || spec.neutral;
    if (!custom) return base;
    const neutral = spec.neutral ? TonalPalette.fromHueAndChroma(spec.neutral.hue, spec.neutral.chroma) : base.neutralPalette;
    const neutralVariant = spec.neutral
      ? TonalPalette.fromHueAndChroma(spec.neutral.hue, spec.neutral.chroma + 4)
      : base.neutralVariantPalette;
    return new DynamicScheme({
      sourceColorArgb: seedArgb,
      variant: base.variant,
      contrastLevel: contrast,
      isDark,
      primaryPalette: base.primaryPalette,
      secondaryPalette: paletteFrom(spec.secondary, base.secondaryPalette),
      tertiaryPalette: paletteFrom(spec.tertiary, base.tertiaryPalette),
      neutralPalette: neutral,
      neutralVariantPalette: neutralVariant
    });
  };

  const light = build(false);
  const dark = build(true);
  const hex = (argb) => upper(hexFromArgb(argb));

  const palette = {};
  for (const [key, prop] of [['primary', 'primaryPalette'], ['secondary', 'secondaryPalette'], ['tertiary', 'tertiaryPalette'], ['neutral', 'neutralPalette'], ['error', 'errorPalette']]) {
    palette[key] = {};
    for (const t of TONES) palette[key][t] = hex(light[prop].tone(t));
  }

  const roles = (scheme) => {
    const out = {};
    for (const [token, prop] of Object.entries(ROLES)) out[token] = hex(MDC[prop].getArgb(scheme));
    return out;
  };

  const p = light.primaryPalette;
  const tinted = (tone, chroma) => hex(Hct.from(p.hue, chroma, tone).toInt());

  const mode = (scheme, isDark) => {
    const color = roles(scheme);
    const sceneDefaults = isDark
      ? { 'scene-1': hex(scheme.primaryPalette.tone(50)), 'scene-2': hex(scheme.secondaryPalette.tone(40)), 'scene-3': hex(scheme.tertiaryPalette.tone(40)), 'scene-base': tinted(4, 6) }
      : { 'scene-1': hex(scheme.primaryPalette.tone(80)), 'scene-2': hex(scheme.secondaryPalette.tone(80)), 'scene-3': hex(scheme.tertiaryPalette.tone(80)), 'scene-base': tinted(93, 8) };
    Object.assign(color, sceneDefaults, spec.scene?.[isDark ? 'dark' : 'light']);
    // Role overrides: "palette:tone" (e.g. "primary:90") or a literal hex.
    for (const [role, ref] of Object.entries(spec.roles?.[isDark ? 'dark' : 'light'] || {})) {
      const m = /^(primary|secondary|tertiary|neutral|error):([0-9]+)$/.exec(ref);
      if (m) color[role] = hex(scheme[m[1] + 'Palette'].tone(+m[2]));
      else if (/^#[0-9a-f]{6}$/i.test(ref)) color[role] = upper(ref);
      else throw new Error(`Role override ${role}: "${ref}" is not #RRGGBB or palette:tone`);
    }

    const g = { ...GLASS_DEFAULTS[isDark ? 'dark' : 'light'] };
    g.base = isDark ? hex(scheme.neutralPalette.tone(10)) : '#FFFFFF';
    g.tint = isDark ? color['primary-container'] : color.primary === color['on-surface'] ? color['outline-variant'] : hex(scheme.primaryPalette.tone(80));
    g.shadow = isDark ? '#000000' : hex(scheme.primaryPalette.tone(10));
    Object.assign(g, spec.glass?.[isDark ? 'dark' : 'light']);
    // Stable key order so diffs stay readable.
    const glass = {};
    for (const k of ['base', 'tint', 'tint-alpha', 'alpha', 'blur', 'specular', 'rim', 'saturate', 'shadow', 'shadow-alpha']) if (g[k] !== undefined) glass[k] = g[k];
    return { color, glass };
  };

  return {
    $description: spec.description || `Generated from seed ${upper(spec.seed)} (${variantKey}).`,
    $source: stripUndefined({
      seed: upper(spec.seed), variant: variantKey, contrast: spec.contrast, secondary: spec.secondary, tertiary: spec.tertiary,
      neutral: spec.neutral, roles: spec.roles, scene: spec.scene, glass: spec.glass, description: spec.description
    }),
    palette,
    light: mode(light, false),
    dark: mode(dark, true)
  };
}

function stripUndefined(o) {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined));
}

// Dominant colour of an image, given raw RGBA pixels. Uses MCU's quantizer and scorer.
export function seedFromPixels(mcu, rgba) {
  const pixels = [];
  for (let i = 0; i < rgba.length; i += 4) {
    if (rgba[i + 3] < 255) continue;
    pixels.push(((255 << 24) | (rgba[i] << 16) | (rgba[i + 1] << 8) | rgba[i + 2]) >>> 0);
  }
  const quantized = mcu.QuantizerCelebi.quantize(pixels, 128);
  const ranked = mcu.Score.score(quantized);
  return upper(mcu.hexFromArgb(ranked[0]));
}

// WCAG helpers shared by scripts/contrast.mjs and the builder's live badges.
export const toRgb = (hex) => {
  if (!/^#?[0-9a-f]{6}$/i.test(hex || '')) throw new Error(`Invalid colour "${hex}"`);
  return [0, 2, 4].map((i) => parseInt(hex.replace('#', '').slice(i, i + 2), 16));
};
const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
export const luminance = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
export const ratio = (a, b) => { const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
export const over = (top, alpha, bottom) => top.map((c, i) => c * alpha + bottom[i] * (1 - alpha));

// Worst-case text colour behind a glass tier: thinnest point of the gradient (alpha - 0.12).
export function glassOver(glass, tier, backdropHex) {
  const a = Math.max(0, glass.alpha[tier] - 0.12);
  const tinted = over(toRgb(glass.tint), glass['tint-alpha'], toRgb(backdropHex));
  return over(toRgb(glass.base), a, tinted);
}

// ── Contrast rules ──
// Text pairs that must reach 4.5:1 (AA body text).
export const TEXT_PAIRS = [
  ['on-primary', 'primary'], ['on-primary-container', 'primary-container'],
  ['on-secondary', 'secondary'], ['on-secondary-container', 'secondary-container'],
  ['on-tertiary', 'tertiary'], ['on-tertiary-container', 'tertiary-container'],
  ['on-error', 'error'], ['on-error-container', 'error-container'],
  ['inverse-on-surface', 'inverse-surface'], ['inverse-primary', 'inverse-surface'],
  ...['surface', 'surface-container-lowest', 'surface-container-low', 'surface-container', 'surface-container-high', 'surface-container-highest']
    .flatMap((s) => [['on-surface', s], ['on-surface-variant', s], ['primary', s]])
];
// Non-text UI boundaries that must reach 3:1 (WCAG 1.4.11).
// Chart series (primary, secondary, tertiary, error) must also stand out from the surface.
export const UI_PAIRS = [['outline', 'surface'], ['outline', 'surface-container-high'], ['primary', 'surface-container-highest'],
  ['secondary', 'surface'], ['tertiary', 'surface'], ['error', 'surface'], ['on-surface-variant', 'surface']];
// Backdrops glass is checked against: the theme's own surfaces, containers and scene colours.
export const BACKDROPS = ['surface', 'surface-container-highest', 'primary-container', 'secondary-container', 'tertiary-container', 'scene-base', 'scene-1', 'scene-2', 'scene-3'];

/** Check one mode ({color, glass}) of a theme. Returns {checks, failures: [msg], worst}. */
export function checkMode({ color: c, glass: g }, extraBackdrops = []) {
  const failures = [];
  let checks = 0;
  let worst = Infinity;
  for (const [fg, bg] of TEXT_PAIRS) {
    checks++;
    const r = ratio(toRgb(c[fg]), toRgb(c[bg]));
    if (r < 4.5) failures.push(`${fg} on ${bg} = ${r.toFixed(2)} (needs 4.5)`);
  }
  for (const [fg, bg] of UI_PAIRS) {
    checks++;
    const r = ratio(toRgb(c[fg]), toRgb(c[bg]));
    if (r < 3) failures.push(`${fg} vs ${bg} = ${r.toFixed(2)} (needs 3.0)`);
  }
  const backdrops = [...BACKDROPS.map((b) => [b, c[b]]), ...extraBackdrops];
  for (let tier = 1; tier <= 4; tier++) {
    for (const [name, hex] of backdrops) {
      const glass = glassOver(g, tier, hex);
      for (const [fg, min] of [['on-surface', 4.5], ['on-surface-variant', tier >= 2 ? 4.5 : 3]]) {
        checks++;
        const r = ratio(toRgb(c[fg]), glass);
        worst = Math.min(worst, r);
        if (r < min) failures.push(`${fg} on glass tier ${tier} over ${name} = ${r.toFixed(2)} (needs ${min})`);
      }
    }
  }
  return { checks, failures, worst };
}
