# Changelog

All notable changes to Material Glass. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/). Until 1.0, minor versions may change class names or tokens; every such change is listed here.

## [0.2.0] - 2026-11-02

### Added

- **Six new themes**, each light and dark: Obsidian, Frost, Ember, Aurora, Mono and Sand.
- **Theme generator.** `npm run themes` builds themes from a seed colour or a photo with Material Color Utilities (`scripts/theme.mjs`, `tokens/themes.config.json`).
- **Theme builder page** (`builder.html`). Pick a seed or drop in a photo, tune the glass, see live WCAG results, then copy CSS, tokens or config, download a CSS file, or share a link.
- **Customization attributes** on `<html>` or any container: `data-mg-glass` (frosted, milk, smoked, crystal, clear, paper), `data-mg-density`, `data-mg-shape`, `data-mg-motion`, `data-mg-font`, `data-mg-type="fluid"`, `data-mg-specular="pointer"`.
- **Scenes**: `.mg-scene--orbs`, `--grid`, `--noise`, `--image`, `--video`.
- **About 45 new components**: top app bars, drawers, tabs, bottom and side sheets, breadcrumbs, pagination, field variants with validation and counters, select (customizable where supported), menus, combobox, date and range picker, time picker, range and vertical sliders, stepper, drop zone, colour input, rating, tag input, linear (incl. wavy) and circular progress, skeletons, tooltips (plain and rich), toasts, banners, empty states, loading overlay, card variants, accordion, dividers, carousel, popover, command palette, split pane, sortable and resizable tables, description list, stat tiles, CSS bar charts, sparklines, legends, timeline, kanban, calendar, tree, avatar groups and status, count and dot badges, figure captions, video and audio players, dialog variants, scrim, layout primitives and app shells.
- **JavaScript** for the new components, plus refraction profiles (`data-mg-refract-profile="lens|ripple"`), chromatic aberration (`data-mg-chroma`), `MaterialGlass.toast()`, `sparkline()`, `chartTheme()` and auto-initialisation of elements added after load.
- **Builds**: `material-glass.min.css`, `material-glass.min.js`, `dist/material-glass.core.css` with one file per component group in `dist/components/`, `dist/material-glass.unlayered.css`, and `--prefix` builds. `dist/themes.json` lists themes and glass presets.
- **Component catalog** (`components.html`) and **five example apps**: weather, music (re-themes from album art), analytics dashboard, settings and a landing page template.
- **Print stylesheet**: glass becomes paper, navigation is hidden.
- **Tests**: Lightning CSS parses every stylesheet in CI; the contrast suite now covers 8 themes, every text-safe glass preset and a 72-seed generator sweep (22,256 checks).
- npm packaging with `exports` for CSS, JS, tokens, the theme engine and per-component files.
- **Framework packages**: `@material-glass/react`, `@material-glass/vue`, `@material-glass/svelte`, `@material-glass/elements` (Web Components) and `@material-glass/tailwind` (a v3 preset and a v4 theme).
- **Design tokens for tools and platforms**: W3C Design Tokens files for Figma and Penpot, a Tokens Studio file, Figma glass effect recipes, and Swift, Kotlin/Compose and Dart/Flutter colour tokens built with Style Dictionary.
- **Per-component custom properties** such as `--mg-btn-radius`, `--mg-card-padding`, `--mg-field-height` and `--mg-tabs-indicator`.
- **Docs site** (`guide/`): getting started, theming, customization, JavaScript, frameworks, design tools, accessibility, migration from MUI, Vuetify and Material Web, and principles, with search and generated reference tables.
- **Right-to-left support**: logical properties throughout, `mg-flip-rtl` for directional icons, and indicators that re-measure when the direction changes.
- **Experimental**: `data-mg-light="pointer|tilt"` gives every glass highlight one light angle. `setTheme(…, { transition: true })` crossfades with View Transitions. Top bars rise a tier on scroll without the script, using scroll-driven animations.
- **Browser tests in CI**: axe-core on every page in both modes, interaction tests, visual regression baselines, and tests for each framework package.
- Launch media (`docs/media/demo.gif`, `demo.mp4`, `social.jpg`), a contributing guide, code of conduct, security policy, issue forms and architecture decision records.

### Changed

- All CSS ships inside cascade layers (`mg.tokens`, `mg.base`, `mg.components`, `mg.customize`, `mg.a11y`), so your own styles win without `!important`. If your site has unlayered resets such as `a { color: inherit }`, use `dist/material-glass.unlayered.css`.
- Component sizes follow `--mg-density-step`, radii follow the shape tokens, and press feedback follows `--mg-motion-press`.
- The source is split into `src/base.css`, `src/components/*.css`, `src/customize.css` and `src/a11y.css`.

### Fixed

- The `hidden` attribute, closed `<dialog>`s and closed popovers can no longer be shown by component display rules.

## [0.1.0] - 2026-11-01

First public release: Sea Glass and Prism themes, five glass tiers, about 20 components, edge refraction and liquid selection, WCAG contrast checks in CI.

[0.2.0]: https://github.com/sky-five/material-glass/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/sky-five/material-glass/releases/tag/v0.1.0
