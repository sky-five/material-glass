<script>
  import { Provider, Card, Button, Switch, Segmented, Tabs, TabPanel, Dialog, TextField, Chip, Slider, Nav, NavItem } from '../src/index.js';
  let on = $state(false);
  let view = $state('week');
  let tab = $state('songs');
  let open = $state(false);
  let closed = $state('');
  let name = $state('Ada');
  let chip = $state(false);
  let level = $state(30);
  let theme = $state('ember');
</script>

<Provider {theme} mode="dark">
  <main class="mg-scene" style="padding:24px">
    <Card headline="Svelte" id="card">
      <Switch id="sw" label="Wi-Fi" bind:checked={on} />
      <span id="sw-state">{String(on)}</span>
      <Segmented label="View" bind:value={view} options={[{ value: 'day', label: 'Day' }, { value: 'week', label: 'Week' }, { value: 'month', label: 'Month' }]} />
      <span id="view-state">{view}</span>
      <Tabs label="Library" bind:value={tab} items={[{ value: 'songs', label: 'Songs' }, { value: 'albums', label: 'Albums' }]} />
      <TabPanel value="songs" current={tab}>Songs panel</TabPanel>
      <TabPanel value="albums" current={tab}>Albums panel</TabPanel>
      <TextField id="name" label="Name" bind:value={name} />
      <span id="name-state">{name}</span>
      <Chip id="chip" bind:selected={chip}>Design</Chip>
      <Slider label="Level" bind:value={level} />
      <Nav label="Main"><NavItem current>Home</NavItem><NavItem>Search</NavItem></Nav>
      <Button id="open" onclick={() => (open = true)}>Open</Button>
      <Button id="theme" variant="tonal" onclick={() => (theme = 'frost')}>Frost</Button>
    </Card>
    <Dialog headline="Discard?" bind:open onclose={(v) => (closed = v || 'closed')}>
      Changes will be lost.
      {#snippet actions()}<button class="mg-btn mg-btn--text" value="keep" id="keep">Keep</button>{/snippet}
    </Dialog>
    <span id="closed">{closed}</span>
  </main>
</Provider>
