<script>
  let { checked = $bindable(false), label, disabled = false, class: className = '', onchange, ...rest } = $props();
</script>

<button type="button" role="switch" class="mg-switch {className}" aria-checked={checked} aria-label={label} {disabled} onclick={() => { checked = !checked; onchange?.(checked); }} {...rest}></button>
