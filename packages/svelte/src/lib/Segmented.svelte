<script>
  import { liquid } from './actions.js';
  let { value = $bindable(), options, label, class: className = '' } = $props();
</script>

<div role="group" aria-label={label} class="mg-segmented mg-glass-1 {className}" data-mg-liquid="manual" use:liquid>
  {#each options as o (o.value)}
    <button type="button" class="mg-segmented__item" aria-pressed={o.value === value} onclick={() => (value = o.value)}>{o.label}</button>
  {/each}
</div>
