---
title: Customization
description: Glass presets, density, shape, motion, fonts, scenes and per-component variables.
---

# Customization

Every switch is a data attribute. Put it on `<html>` for the whole page, or on any container to change one part. Try them all from the Customize button in the top bar.

## Glass presets: `data-mg-glass`

<!-- @presets-table -->

Presets marked text-safe are contrast-checked on every theme and mode, just like the themes. Use `clear` for decorative surfaces and large display text only.

## Density: `data-mg-density`

`comfortable` (default), `compact` and `dense`. Each step makes controls 4px shorter, following Material's density scale. Buttons, fields, chips, list items, navigation, tables and sheets all follow it.

## Shape: `data-mg-shape`

`sharp`, `soft` (default), `round` and `squircle`. These change the whole radius scale. `squircle` uses `corner-shape: squircle` where the browser supports it.

## Motion: `data-mg-motion`

`none`, `calm`, `standard` (default) and `expressive`. Motion controls the spring curve and duration, how far pressed controls swell, and how far the liquid selection stretches. `prefers-reduced-motion` always wins and switches motion off.

## Type: `data-mg-font` and `data-mg-type`

Font packs are `system`, `inter`, `geist`, `jakarta`, `serif` (Fraunces headlines with Inter body) and `mono`. Material Glass doesn't load fonts, so add the matching webfont yourself. `data-mg-type="fluid"` scales the display, headline and title sizes smoothly between phone and desktop.

## Scenes

`mg-scene` gives you a mesh gradient from the theme's scene colours. The variants are:

| Class | Look |
| --- | --- |
| `mg-scene--orbs` | Slowly drifting blurred orbs. These stop for reduced motion. |
| `mg-scene--grid` | A subtle grid under the gradient |
| `mg-scene--noise` | Stronger film grain |
| `mg-scene--image` | Your image, set in `--mg-scene-image`, dimmed by `--mg-scene-image-dim` |
| `mg-scene--video` | A muted looping `<video class="mg-scene__video">` behind the content |

## Refraction

The script adds real edge refraction in Chromium browsers. Other browsers keep the frosted blur.

```html
<div class="mg-glass-3" data-mg-refract="24" data-mg-bezel="18"></div>
<div class="mg-lens" data-mg-draggable data-mg-refract="28" data-mg-refract-profile="lens"></div>
```

| Attribute | Effect |
| --- | --- |
| `data-mg-refract` | Edge strength in px (default 28) |
| `data-mg-bezel` | Width of the bending edge in px (default 16) |
| `data-mg-magnify` | Zoom across the face, from 0 to 0.5 |
| `data-mg-refract-profile` | `edge`, `lens` or `ripple` |
| `data-mg-chroma` | Chromatic aberration at the rim, from 0 to 1 |
| `data-mg-specular="pointer"` | A highlight that follows the pointer (all browsers) |

## Per-component variables

Set these on a component, a container or `:root`. Each falls back to the system token shown.

<!-- @vars-table -->

## Your own CSS

Material Glass lives in cascade layers, so any rule you write wins without `!important`:

```css
.my-toolbar { --mg-nav-radius: 20px; }
.mg-btn { text-transform: uppercase; }
```
