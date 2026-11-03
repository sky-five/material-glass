# @material-glass/elements

Web Components for [Material Glass](https://github.com/sky-five/material-glass). They use light DOM and have no dependencies. Each element renders a real native control inside itself, so forms, focus and keyboard behave like plain HTML.

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/material-glass@0.2/material-glass.min.css">
<script defer src="https://cdn.jsdelivr.net/npm/material-glass@0.2/material-glass.min.js"></script>
<script type="module" src="https://cdn.jsdelivr.net/npm/@material-glass/elements@0.2/src/index.js"></script>

<mg-theme theme="sea-glass" mode="dark" global></mg-theme>

<mg-card tier="2" headline="Settings">
  <form>
    <mg-text-field label="Email" type="email" name="email" supporting="We never share it"></mg-text-field>
    <mg-switch name="wifi" label="Wi-Fi" checked></mg-switch>
    <mg-slider name="volume" label="Volume" value="60"></mg-slider>
    <mg-segmented label="View" value="week">
      <mg-segment value="day">Day</mg-segment><mg-segment value="week">Week</mg-segment>
    </mg-segmented>
    <mg-button type="submit">Save</mg-button>
  </form>
</mg-card>

<mg-nav label="Main">
  <mg-nav-item icon="i-home" href="/" current>Home</mg-nav-item>
  <mg-nav-item icon="i-search" href="/search">Search</mg-nav-item>
</mg-nav>
```

## Elements

| Element | Attributes |
| --- | --- |
| `mg-theme` | `theme mode glass density shape motion font global` |
| `mg-button` | `variant` (filled, tonal, glass, outlined, text, danger), `size`, `icon`, `href`, `type`, `disabled` |
| `mg-icon-button` | `icon label toggle pressed tier` |
| `mg-fab` | `icon label`. Text inside makes it extended. |
| `mg-chip` | `selected` |
| `mg-switch` | `checked label name value disabled` |
| `mg-slider` | `min max step value label name disabled` |
| `mg-text-field` | `label type name value placeholder supporting error variant multiline required disabled` |
| `mg-glass`, `mg-card` | `tier`, `refract`. Cards also take `headline` and `variant`. |
| `mg-nav`, `mg-nav-item` | `label rail tier` · `icon href current label` |
| `mg-segmented`, `mg-segment` | `value label` · `value` |
| `mg-tabs`, `mg-tab` | `label secondary` · `panel` (the id of the panel element), `selected` |
| `mg-dialog` | `open headline variant`, with methods `show()` and `close(value)`. Put buttons in `slot="actions"`. |

`change` events fire on user changes. `mg-switch`, `mg-slider` and `mg-text-field` submit with their form.

MIT
