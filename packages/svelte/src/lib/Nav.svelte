<script>
  import { liquid } from './actions.js';
  let { label, rail = false, tier = 3, children } = $props();
</script>

<nav aria-label={label} class="mg-nav mg-glass-{tier} {rail ? 'mg-rail' : ''}" data-mg-liquid="manual" use:liquid>{@render children?.()}</nav>
