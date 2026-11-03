---
title: Getting started
description: Add Material Glass to any page with one stylesheet and an optional script.
---

# Getting started

Material Glass is a CSS design system. It puts Material 3 colour roles, type and states on translucent glass surfaces. You don't need a build step or a framework. Link a stylesheet, pick a theme, and use the classes.

## Install

The fastest way is the CDN.

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/material-glass@0.2/material-glass.min.css">
<script defer src="https://cdn.jsdelivr.net/npm/material-glass@0.2/material-glass.min.js"></script>
```

Or install it from npm.

```bash
npm i material-glass
```

```js
import 'material-glass/css';
import 'material-glass/js'; // optional
```

The script is optional. Without it, everything still looks right. With it, you get liquid selection, edge refraction, anchored menus, pickers and the other interactive behaviour.

## Pick a theme

Set the theme on `<html>`. If you leave out `data-mg-mode`, the page follows the system's light or dark setting.

```html
<html data-mg-theme="sea-glass" data-mg-mode="dark">
```

There are eight built-in themes: `sea-glass`, `prism`, `obsidian`, `frost`, `ember`, `aurora`, `mono` and `sand`. Each comes in light and dark. You can also [build your own](../builder.html) from any colour or photo.

## Your first screen

Glass needs something behind it. Put `mg-scene` on the page or on a container, then place glass on top.

```html
<body class="mg-scene">
  <nav class="mg-nav mg-glass-3" data-mg-liquid aria-label="Main">
    <a class="mg-nav__item" href="/" aria-current="page">Home</a>
    <a class="mg-nav__item" href="/library">Library</a>
  </nav>

  <div class="mg-card mg-glass-2">
    <h2 class="mg-card__title">Welcome</h2>
    <p class="mg-card__body">Cards sit on glass tier 2.</p>
    <div class="mg-card__actions">
      <button class="mg-btn mg-btn--text">Later</button>
      <button class="mg-btn">Continue</button>
    </div>
  </div>
</body>
```

## Glass tiers

Material has five surface-container levels. Material Glass turns them into five glass tiers, `mg-glass-0` to `mg-glass-4`. A higher tier blurs more, is more opaque and has a brighter edge. Use higher tiers for things that float above others: bars, menus, sheets and dialogs.

| Tier | Use it for | Solid fallback |
| --- | --- | --- |
| `mg-glass-0` | Large background panels | surface-container-lowest |
| `mg-glass-1` | List rows, inputs, quiet chrome | surface-container-low |
| `mg-glass-2` | Cards | surface-container |
| `mg-glass-3` | Navigation bars, menus, sheets, dialogs | surface-container-high |
| `mg-glass-4` | The top-most object: command palette, stacked dialogs | surface-container-highest |

## Files you can load

| File | What it is |
| --- | --- |
| `material-glass.css` / `.min.css` | Everything: tokens, 8 themes, all components, customization, accessibility. |
| `dist/material-glass.core.css` | Tokens, glass, customization and accessibility, with no components. |
| `dist/components/*.css` | One file per component group, to pair with the core file. |
| `dist/material-glass.unlayered.css` | The same CSS without cascade layers. Use it if your site has unlayered resets such as `a { color: inherit }`. |
| `material-glass.js` / `.min.js` | Optional behaviour, about 12 KB gzipped. |

All the CSS sits in cascade layers (`mg.tokens`, `mg.base`, `mg.components`, `mg.customize`, `mg.a11y`), so your own styles always win without `!important`.

## Next

- [Theming](theming.html): themes, the generator and custom themes.
- [Customization](customization.html): glass presets, density, shape, motion and fonts.
- [Components](../components.html): every component, live.
