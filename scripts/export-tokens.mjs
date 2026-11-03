// Exports Material Glass tokens for design tools and other platforms.
//
//   dist/tokens/dtcg/*.tokens.json   W3C Design Tokens (DTCG), one file per collection and mode.
//                                    Figma: Variables → Import, pick a collection's files (one per mode).
//                                    Penpot: Tokens → Import.
//   dist/tokens/tokens-studio.json   Tokens Studio for Figma: one set per theme/mode plus $themes.
//   dist/tokens/figma-effects.json   Recipes for the five glass effect styles (blur, fill, highlights).
//
// Then `npm run tokens:platforms` runs Style Dictionary on the DTCG files for iOS, Android and Flutter.
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const tokens = JSON.parse(readFileSync(join(root, 'tokens/material-glass.tokens.json'), 'utf8'));
const out = join(root, 'dist/tokens');
rmSync(out, { recursive: true, force: true });
mkdirSync(join(out, 'dtcg'), { recursive: true });

const label = (id) => id.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');
const write = (file, data) => writeFileSync(join(out, file), JSON.stringify(data, null, 2) + '\n');
const color = (hex, description) => ({ $type: 'color', $value: hex.toUpperCase(), ...(description ? { $description: description } : {}) });
const number = (v) => ({ $type: 'number', $value: v });
const dimension = (px) => ({ $type: 'dimension', $value: `${px}px` });

const ROLE_GROUPS = {
  primary: ['primary', 'on-primary', 'primary-container', 'on-primary-container', 'inverse-primary'],
  secondary: ['secondary', 'on-secondary', 'secondary-container', 'on-secondary-container'],
  tertiary: ['tertiary', 'on-tertiary', 'tertiary-container', 'on-tertiary-container'],
  error: ['error', 'on-error', 'error-container', 'on-error-container'],
  surface: ['surface', 'on-surface', 'on-surface-variant', 'surface-container-lowest', 'surface-container-low', 'surface-container', 'surface-container-high', 'surface-container-highest', 'inverse-surface', 'inverse-on-surface'],
  outline: ['outline', 'outline-variant'],
  scene: ['scene-1', 'scene-2', 'scene-3', 'scene-base']
};

const rgbaHex = (hex, alpha) => hex.toUpperCase() + Math.round(alpha * 255).toString(16).padStart(2, '0').toUpperCase();

function modeTokens(theme, mode) {
  const { color: c, glass: g } = theme[mode];
  const roles = {};
  for (const [group, list] of Object.entries(ROLE_GROUPS)) {
    roles[group] = {};
    for (const r of list) if (c[r]) roles[group][r] = color(c[r]);
  }
  const blur = g.blur || tokens['glass-tier'].blur;
  const glass = {
    base: color(g.base, 'Glass fill colour. Opacity comes from the tier.'),
    tint: color(g.tint),
    'tint-alpha': number(g['tint-alpha']),
    specular: number(g.specular),
    rim: number(g.rim),
    saturate: number(g.saturate),
    shadow: color(g.shadow),
    'shadow-alpha': number(g['shadow-alpha'])
  };
  for (let i = 0; i < 5; i++) {
    glass[`tier-${i}`] = {
      fill: color(rgbaHex(g.base, g.alpha[i]), `Glass tier ${i}: base colour at ${Math.round(g.alpha[i] * 100)}% opacity`),
      alpha: number(g.alpha[i]),
      blur: dimension(blur[i])
    };
  }
  return { color: roles, glass };
}

// ── DTCG: one file per collection/mode ──
const files = [];
for (const [id, theme] of Object.entries(tokens.themes)) {
  for (const mode of ['light', 'dark']) {
    const file = `dtcg/color.${id}.${mode}.tokens.json`;
    write(file, { $description: `Material Glass · ${label(id)} · ${mode}. Collection "Material Glass", mode "${label(id)} ${label(mode)}".`, ...modeTokens(theme, mode) });
    files.push(file);
  }
}
const palette = {};
for (const [id, theme] of Object.entries(tokens.themes)) {
  palette[id] = {};
  for (const [key, tones] of Object.entries(theme.palette)) {
    palette[id][key] = {};
    for (const [tone, hex] of Object.entries(tones)) palette[id][key][tone] = color(hex);
  }
}
write('dtcg/palette.tokens.json', { $description: 'Material Glass reference palettes: 13 tones per key colour, per theme.', palette });

const shape = {};
for (const [k, v] of Object.entries(tokens.shape)) shape[k] = dimension(v);
const type = {};
for (const k of ['display', 'headline', 'title', 'body', 'label']) {
  const s = tokens.type[k];
  type[k] = {
    $type: 'typography',
    $value: { fontFamily: k === 'body' || k === 'label' ? 'Inter' : 'Figtree', fontSize: `${s.size}px`, lineHeight: s.line / s.size, fontWeight: s.weight, letterSpacing: s.tracking === '0' ? '0px' : s.tracking }
  };
}
const motion = {
  'duration-short': { $type: 'duration', $value: `${tokens.motion['duration-short']}ms` },
  'duration-medium': { $type: 'duration', $value: `${tokens.motion['duration-medium']}ms` },
  'duration-long': { $type: 'duration', $value: `${tokens.motion['duration-long']}ms` },
  'ease-standard': { $type: 'cubicBezier', $value: [0.2, 0, 0, 1] },
  'ease-emphasized': { $type: 'cubicBezier', $value: [0.3, 0, 0, 1.15] }
};
const state = Object.fromEntries(Object.entries(tokens.state).map(([k, v]) => [k, number(v)]));
write('dtcg/base.tokens.json', { $description: 'Material Glass base tokens: shape, type, motion, state layers.', shape, type, motion, state });

// ── Tokens Studio ──
const studio = { $metadata: { tokenSetOrder: ['base'] }, $themes: [], base: { shape, type, motion, state } };
for (const [id, theme] of Object.entries(tokens.themes)) {
  for (const mode of ['light', 'dark']) {
    const set = `${id}/${mode}`;
    studio[set] = modeTokens(theme, mode);
    studio.$metadata.tokenSetOrder.push(set);
    studio.$themes.push({ id: set, name: `${label(id)} ${label(mode)}`, group: 'Material Glass', selectedTokenSets: { base: 'source', [set]: 'enabled' } });
  }
}
// Tokens Studio uses "value"/"type" (it reads $value/$type too, but older versions need these).
const legacy = (o) => (o && typeof o === 'object' && !Array.isArray(o) ? Object.fromEntries(Object.entries(o).map(([k, v]) => [k === '$value' ? 'value' : k === '$type' ? 'type' : k === '$description' ? 'description' : k, legacy(v)])) : o);
write('tokens-studio.json', { ...legacy(studio), $themes: studio.$themes, $metadata: studio.$metadata });

// ── Figma effect style recipes ──
const effects = {};
for (const [id, theme] of Object.entries(tokens.themes)) {
  for (const mode of ['light', 'dark']) {
    const g = theme[mode].glass;
    const blur = g.blur || tokens['glass-tier'].blur;
    effects[`${label(id)} ${label(mode)}`] = [0, 1, 2, 3, 4].map((i) => ({
      name: `Glass/${i}`,
      fills: [
        { type: 'SOLID', color: g.tint, opacity: g['tint-alpha'] },
        { type: 'GRADIENT_LINEAR', angle: 135, stops: [{ color: g.base, opacity: Math.min(1, g.alpha[i] + 0.08) }, { color: g.base, opacity: Math.max(0, g.alpha[i] - 0.12) }] }
      ],
      effects: [
        { type: 'BACKGROUND_BLUR', radius: blur[i] },
        { type: 'INNER_SHADOW', color: '#FFFFFF', opacity: +([0.35, 0.5, 0.65, 0.8, 0.9][i] * g.specular).toFixed(3), offset: { x: 0, y: 1 }, radius: 0 },
        { type: 'DROP_SHADOW', color: g.shadow, opacity: g['shadow-alpha'], offset: { x: 0, y: tokens['glass-tier']['shadow-y'][i] }, radius: tokens['glass-tier']['shadow-blur'][i] }
      ],
      stroke: { color: '#FFFFFF', opacity: g.rim, weight: 1, align: 'INSIDE' }
    }));
  }
}
write('figma-effects.json', { $description: 'Glass tiers as Figma layer recipes: fills, effects and stroke, per theme and mode. Apply to a frame and save as an effect/fill style.', themes: effects });

console.log(`dist/tokens: ${files.length} DTCG colour files, palette, base, Tokens Studio (${studio.$themes.length} themes), Figma effect recipes`);
