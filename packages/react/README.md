# @material-glass/react

Typed React components for [Material Glass](https://github.com/sky-five/material-glass). They render the same markup as the plain-HTML library, so the CSS does the work and there is nothing to configure.

```bash
npm i material-glass @material-glass/react
```

```tsx
import 'material-glass/css';
import 'material-glass/js'; // optional: liquid motion, refraction, menus
import { MaterialGlassProvider, Card, Button, Switch, Tabs, TabPanel } from '@material-glass/react';

export function App() {
  const [tab, setTab] = useState('songs');
  const [wifi, setWifi] = useState(true);
  return (
    <MaterialGlassProvider theme="sea-glass" mode="dark" global>
      <Card headline="Library" actions={<Button>Play</Button>}>
        <Tabs label="Library" value={tab} onChange={setTab} items={[{ value: 'songs', label: 'Songs' }, { value: 'albums', label: 'Albums' }]} />
        <TabPanel value="songs" current={tab}>…</TabPanel>
        <Switch label="Wi-Fi" checked={wifi} onCheckedChange={setWifi} />
      </Card>
    </MaterialGlassProvider>
  );
}
```

## Components

`MaterialGlassProvider` · `Glass` · `Card` · `Button` · `IconButton` · `Fab` · `Chip` · `Switch` · `Slider` · `TextField` · `Select` · `Segmented` · `Tabs` / `TabPanel` · `NavBar` / `NavItem` · `Dialog` · `Progress` · `CircularProgress` · `Badge` · `Avatar` · `Skeleton`

Hooks: `useMaterialGlass(ref)` initialises the script's behaviour inside an element. `useToast()` returns `MaterialGlass.toast`.

- Components that hold state are controlled when you pass the value and uncontrolled otherwise.
- `Button` defaults to `type="button"`, and refs are forwarded.
- The bundle starts with `'use client'`, so it works with React Server Components.
- For any other component, use the library's class names on plain elements. Everything in the catalog works in JSX as is.

MIT
