import { createApp, h, ref } from 'vue';
import MaterialGlass, { MgProvider, MgCard, MgButton, MgSwitch, MgSegmented, MgTabs, MgTabPanel, MgDialog, MgTextField, MgChip, MgSlider, MgNav, MgNavItem } from '../src/index.js';

const App = {
  setup() {
    const on = ref(false), view = ref('week'), tab = ref('songs'), open = ref(false), closed = ref(''), name = ref('Ada'), chip = ref(false), level = ref(30), theme = ref('ember');
    return () => h(MgProvider, { theme: theme.value, mode: 'dark' }, () => h('main', { class: 'mg-scene', style: 'padding:24px' }, [
      h(MgCard, { headline: 'Vue', id: 'card' }, {
        default: () => [
          h(MgSwitch, { id: 'sw', label: 'Wi-Fi', modelValue: on.value, 'onUpdate:modelValue': (v) => (on.value = v) }),
          h('span', { id: 'sw-state' }, String(on.value)),
          h(MgSegmented, { label: 'View', options: [{ value: 'day', label: 'Day' }, { value: 'week', label: 'Week' }, { value: 'month', label: 'Month' }], modelValue: view.value, 'onUpdate:modelValue': (v) => (view.value = v) }),
          h('span', { id: 'view-state' }, view.value),
          h(MgTabs, { label: 'Library', items: [{ value: 'songs', label: 'Songs' }, { value: 'albums', label: 'Albums' }], modelValue: tab.value, 'onUpdate:modelValue': (v) => (tab.value = v) }),
          h(MgTabPanel, { value: 'songs', current: tab.value }, () => 'Songs panel'),
          h(MgTabPanel, { value: 'albums', current: tab.value }, () => 'Albums panel'),
          h(MgTextField, { id: 'name', label: 'Name', modelValue: name.value, 'onUpdate:modelValue': (v) => (name.value = v) }),
          h('span', { id: 'name-state' }, name.value),
          h(MgChip, { id: 'chip', selected: chip.value, 'onUpdate:selected': (v) => (chip.value = v) }, () => 'Design'),
          h(MgSlider, { label: 'Level', modelValue: level.value, 'onUpdate:modelValue': (v) => (level.value = v) }),
          h(MgNav, { label: 'Main' }, () => [h(MgNavItem, { current: true }, () => 'Home'), h(MgNavItem, null, () => 'Search')]),
          h(MgButton, { id: 'open', onClick: () => (open.value = true) }, () => 'Open'),
          h(MgButton, { id: 'theme', variant: 'tonal', onClick: () => (theme.value = 'frost') }, () => 'Frost')
        ]
      }),
      h(MgDialog, { headline: 'Discard?', open: open.value, 'onUpdate:open': (v) => (open.value = v), onClose: (v) => (closed.value = v || 'closed') }, {
        default: () => 'Changes will be lost.',
        actions: () => [h('button', { class: 'mg-btn mg-btn--text', value: 'keep', id: 'keep' }, 'Keep')]
      }),
      h('span', { id: 'closed' }, closed.value)
    ]));
  }
};
createApp(App).use(MaterialGlass).mount('#root');
