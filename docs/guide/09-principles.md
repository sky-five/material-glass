---
title: Principles
description: The ideas behind Material Glass, and the versioning policy.
---

# Principles

## 1. Glass is elevation

Material's five surface containers become five glass tiers. They keep the same roles and order, but depth comes from blur, opacity and light instead of tint. Something that floats higher is clearer and brighter, which is how physical glass behaves.

## 2. State is light

Material's state-layer percentages are kept, but the layer is light falling from the top edge. Pressed glass brightens and swells slightly on a spring. It never darkens.

## 3. Selection is a drop

The selected item in a nav bar, segmented control or tab bar is one lit pane. When the selection changes, it flows to the next item, stretching mid-flight like liquid. It doesn't pop in place.

## 4. Glass steps aside

When transparency is unwanted or unavailable, every surface becomes its matching solid Material surface. That covers reduced transparency, high contrast, forced colours, older browsers and print. Text contrast is tested, not hoped for.

## 5. The platform does the work

Components use native elements (`dialog`, `popover`, `details`, `select`, `input`) and plain CSS. The script is optional and only adds behaviour. Framework packages render the same markup.

## Versioning

Material Glass follows [Semantic Versioning](https://semver.org).

- **Before 1.0**, a minor version (0.3, 0.4) may rename classes or tokens. Every rename is listed in the [changelog](https://github.com/sky-five/material-glass/blob/main/CHANGELOG.md) with what to change.
- **After 1.0**, renames need a major version. Deprecated names keep working for at least one minor version and are flagged in the changelog.
- **npm tags**: `latest` is the current release, and `next` is a preview of the coming minor.

1.0 ships when all of these are true:

- every Material 3 component is covered,
- the React and Web Components wrappers are complete,
- the docs site is complete,
- visual regression has stayed green for a full minor cycle.
