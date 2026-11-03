# Launch checklist (owner actions)

These steps need the owner's accounts, or they publish something publicly. Everything else is in the repository.

## 1. Tag and release v0.2.0

```bash
git tag -a v0.2.0 -m "Material Glass v0.2.0"
git push origin v0.2.0
```

The Release workflow rebuilds, runs every test, and creates the GitHub release from `CHANGELOG.md`. After that, `https://cdn.jsdelivr.net/gh/sky-five/material-glass@0.2.0/…` works.

## 2. Publish to npm (optional)

1. Log in and create the scope:

   ```bash
   npm login
   npm org create material-glass
   ```

2. Create an automation token on npmjs.com and save it as the `NPM_TOKEN` repository secret.
3. Re-run the Release workflow, or tag the next version. It publishes `material-glass` and the five `@material-glass/*` packages, with provenance.

## 3. GitHub community settings

```bash
gh repo edit sky-five/material-glass --enable-discussions --description "Material 3 on Liquid Glass: 8 themes, a theme generator, 60+ components, refraction and liquid motion. WCAG-tested." --homepage "https://sky-five.github.io/material-glass/"
gh label create "good first issue" --color 7057ff --repo sky-five/material-glass --force
gh label create theme --color 26A69A --repo sky-five/material-glass --force
gh label create component --color 4355B2 --repo sky-five/material-glass --force
```

Upload `docs/media/social.jpg` under **Settings → General → Social preview**.

## 4. Starter issues ("good first issue")

| Title | Body |
| --- | --- |
| Add a `mg-badge--outlined` variant | Outlined badge for low-emphasis status. Use `--mg-outline` for the border. Add it to the catalog's Chips and badges card. |
| Wavy circular progress | Match the linear `mg-progress--wavy` with a wavy ring for `mg-progress-circle`. It must respect reduced motion. |
| `mg-chip` with a leading avatar | Support `<span class="mg-avatar mg-avatar--sm">` inside chips with correct padding. |
| Keyboard reorder in kanban | Let a focused card move between columns with Alt+Arrow keys, and announce it through a live region. |
| Time picker keyboard support | Arrow keys should move around the dial and Enter should select. Add an interaction test. |
| `data-mg-datepicker` min/max | Support `data-min` and `data-max`, disabling out-of-range days. |
| Segmented control with icons only | Document and style icon-only segments, with an `aria-label` per segment. |
| Theme: "Lagoon" | Use the theme builder to propose a blue-green theme with a coral accent. Follow the Theme request form. |
| Docs: Astro guide | Add a short page showing Material Glass in Astro, using the CSS and the Web Components. |
| Tailwind: `glass-presets` utilities | Add `glass-milk`, `glass-smoked` and the rest to `@material-glass/tailwind`, generated from tokens. |

## 5. Figma Community

Import `dist/tokens/dtcg/*.tokens.json` into a Figma file, as described in the Design tools guide. Build glass effect styles from `figma-effects.json`, add a few components, and publish to Figma Community. Then link the file from the README.

## 6. Launch posts

The drafts for Show HN, Reddit and X are in `D:\projects\claude\material-glass-launch-posts.md`. Attach `docs/media/demo.mp4`. Update the numbers before posting: 8 themes, about 60 components, and 22,000+ contrast checks.

Directories to submit to once the npm packages are live: awesome-design-systems, awesome-css-frameworks, Design Systems Repo, CSS Weekly, Frontend Focus, Product Hunt.
