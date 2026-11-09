import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';

import SegmentedControl, { type SegmentOption } from './SegmentedControl.vue';

/** The component is generic, so the story describes its props for a string value. */
interface Args {
  label: string;
  options: SegmentOption<string>[];
  modelValue: string;
  hideLabel?: boolean;
}

const options = [
  { value: 'diff', label: 'Diff', shortcut: '1' },
  { value: 'side', label: 'Side by side', shortcut: '2' },
  { value: 'slider', label: 'Slider', shortcut: '3' },
  { value: 'onion', label: 'Onion skin', shortcut: '4', disabled: true },
] as const;

const meta = {
  title: 'Shared/SegmentedControl',
  args: { label: 'Comparison view', options: [...options], modelValue: 'diff', hideLabel: false },
  render: (args) => ({
    components: { SegmentedControl },
    setup: () => ({ args, value: ref(args.modelValue) }),
    template: '<SegmentedControl v-bind="args" v-model="value" />',
  }),
} satisfies Meta<Args>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const HiddenLabel: Story = {
  args: {
    label: 'Color theme',
    hideLabel: true,
    modelValue: 'system',
    options: [
      { value: 'system', label: 'System' },
      { value: 'light', label: 'Light' },
      { value: 'dark', label: 'Dark' },
    ],
  },
};
