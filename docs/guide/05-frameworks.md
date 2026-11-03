---
title: Frameworks and Tailwind
description: Packages for React, Vue, Svelte, Web Components and Tailwind CSS.
---

# Frameworks and Tailwind

Every package renders the library's own markup, so the CSS stays the single source of styling. Each one is tested with live apps in Chrome.

| Package | For |
| --- | --- |
| `@material-glass/react` | Typed components and hooks, `'use client'`, server-render safe |
| `@material-glass/vue` | Vue 3 components with `v-model`, a plugin and the `v-mg-liquid` directive |
| `@material-glass/svelte` | Svelte 5 components with runes, bindable props and `use:liquid` |
| `@material-glass/elements` | Web Components that use light DOM, with real native controls inside |
| `@material-glass/tailwind` | A Tailwind v3 preset and a v4 `@theme` file |

## React

```tsx
import 'material-glass/css';
import 'material-glass/js';
import { MaterialGlassProvider, Card, Button, Switch } from '@material-glass/react';

<MaterialGlassProvider theme="sea-glass" mode="dark" global>
  <Card headline="Settings" actions={<Button>Save</Button>}>
    <Switch label="Wi-Fi" checked={wifi} onCheckedChange={setWifi} />
  </Card>
</MaterialGlassProvider>
```

## Vue

```js
import MaterialGlass from '@material-glass/vue';
app.use(MaterialGlass);
```

```vue
<MgCard headline="Settings">
  <MgSwitch label="Wi-Fi" v-model="wifi" />
  <template #actions><MgButton>Save</MgButton></template>
</MgCard>
```

## Svelte

```svelte
<script>
  import { Card, Switch, Button } from '@material-glass/svelte';
  let wifi = $state(true);
</script>

<Card headline="Settings">
  <Switch label="Wi-Fi" bind:checked={wifi} />
  {#snippet actions()}<Button>Save</Button>{/snippet}
</Card>
```

## Web Components

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/@material-glass/elements@0.2/src/index.js"></script>

<mg-card headline="Settings">
  <mg-switch label="Wi-Fi" name="wifi" checked></mg-switch>
  <mg-button type="submit">Save</mg-button>
</mg-card>
```

## Tailwind

```css
/* v4 */
@import "tailwindcss";
@import "material-glass/css";
@import "@material-glass/tailwind/theme.css";
```

```html
<nav class="glass-3 rounded-full p-1.5 flex">
  <a class="px-4 py-2 rounded-full text-on-surface-variant liquid:text-primary" aria-current="page">Home</a>
</nav>
```

## Anything else

Any component in the [catalog](../components.html) works with plain class names in any framework: Angular, Solid, Qwik, htmx, server templates. The script auto-initialises elements added after load.
