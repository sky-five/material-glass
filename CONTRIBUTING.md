# Contributing to Material Glass

Thanks for helping. Small, focused pull requests are the easiest to review and merge.

## Set up

```bash
git clone https://github.com/sky-five/material-glass
cd material-glass
npm install
npm run build
npm test
```

Open `index.html`, `components.html` or any page in `examples/` with a static server. For example, `npx serve .` or `python -m http.server`.

## How the project fits together

| You want to change | Edit | Then run |
| --- | --- | --- |
| Colours, glass values, type, shape, motion | `tokens/material-glass.tokens.json` | `npm run build && npm test` |
| A generated theme (Obsidian, Frost, …) | `tokens/themes.config.json` | `npm run themes && npm run build && npm test` |
| A component's CSS | `src/components/<group>.css` | `npm run build` |
| Customization attributes | `src/customize.css` | `npm run build` |
| Accessibility fallbacks | `src/a11y.css` or the `/* @a11y */` part of a component file | `npm run build` |
| Behaviour | `material-glass.js` | `npm run build` (writes the minified file) |
| Docs | `docs/guide/*.md` | `npm run build` |
| A framework wrapper | `packages/<name>/` | `npm run build:packages && npm run test:packages` |

Never edit `material-glass.css`, `material-glass.min.*`, `dist/`, `guide/` or `demo/themes.js` by hand. CI rebuilds them and fails if they differ from what's committed.

## Checks

| Command | What it checks |
| --- | --- |
| `npm test` | Every stylesheet parses, and over 22,000 WCAG contrast checks pass |
| `npm run test:a11y` | axe-core on every page in light and dark mode |
| `npm run test:interaction` | Keyboard and pointer behaviour, and no page errors |
| `npm run test:visual` | Screenshot comparison. Use `-- --update` after an intended visual change. |
| `npm run test:packages` | The framework wrappers |

Browser tests use the Chrome already on your machine. Set `CHROME_PATH` if it isn't found. Visual baselines are stored per platform, and CI keeps the Linux set up to date.

## Rules of thumb

- **Use roles, not colours.** Components use `--mg-*` roles. A new colour must be a role in every theme, and it must pass the contrast suite.
- **Native first.** Reach for `<button>`, `<dialog>`, `popover`, `<details>` and `<input>` before adding script.
- **The script is optional.** Every component must look right and work without `material-glass.js`.
- **Glass steps aside.** New translucent surfaces need a solid fallback in the a11y layer for reduced transparency, high contrast and forced colours.
- **Logical properties.** Use `inset-inline-start`, `margin-inline-end` and so on, so right-to-left layouts work.
- **Density, shape, motion.** Use `--mg-density-step`, the shape tokens and `--mg-motion-press`, so customization keeps working.
- **Add it to the catalog.** New components belong in `components.html` and get a visual test.

## Commits and pull requests

- Use one change per pull request, with a clear title in the imperative ("Add a stepper", "Fix menu focus").
- Add a line to `CHANGELOG.md` under "Unreleased".
- Include screenshots for visual changes, in light and dark.

## Releasing (maintainers)

1. Move "Unreleased" in `CHANGELOG.md` to the new version.
2. Bump `version` in `package.json` and in each `packages/*/package.json`.
3. Run `npm run build`, then commit and tag `vX.Y.Z`, then push the tag.

The release workflow creates the GitHub release from the changelog. It publishes to npm when the `NPM_TOKEN` secret is set.
