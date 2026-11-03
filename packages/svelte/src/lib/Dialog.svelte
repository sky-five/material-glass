<script>
  let { open = $bindable(false), headline, variant = 'basic', onclose, children, actions } = $props();
  let el = $state();
  const titleId = `mg-dlg-${Math.random().toString(36).slice(2, 8)}`;
  $effect(() => {
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  });
</script>

<dialog bind:this={el} aria-labelledby={titleId} class="mg-dialog mg-glass-3 {variant !== 'basic' ? `mg-dialog--${variant}` : ''}" onclose={() => { open = false; onclose?.(el.returnValue); }}>
  <h2 class="mg-dialog__title" id={titleId}>{headline}</h2>
  <div class="mg-dialog__body">{@render children?.()}</div>
  {#if actions}<form method="dialog" class="mg-dialog__actions">{@render actions()}</form>{/if}
</dialog>
