<script>
  let { value, current, idPrefix = 'mg-tabs', children } = $props();
</script>

<div role="tabpanel" class="mg-tab-panel" id="{idPrefix}-{value}-panel" aria-labelledby="{idPrefix}-{value}" hidden={value !== current}>{@render children?.()}</div>
