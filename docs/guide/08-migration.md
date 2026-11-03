---
title: Migrating
description: Coming from MUI, Vuetify or Material Web.
---

# Migrating

Material Glass follows Material 3's roles and structure, so most concepts carry over directly. The main difference is that elevation is a glass tier rather than a tonal tint or a shadow.

## Concepts

| Material 3 | Material Glass |
| --- | --- |
| Surface container levels | Glass tiers `mg-glass-0` to `mg-glass-4` |
| Elevation level 0–5 | Pick the tier that matches the container level |
| State layers (hover 8%, pressed 12%) | The same percentages, drawn as light from the top edge |
| Dynamic color from a seed | `npm run themes -- --seed` or the theme builder, using the same Material Color Utilities |
| Density −1, −2 | `data-mg-density="compact"`, `"dense"` |
| Shape scale | `--mg-shape-xs…xl`, plus `data-mg-shape` presets |

## From MUI

| MUI | Material Glass |
| --- | --- |
| `<Button variant="contained">` | `<button class="mg-btn">` or React `<Button>` |
| `variant="outlined"` / `"text"` | `mg-btn--outlined` / `mg-btn--text` |
| `<Paper elevation={3}>` | `<div class="mg-card mg-glass-2">` |
| `<AppBar>` | `<header class="mg-top-bar mg-glass-1" data-mg-top-bar>` |
| `<BottomNavigation>` | `<nav class="mg-nav mg-glass-3" data-mg-liquid>` |
| `<Tabs>` | `<div class="mg-tabs" role="tablist" data-mg-liquid>` |
| `<Dialog>` | `<dialog class="mg-dialog mg-glass-3">` |
| `<Snackbar>` | `MaterialGlass.toast()` |
| `<Drawer>` | `<dialog class="mg-drawer mg-glass-3">` |
| `createTheme({ palette })` | A theme spec, or `data-mg-theme` |
| `sx={{ borderRadius: 2 }}` | `style="--mg-card-radius: 16px"` or your own CSS |

## From Vuetify

| Vuetify | Material Glass |
| --- | --- |
| `v-btn` | `MgButton` or `.mg-btn` |
| `v-card` | `MgCard` or `.mg-card.mg-glass-2` |
| `v-text-field` | `MgTextField` or `.mg-field` |
| `v-switch` | `MgSwitch` or `button.mg-switch[role=switch]` |
| `v-bottom-navigation` | `MgNav` or `.mg-nav` |
| `v-tabs` | `MgTabs` |
| `v-dialog` | `MgDialog` |
| `v-theme-provider` | `MgProvider` or `data-mg-theme` on any container |

## From Material Web (`<md-*>`)

| Material Web | Material Glass |
| --- | --- |
| `<md-filled-button>` | `<mg-button>` or `.mg-btn` |
| `<md-filled-tonal-button>` | `<mg-button variant="tonal">` |
| `<md-outlined-text-field>` | `<mg-text-field variant="outlined">` |
| `<md-switch>` | `<mg-switch>` |
| `<md-slider>` | `<mg-slider>` |
| `<md-tabs>` | `<mg-tabs>` |
| `<md-dialog>` | `<mg-dialog>` |
| `--md-sys-color-primary` | `--mg-primary` |
| `--md-sys-shape-corner-large` | `--mg-shape-lg` |

Material Glass uses light DOM, so your CSS reaches inside components without `::part`.
