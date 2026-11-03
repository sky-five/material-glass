# 3. One theme engine for CLI, builder and apps

**Status:** accepted (v0.2)

## Context

Themes are generated in three places: the CLI that writes the tokens, the in-browser theme builder, and apps that re-theme at runtime, like the music example. If each had its own logic, they would drift apart.

## Decision

`src/theme-core.js` is a dependency-free ES module. It receives Material Color Utilities as a parameter and exports `makeTheme`, `themeToCss`, `checkMode` and the WCAG helpers. Node passes the npm package, and the browser passes the CDN module. The build's CSS output and the contrast suite use the same functions.

## Consequences

- A theme built in the browser is byte-for-byte what the CLI would produce.
- Live contrast badges in the builder are the same checks CI runs.
- The engine ships in the npm package (`material-glass/theme-core`), so apps can generate themes too.
