# @material-glass/vue

Vue 3 components for [Material Glass](https://github.com/sky-five/material-glass). They're written as render functions, so there's no build step, and they support `v-model` throughout.

```bash
npm i material-glass @material-glass/vue
```

```js
import { createApp } from 'vue';
import 'material-glass/css';
import 'material-glass/js';
import MaterialGlass from '@material-glass/vue';

createApp(App).use(MaterialGlass).mount('#app');
```

```vue
<template>
  <MgProvider theme="sea-glass" mode="dark" global>
    <MgCard headline="Library">
      <MgTabs label="Library" v-model="tab" :items="[{ value: 'songs', label: 'Songs' }, { value: 'albums', label: 'Albums' }]" />
      <MgTabPanel value="songs" :current="tab">…</MgTabPanel>
      <MgSwitch label="Wi-Fi" v-model="wifi" />
      <MgTextField label="Name" v-model="name" />
      <template #actions><MgButton>Play</MgButton></template>
    </MgCard>
  </MgProvider>
</template>
```

**Components:** `MgProvider`, `MgGlass`, `MgCard`, `MgButton`, `MgIconButton`, `MgChip`, `MgSwitch`, `MgSlider`, `MgTextField`, `MgSegmented`, `MgTabs`, `MgTabPanel`, `MgDialog`, `MgNav`, `MgNavItem`.

**Helpers:** the `v-mg-liquid` directive and `useMaterialGlassTheme()`, which returns `set()` and `toast()`.

`app.use()` registers everything globally. You can also import each component by name.

MIT
