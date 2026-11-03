---
title: Accessibility
description: Why glass interfaces usually fail accessibility, and how Material Glass is tested.
---

# Accessibility

Glass interfaces often fail people. Text sits on a background that changes with whatever scrolls behind it, so contrast that was fine in a mockup falls apart in real use. Material Glass is built to avoid that, and it tests for it.

## Contrast is computed through the glass

The contrast suite doesn't only check text against a theme colour. For every theme, mode, glass tier and text-safe glass preset, it:

1. takes the thinnest point of the glass gradient,
2. composites it with its tint over each backdrop the theme provides (surfaces, containers and scene colours),
3. checks body and secondary text against the result.

Text must reach 4.5:1, and boundaries must reach 3:1. The suite also checks every role pair, the chart colours, and a sweep of 72 generated themes. That adds up to over 22,000 checks on every commit, and any failure blocks the build.

Glass over an arbitrary photo can't be guaranteed, because nothing can. When you put glass over images, use a higher tier, the `milk` preset, or dim the scene with `--mg-scene-image-dim`.

## Glass steps aside

| When | What happens |
| --- | --- |
| `prefers-reduced-transparency` | Every glass surface becomes its solid Material surface container. |
| `data-mg-transparency="reduced"` | The same, as a switch in your own settings. |
| `prefers-contrast: more` | The surfaces are solid and borders get stronger. |
| `forced-colors` | System colours are used, with visible borders and highlighted selection. |
| No `backdrop-filter` support | The solid fallbacks are used. |
| `prefers-reduced-motion` | Springs, liquid stretch, shimmer and drifting scenes stop. |
| Print | Glass becomes paper, and navigation is hidden. |

## Real controls

Components are native elements wherever possible: `<button>`, `<input type="range">`, `<dialog>`, `<details>`, `[popover]` and `<select>`. Custom widgets follow the ARIA patterns:

- menus support arrow keys, Home and End, Escape, and return focus,
- tabs support arrow keys and roving `tabindex`,
- the date picker supports arrows, Page Up and Page Down, Home and End,
- the combobox uses `aria-activedescendant`,
- the split pane is a `separator` with values.

## How it's tested

| Test | What it checks |
| --- | --- |
| `npm test` | Every stylesheet parses, plus the contrast suite |
| `npm run test:a11y` | axe-core on every page and example in light and dark mode. No serious or critical violations are allowed. |
| `npm run test:interaction` | Keyboard and pointer behaviour of menus, tabs, pickers, combobox, command palette, tables, dialogs and toasts, and that no page throws errors |
| `npm run test:visual` | Screenshot comparison of the catalog in every theme, glass preset, density, shape, reduced transparency and right-to-left |
| `npm run test:packages` | Framework wrappers render the right ARIA and work with the keyboard |

## Right-to-left

Components use logical properties, so they mirror under `dir="rtl"`. Liquid indicators re-measure when the direction changes. Add `mg-flip-rtl` to icons that point forward or back, such as chevrons and arrows, to mirror them as well.
