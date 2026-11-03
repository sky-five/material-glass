<script>
  let { current = false, href, icon, children, ...rest } = $props();
</script>

{#if href}
  <a class="mg-nav__item" {href} aria-current={current ? 'page' : undefined} {...rest}>{@render icon?.()}{@render children?.()}</a>
{:else}
  <button type="button" class="mg-nav__item" aria-current={current ? 'page' : undefined} {...rest}>{@render icon?.()}{@render children?.()}</button>
{/if}
