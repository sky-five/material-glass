---
title: Theming
description: Eight built-in themes, a generator for your own, and how theme tokens work.
---

# Theming

A theme is a full Material 3 colour scheme for light and dark, plus glass settings for each mode. Set it with `data-mg-theme` on `<html>` or on any container. Containers can use a different theme from the page.

```html
<html data-mg-theme="aurora">
  <aside data-mg-theme="obsidian" data-mg-mode="dark">…</aside>
</html>
```

## Built-in themes

<!-- @themes-table -->

Every theme and mode passes WCAG AA for text, including text on every glass tier composited over the theme's own backgrounds. The [contrast suite](accessibility.html) checks this on every commit.

## Colour roles

Components use Material 3 roles. They never use raw colours.

| Role | Used for |
| --- | --- |
| `primary` / `on-primary` | Main actions, selection, focus rings |
| `*-container` / `on-*-container` | Tonal buttons, chips, selected items, avatars |
| `secondary`, `tertiary` | Supporting accents, chart series |
| `error` | Errors and destructive actions |
| `surface`, `surface-container-*` | Solid surfaces and the glass fallbacks |
| `on-surface`, `on-surface-variant` | Body text and secondary text |
| `outline`, `outline-variant` | Borders and dividers |
| `scene-1/2/3`, `scene-base` | The ambient background glass sits on |

Each role is a variable such as `--mg-primary`, with an RGB triplet `--mg-primary-rgb` for alpha: `rgb(var(--mg-primary-rgb) / 0.3)`. The 13-tone reference palettes are available as `--mg-ref-primary-40` and so on.

## Make your own theme

The quickest way is the [theme builder](../builder.html). Pick a seed colour or drop in a photo, adjust the glass, then copy the CSS. It shows live WCAG results as you go.

To build a theme into a fork of the library, add a spec to `tokens/themes.config.json`, or use the CLI:

```bash
npm run themes -- --name lagoon --seed "#1E88E5" --variant vibrant
npm run themes -- --name sunset --from-image photo.png
npm run build && npm test
```

The generator uses Google's Material Color Utilities. It covers every scheme variant (tonal spot, vibrant, expressive, fidelity, content, neutral, monochrome, rainbow and fruit salad) and supports overrides for the secondary, tertiary and neutral palettes and individual roles.

A spec looks like this:

```json
"lagoon": {
  "seed": "#1E88E5",
  "variant": "tonal-spot",
  "tertiary": "#26A69A",
  "neutral": { "hue": 240, "chroma": 4 },
  "glass": {
    "light": { "tint-alpha": 0.08 },
    "dark": { "alpha": [0.36, 0.48, 0.6, 0.7, 0.8] }
  }
}
```

The test suite also runs a generator sweep: 72 seeds across every hue, with no manual edits. Every one passes, so any seed you choose gives you a usable theme.

## Theme in JavaScript

```js
MaterialGlass.setTheme('ember', 'dark'); // or 'light', 'auto'
```

The script re-measures refraction and liquid indicators when the theme changes.
