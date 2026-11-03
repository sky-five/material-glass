---
title: JavaScript
description: What the optional script does, its attributes and its API.
---

# JavaScript

`material-glass.js` is optional and has no dependencies. It is about 12 KB gzipped. It enhances markup that already works: it never renders content you didn't write, except inside the pickers and the toast host. It initialises on load and also picks up elements added later, so it works with any framework or with HTML you fetch.

## Attributes

| Attribute | What it does |
| --- | --- |
| `data-mg-liquid` | On `.mg-nav`, `.mg-rail`, `.mg-segmented` or `.mg-tabs`, the selection flows between items like a drop. Use `"manual"` if you manage `aria-*` yourself. |
| `data-mg-refract` and friends | Edge refraction. See [Customization](customization.html#refraction). |
| `data-mg-top-bar` | The bar rises a glass tier when content scrolls under it. |
| `data-mg-sheet` / `dialog.mg-sheet` | Drag the handle to dismiss, or click the backdrop to close. |
| `data-mg-carousel` | Builds dots that track scroll, and wires the prev/next buttons. |
| `data-mg-command` | Ctrl/⌘+K opens the command palette, which filters as you type and supports arrow keys. |
| `.mg-menu[popover]` | Anchors to the button that opened it, supports arrow keys and returns focus. |
| `data-mg-tooltip-target` | Opens a rich tooltip popover on hover or focus. |
| `data-mg-combobox` | Filters a listbox as you type and highlights matches. |
| `data-mg-datepicker` | A calendar with full keyboard support. `data-value="YYYY-MM-DD"`, with `data-range` for ranges. |
| `data-mg-timepicker` | A dial time picker. `data-value="HH:MM"`, with `data-24h` for 24-hour time. |
| `data-mg-stepper` | − and + buttons around a number input. |
| `data-mg-dropzone` | Drag and drop files onto a file input. |
| `data-mg-tag-input` | Enter or a comma turns text into removable chips. |
| `table[data-mg-sortable]` | Click a header to sort. Numbers and currency sort numerically. |
| `table[data-mg-resizable]` | Drag column edges to resize. |
| `data-mg-split` | A resizable split pane that works with the pointer and the arrow keys. |
| `data-mg-kanban` | Drag cards between columns. |
| `data-mg-draggable` | Makes an element draggable within its parent, as with `.mg-lens`. |

Components that change value fire an `mg-change` event with the new value in `event.detail`.

## API

```js
MaterialGlass.init(element)          // initialise markup you added (usually automatic)
MaterialGlass.refresh()              // re-measure after layout changes
MaterialGlass.setTheme('ember', 'dark')
MaterialGlass.toast('Saved', { action: 'Undo', onAction() {}, duration: 4000 })
MaterialGlass.sparkline(element, [3, 5, 4, 8])
MaterialGlass.chartTheme()           // colours and fonts for Chart.js or any chart library
MaterialGlass.supportsRefraction     // true in Chromium
MaterialGlass.version
```

## Charts

`chartTheme()` reads the live theme, so charts match whatever theme is set:

```js
const t = MaterialGlass.chartTheme();
new Chart(ctx, {
  type: 'line',
  data: { datasets: [{ data, borderColor: t.series[0] }] },
  options: { color: t.text, scales: { x: { grid: { color: t.grid } } }, plugins: t.chartjs.plugins }
});
```

## Frameworks

There are wrappers for [React, Vue, Svelte and Web Components](frameworks.html), plus a Tailwind preset. They render the same markup, so everything on this page applies to them too.
