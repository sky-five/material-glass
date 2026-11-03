# @material-glass/tailwind

Material Glass for Tailwind CSS. Colour roles, radii, fonts, blur and motion become utilities that read the live `--mg-*` variables, so `bg-primary` follows every theme, mode and glass preset.

```bash
npm i material-glass @material-glass/tailwind
```

## Tailwind v4

```css
@import "tailwindcss";
@import "material-glass/css";
@import "@material-glass/tailwind/theme.css";
```

## Tailwind v3

```js
// tailwind.config.js
import materialGlass from '@material-glass/tailwind';

export default {
  presets: [materialGlass],
  content: ['./src/**/*.{html,js,jsx,tsx,vue,svelte}']
};
```

Load `material-glass.css` once in your app as well. It defines the variables the utilities point at.

## What you get

| Utility | Maps to |
| --- | --- |
| `bg-primary`, `text-on-surface`, `border-outline-variant`, … | Every Material 3 colour role. Opacity modifiers work: `bg-primary/40`. |
| `glass-0` … `glass-4` | The five glass tiers: blur, tint, rim and specular highlight. |
| `rounded-mg-xs` … `rounded-mg-xl` | Shape tokens, which follow `data-mg-shape`. |
| `font-display`, `font-body` | Type families, which follow `data-mg-font`. |
| `ease-spring`, `duration-spring` | The spring motion, which follows `data-mg-motion`. |
| `backdrop-blur-glass-0` … `-4` | Raw tier blur values. |
| `liquid:` variant | Styles the selected item (`aria-current`, `aria-selected`, `aria-pressed`). |
| `glass-reduced:` variant | Styles for reduced transparency. |

```html
<nav class="glass-3 rounded-full p-1.5 flex">
  <a class="px-4 py-2 rounded-full text-on-surface-variant liquid:text-primary" aria-current="page">Home</a>
</nav>
```

MIT · [Material Glass](https://github.com/sky-five/material-glass)
