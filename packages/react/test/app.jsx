import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { MaterialGlassProvider, Card, Button, Switch, Segmented, Tabs, TabPanel, Dialog, TextField, NavBar, NavItem, Chip, Slider, CircularProgress } from '../dist/index.js';

function App() {
  const [on, setOn] = React.useState(false);
  const [view, setView] = React.useState('week');
  const [tab, setTab] = React.useState('songs');
  const [open, setOpen] = React.useState(false);
  const [closed, setClosed] = React.useState('');
  const [chip, setChip] = React.useState(false);
  const [theme, setTheme] = React.useState('ember');
  return (
    <MaterialGlassProvider theme={theme} mode="dark" density="compact">
      <main className="mg-scene" style={{ padding: 24, display: 'grid', gap: 16 }}>
        <Card headline="React" id="card" actions={<Button id="open" onClick={() => setOpen(true)}>Open</Button>}>
          <Switch id="sw" label="Wi-Fi" checked={on} onCheckedChange={setOn} />
          <span id="sw-state">{String(on)}</span>
          <Segmented label="View" value={view} onChange={setView} options={[{ value: 'day', label: 'Day' }, { value: 'week', label: 'Week' }, { value: 'month', label: 'Month' }]} />
          <span id="view-state">{view}</span>
          <Tabs label="Library" value={tab} onChange={setTab} items={[{ value: 'songs', label: 'Songs' }, { value: 'albums', label: 'Albums' }]} />
          <TabPanel value="songs" current={tab}>Songs panel</TabPanel>
          <TabPanel value="albums" current={tab}>Albums panel</TabPanel>
          <TextField label="Email" id="email" error="Enter a full address" defaultValue="a@" />
          <Chip id="chip" selected={chip} onSelectedChange={setChip}>Design</Chip>
          <Slider id="slider" label="Level" defaultValue={30} />
          <CircularProgress label="Loading" />
          <NavBar label="Main"><NavItem current>Home</NavItem><NavItem>Search</NavItem></NavBar>
          <Button id="theme" variant="tonal" onClick={() => setTheme('frost')}>Frost</Button>
        </Card>
        <Dialog open={open} onClose={(v) => { setOpen(false); setClosed(v || 'closed'); }} headline="Discard?" actions={<><Button variant="text" value="keep" type="submit" id="keep">Keep</Button></>}>Changes will be lost.</Dialog>
        <span id="closed">{closed}</span>
      </main>
    </MaterialGlassProvider>
  );
}
createRoot(document.getElementById('root')).render(<App />);
