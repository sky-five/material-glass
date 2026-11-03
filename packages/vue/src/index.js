/*!
 * @material-glass/vue · Vue 3 components for Material Glass · MIT
 * Render-function components (no build step), v-model everywhere it makes sense.
 */
import { defineComponent, h, ref, computed, watch, onMounted, nextTick } from 'vue';

const cx = (...c) => c.filter(Boolean).join(' ');
const mg = () => (typeof window !== 'undefined' ? window.MaterialGlass : undefined);
let uid = 0;
const useId = (prefix) => `${prefix}-${++uid}`;

/** v-mg-liquid: initialise material-glass.js behaviour (liquid selection, refraction, menus) inside an element. */
export const vMgLiquid = {
  mounted(el) { mg()?.init(el); },
  updated() { requestAnimationFrame(() => mg()?.refresh()); }
};

/** Apply theme attributes to <html> (or any element) and re-measure glass. */
export function useMaterialGlassTheme(target) {
  const set = (opts) => {
    const el = target?.value || target || document.documentElement;
    for (const [k, v] of Object.entries(opts)) {
      if (v == null || (k === 'mode' && v === 'auto')) el.removeAttribute(`data-mg-${k}`);
      else el.setAttribute(`data-mg-${k}`, v);
    }
    requestAnimationFrame(() => mg()?.refresh());
  };
  return { set, toast: (msg, opts) => mg()?.toast(msg, opts) };
}

const KEYS = ['theme', 'mode', 'glass', 'density', 'shape', 'motion', 'font'];
export const MgProvider = defineComponent({
  name: 'MgProvider',
  props: { theme: String, mode: String, glass: String, density: String, shape: String, motion: String, font: String, global: Boolean },
  setup(props, { slots }) {
    const attrs = computed(() => {
      const a = {};
      for (const k of KEYS) if (props[k] && !(k === 'mode' && props[k] === 'auto')) a[`data-mg-${k}`] = props[k];
      return a;
    });
    const applyGlobal = () => {
      if (!props.global || typeof document === 'undefined') return;
      const html = document.documentElement;
      for (const k of KEYS) html.removeAttribute(`data-mg-${k}`);
      for (const [k, v] of Object.entries(attrs.value)) html.setAttribute(k, v);
    };
    onMounted(applyGlobal);
    watch(attrs, () => { applyGlobal(); requestAnimationFrame(() => mg()?.refresh()); });
    return () => (props.global ? slots.default?.() : h('div', { style: 'display: contents', ...attrs.value }, slots.default?.()));
  }
});

export const MgGlass = defineComponent({
  name: 'MgGlass',
  props: { tier: { type: [Number, String], default: 2 }, as: { type: String, default: 'div' }, refract: [Boolean, Number] },
  setup(props, { slots }) {
    return () => h(props.as, { class: `mg-glass-${props.tier}`, 'data-mg-refract': props.refract ? (props.refract === true ? 24 : props.refract) : undefined }, slots.default?.());
  }
});

export const MgCard = defineComponent({
  name: 'MgCard',
  props: { tier: { type: [Number, String], default: 2 }, variant: { type: String, default: 'glass' }, headline: String, subtitle: String, interactive: Boolean },
  setup(props, { slots }) {
    return () => h('div', { class: cx('mg-card', props.variant === 'glass' ? `mg-glass-${props.tier}` : `mg-card--${props.variant}`, props.interactive && 'mg-card--interactive') }, [
      props.headline && h('h3', { class: 'mg-card__title' }, props.headline),
      props.subtitle && h('p', { class: 'mg-card__subtitle' }, props.subtitle),
      slots.default?.(),
      slots.actions && h('div', { class: 'mg-card__actions' }, slots.actions())
    ]);
  }
});

export const MgButton = defineComponent({
  name: 'MgButton',
  props: { variant: { type: String, default: 'filled' }, size: { type: String, default: 'md' }, type: { type: String, default: 'button' }, href: String, disabled: Boolean },
  setup(props, { slots }) {
    return () => {
      const cls = cx('mg-btn', props.variant !== 'filled' && `mg-btn--${props.variant}`, props.size !== 'md' && `mg-btn--${props.size}`);
      if (props.href) return h('a', { class: cls, href: props.href, 'aria-disabled': props.disabled || undefined }, [slots.icon?.(), slots.default?.()]);
      return h('button', { class: cls, type: props.type, disabled: props.disabled }, [slots.icon?.(), slots.default?.()]);
    };
  }
});

export const MgIconButton = defineComponent({
  name: 'MgIconButton',
  props: { label: { type: String, required: true }, pressed: { type: Boolean, default: undefined }, tier: [Number, String] },
  emits: ['update:pressed'],
  setup(props, { slots, emit }) {
    return () => h('button', {
      type: 'button',
      class: cx('mg-icon-btn', props.tier !== undefined && `mg-glass-${props.tier}`),
      'aria-label': props.label,
      'aria-pressed': props.pressed === undefined ? undefined : String(props.pressed),
      onClick: () => { if (props.pressed !== undefined) emit('update:pressed', !props.pressed); }
    }, slots.default?.());
  }
});

export const MgChip = defineComponent({
  name: 'MgChip',
  props: { selected: Boolean },
  emits: ['update:selected'],
  setup(props, { slots, emit }) {
    return () => h('button', { type: 'button', class: 'mg-chip', 'aria-pressed': String(props.selected), onClick: () => emit('update:selected', !props.selected) }, [
      h('svg', { class: 'mg-chip__check', viewBox: '0 0 24 24', 'aria-hidden': 'true' }, [h('path', { fill: 'none', stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M5 13l4 4L19 7' })]),
      slots.default?.()
    ]);
  }
});

export const MgSwitch = defineComponent({
  name: 'MgSwitch',
  props: { modelValue: Boolean, label: { type: String, required: true }, disabled: Boolean },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    return () => h('button', { type: 'button', role: 'switch', class: 'mg-switch', 'aria-checked': String(props.modelValue), 'aria-label': props.label, disabled: props.disabled, onClick: () => emit('update:modelValue', !props.modelValue) });
  }
});

export const MgSlider = defineComponent({
  name: 'MgSlider',
  props: { modelValue: { type: Number, default: 0 }, min: { type: Number, default: 0 }, max: { type: Number, default: 100 }, step: { type: Number, default: 1 }, label: String, disabled: Boolean },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    return () => h('input', {
      type: 'range', class: 'mg-slider', min: props.min, max: props.max, step: props.step, value: props.modelValue, disabled: props.disabled, 'aria-label': props.label,
      style: { '--mg-value': `${((props.modelValue - props.min) / (props.max - props.min)) * 100}%` },
      onInput: (e) => emit('update:modelValue', Number(e.target.value))
    });
  }
});

export const MgTextField = defineComponent({
  name: 'MgTextField',
  props: { modelValue: { type: String, default: '' }, label: { type: String, required: true }, type: { type: String, default: 'text' }, supporting: String, error: String, variant: { type: String, default: 'glass' }, multiline: Boolean, placeholder: String, name: String, id: String },
  emits: ['update:modelValue'],
  setup(props, { emit, slots }) {
    const id = props.id || useId('mg-tf');
    return () => {
      const support = props.error || props.supporting;
      const control = h(props.multiline ? 'textarea' : 'input', {
        id, class: 'mg-field__input', type: props.multiline ? undefined : props.type, value: props.modelValue, name: props.name, placeholder: props.placeholder,
        'aria-invalid': props.error ? 'true' : undefined, 'aria-describedby': support ? `${id}-support` : undefined,
        onInput: (e) => emit('update:modelValue', e.target.value)
      });
      return h('div', null, [
        h('label', { class: cx('mg-field', props.variant !== 'glass' && `mg-field--${props.variant}`), for: id }, [
          h('span', { class: 'mg-field__label' }, props.label),
          slots.leading || slots.trailing ? h('span', { class: 'mg-field__row' }, [slots.leading?.(), control, slots.trailing?.()]) : control
        ]),
        support && h('div', { id: `${id}-support`, class: cx('mg-field__support', props.error && 'mg-field__support--error') }, [h('span', null, support)])
      ]);
    };
  }
});

export const MgSegmented = defineComponent({
  name: 'MgSegmented',
  props: { modelValue: String, options: { type: Array, required: true }, label: { type: String, required: true } },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const root = ref(null);
    onMounted(() => mg()?.init(root.value));
    return () => h('div', { ref: root, role: 'group', 'aria-label': props.label, class: 'mg-segmented mg-glass-1', 'data-mg-liquid': 'manual' },
      props.options.map((o) => h('button', { key: o.value, type: 'button', class: 'mg-segmented__item', 'aria-pressed': String(o.value === props.modelValue), onClick: () => emit('update:modelValue', o.value) }, o.label)));
  }
});

export const MgTabs = defineComponent({
  name: 'MgTabs',
  props: { modelValue: String, items: { type: Array, required: true }, label: { type: String, required: true }, secondary: Boolean, idPrefix: { type: String, default: 'mg-tabs' } },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const root = ref(null);
    onMounted(() => mg()?.init(root.value));
    const onKey = (e) => {
      if (e.defaultPrevented) return; // material-glass.js handled it
      const i = props.items.findIndex((t) => t.value === props.modelValue);
      const n = e.key === 'ArrowRight' ? (i + 1) % props.items.length : e.key === 'ArrowLeft' ? (i - 1 + props.items.length) % props.items.length : -1;
      if (n < 0) return;
      e.preventDefault();
      emit('update:modelValue', props.items[n].value);
      nextTick(() => root.value?.querySelectorAll('[role="tab"]')[n]?.focus());
    };
    return () => h('div', { ref: root, role: 'tablist', 'aria-label': props.label, class: cx('mg-tabs', props.secondary && 'mg-tabs--secondary'), 'data-mg-liquid': 'manual', onKeydown: onKey },
      props.items.map((t) => h('button', {
        key: t.value, type: 'button', role: 'tab', class: 'mg-tab', id: `${props.idPrefix}-${t.value}`, 'aria-controls': `${props.idPrefix}-${t.value}-panel`,
        'aria-selected': String(t.value === props.modelValue), tabindex: t.value === props.modelValue ? 0 : -1, onClick: () => emit('update:modelValue', t.value)
      }, t.label)));
  }
});

export const MgTabPanel = defineComponent({
  name: 'MgTabPanel',
  props: { value: { type: String, required: true }, current: String, idPrefix: { type: String, default: 'mg-tabs' } },
  setup(props, { slots }) {
    return () => h('div', { role: 'tabpanel', class: 'mg-tab-panel', id: `${props.idPrefix}-${props.value}-panel`, 'aria-labelledby': `${props.idPrefix}-${props.value}`, hidden: props.value !== props.current }, slots.default?.());
  }
});

export const MgDialog = defineComponent({
  name: 'MgDialog',
  props: { open: Boolean, headline: { type: String, required: true }, variant: { type: String, default: 'basic' } },
  emits: ['update:open', 'close'],
  setup(props, { slots, emit }) {
    const el = ref(null);
    const titleId = useId('mg-dlg');
    const sync = () => { const d = el.value; if (!d) return; if (props.open && !d.open) d.showModal(); if (!props.open && d.open) d.close(); };
    onMounted(sync);
    watch(() => props.open, sync);
    return () => h('dialog', {
      ref: el, 'aria-labelledby': titleId, class: cx('mg-dialog mg-glass-3', props.variant !== 'basic' && `mg-dialog--${props.variant}`),
      onClose: (e) => { emit('update:open', false); emit('close', e.target.returnValue); }
    }, [
      h('h2', { class: 'mg-dialog__title', id: titleId }, props.headline),
      h('div', { class: 'mg-dialog__body' }, slots.default?.()),
      slots.actions && h('form', { method: 'dialog', class: 'mg-dialog__actions' }, slots.actions())
    ]);
  }
});

export const MgNav = defineComponent({
  name: 'MgNav',
  props: { label: { type: String, required: true }, rail: Boolean, tier: { type: [Number, String], default: 3 } },
  setup(props, { slots }) {
    const root = ref(null);
    onMounted(() => mg()?.init(root.value));
    return () => h('nav', { ref: root, 'aria-label': props.label, class: cx('mg-nav', `mg-glass-${props.tier}`, props.rail && 'mg-rail'), 'data-mg-liquid': 'manual' }, slots.default?.());
  }
});

export const MgNavItem = defineComponent({
  name: 'MgNavItem',
  props: { current: Boolean, href: String },
  setup(props, { slots }) {
    return () => h(props.href ? 'a' : 'button', { class: 'mg-nav__item', href: props.href, type: props.href ? undefined : 'button', 'aria-current': props.current ? 'page' : undefined }, [slots.icon?.(), slots.default?.()]);
  }
});

/** app.use(MaterialGlass) registers every component (Mg*) and the v-mg-liquid directive. */
const components = { MgProvider, MgGlass, MgCard, MgButton, MgIconButton, MgChip, MgSwitch, MgSlider, MgTextField, MgSegmented, MgTabs, MgTabPanel, MgDialog, MgNav, MgNavItem };
export default {
  install(app) {
    for (const [name, c] of Object.entries(components)) app.component(name, c);
    app.directive('mg-liquid', vMgLiquid);
  }
};
