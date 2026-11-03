<script>
  let { selected = $bindable(false), class: className = '', children, onclick, ...rest } = $props();
</script>

<button type="button" class="mg-chip {className}" aria-pressed={selected} onclick={(e) => { selected = !selected; onclick?.(e); }} {...rest}>
  <svg class="mg-chip__check" viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
  {@render children?.()}
</button>
