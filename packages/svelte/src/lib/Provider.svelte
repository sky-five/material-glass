<script>
  /** Material Glass theme scope. global applies to <html> so portals and the page background follow. */
  let { theme, mode, glass, density, shape, motion, font, global = false, children } = $props();
  const KEYS = ['theme', 'mode', 'glass', 'density', 'shape', 'motion', 'font'];
  let attrs = $derived.by(() => {
    const a = {};
    const v = { theme, mode, glass, density, shape, motion, font };
    for (const k of KEYS) if (v[k] && !(k === 'mode' && v[k] === 'auto')) a[`data-mg-${k}`] = v[k];
    return a;
  });
  $effect(() => {
    if (global) {
      const html = document.documentElement;
      for (const k of KEYS) html.removeAttribute(`data-mg-${k}`);
      for (const [k, val] of Object.entries(attrs)) html.setAttribute(k, val);
    }
    requestAnimationFrame(() => window.MaterialGlass?.refresh());
  });
</script>

{#if global}
  {@render children?.()}
{:else}
  <div style="display: contents" {...attrs}>{@render children?.()}</div>
{/if}
