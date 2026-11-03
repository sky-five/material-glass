# @material-glass/svelte

Svelte 5 components for [Material Glass](https://github.com/sky-five/material-glass). They use runes and `$bindable` props, and include a `use:liquid` action.

```bash
npm i material-glass @material-glass/svelte
```

```svelte
<script>
  import 'material-glass/css';
  import 'material-glass/js';
  import { Provider, Card, Button, Switch, Tabs, TabPanel, TextField } from '@material-glass/svelte';
  let tab = $state('songs');
  let wifi = $state(true);
  let name = $state('');
</script>

<Provider theme="sea-glass" mode="dark" global>
  <Card headline="Library">
    <Tabs label="Library" bind:value={tab} items={[{ value: 'songs', label: 'Songs' }, { value: 'albums', label: 'Albums' }]} />
    <TabPanel value="songs" current={tab}>…</TabPanel>
    <Switch label="Wi-Fi" bind:checked={wifi} />
    <TextField label="Name" bind:value={name} />
    {#snippet actions()}<Button>Play</Button>{/snippet}
  </Card>
</Provider>
```

**Components:** `Provider`, `Glass`, `Card`, `Button`, `Chip`, `Switch`, `Slider`, `TextField`, `Segmented`, `Tabs`, `TabPanel`, `Dialog`, `Nav`, `NavItem`.

**Helpers:** `use:liquid`, `setTheme()` and `toast()`.

Every component compiles with no warnings, accessibility warnings included.

MIT
