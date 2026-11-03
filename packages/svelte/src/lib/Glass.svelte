<script>
  let { tier = 2, as = 'div', refract = false, class: className = '', children, ...rest } = $props();
</script>

<svelte:element this={as} class="mg-glass-{tier} {className}" data-mg-refract={refract ? (refract === true ? 24 : refract) : undefined} {...rest}>{@render children?.()}</svelte:element>
