<script>
  let { value = $bindable(0), min = 0, max = 100, step = 1, label, disabled = false, class: className = '', ...rest } = $props();
  let pct = $derived(((Number(value) - min) / (max - min)) * 100);
</script>

<input type="range" class="mg-slider {className}" bind:value {min} {max} {step} {disabled} aria-label={label} style="--mg-value: {pct}%" {...rest} />
