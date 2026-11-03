<script>
  let { tier = 2, variant = 'glass', headline, subtitle, interactive = false, class: className = '', children, actions, ...rest } = $props();
  let cls = $derived(['mg-card', variant === 'glass' ? `mg-glass-${tier}` : `mg-card--${variant}`, interactive && 'mg-card--interactive', className].filter(Boolean).join(' '));
</script>

<div class={cls} {...rest}>
  {#if headline}<h3 class="mg-card__title">{headline}</h3>{/if}
  {#if subtitle}<p class="mg-card__subtitle">{subtitle}</p>{/if}
  {@render children?.()}
  {#if actions}<div class="mg-card__actions">{@render actions()}</div>{/if}
</div>
