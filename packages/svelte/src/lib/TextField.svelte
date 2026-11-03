<script>
  let { value = $bindable(''), label, type = 'text', supporting, error, variant = 'glass', multiline = false, id, leading, trailing, class: className = '', ...rest } = $props();
  const fallback = `mg-tf-${Math.random().toString(36).slice(2, 8)}`;
  let inputId = $derived(id ?? fallback);
  let support = $derived(error || supporting);
</script>

{#snippet control()}
  {#if multiline}
    <textarea id={inputId} class="mg-field__input" bind:value aria-invalid={error ? 'true' : undefined} aria-describedby={support ? `${inputId}-support` : undefined} {...rest}></textarea>
  {:else}
    <input id={inputId} class="mg-field__input" {type} bind:value aria-invalid={error ? 'true' : undefined} aria-describedby={support ? `${inputId}-support` : undefined} {...rest} />
  {/if}
{/snippet}

<div class={className}>
  <label class="mg-field {variant !== 'glass' ? `mg-field--${variant}` : ''}" for={inputId}>
    <span class="mg-field__label">{label}</span>
    {#if leading || trailing}
      <span class="mg-field__row">{@render leading?.()}{@render control()}{@render trailing?.()}</span>
    {:else}
      {@render control()}
    {/if}
  </label>
  {#if support}
    <div id="{inputId}-support" class="mg-field__support {error ? 'mg-field__support--error' : ''}"><span>{support}</span></div>
  {/if}
</div>
