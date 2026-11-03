<script>
  import { tick } from 'svelte';
  import { liquid } from './actions.js';
  let { value = $bindable(), items, label, secondary = false, idPrefix = 'mg-tabs' } = $props();
  let root;
  async function onkeydown(e) {
    if (e.defaultPrevented) return; // material-glass.js already handled it
    const i = items.findIndex((t) => t.value === value);
    const n = e.key === 'ArrowRight' ? (i + 1) % items.length : e.key === 'ArrowLeft' ? (i - 1 + items.length) % items.length : -1;
    if (n < 0) return;
    e.preventDefault();
    value = items[n].value;
    await tick();
    root?.querySelectorAll('[role="tab"]')[n]?.focus();
  }
</script>

<div bind:this={root} role="tablist" tabindex="-1" aria-label={label} class="mg-tabs {secondary ? 'mg-tabs--secondary' : ''}" data-mg-liquid="manual" use:liquid {onkeydown}>
  {#each items as t (t.value)}
    <button type="button" role="tab" class="mg-tab" id="{idPrefix}-{t.value}" aria-controls="{idPrefix}-{t.value}-panel" aria-selected={t.value === value} tabindex={t.value === value ? 0 : -1} onclick={() => (value = t.value)}>{t.label}</button>
  {/each}
</div>
