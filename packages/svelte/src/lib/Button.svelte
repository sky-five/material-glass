<script>
  let { variant = 'filled', size = 'md', type = 'button', href, disabled = false, class: className = '', icon, children, ...rest } = $props();
  let cls = $derived(['mg-btn', variant !== 'filled' && `mg-btn--${variant}`, size !== 'md' && `mg-btn--${size}`, className].filter(Boolean).join(' '));
</script>

{#if href}
  <a class={cls} {href} aria-disabled={disabled || undefined} {...rest}>{@render icon?.()}{@render children?.()}</a>
{:else}
  <button class={cls} {type} {disabled} {...rest}>{@render icon?.()}{@render children?.()}</button>
{/if}
