import type { Meta, StoryObj } from '@storybook/vue3-vite';

import { storyEntry } from '@/test/storyData';

import DecisionBar from './DecisionBar.vue';

const meta = {
  title: 'Features/DecisionBar',
  component: DecisionBar,
  args: { entry: storyEntry() },
} satisfies Meta<typeof DecisionBar>;
export default meta;
type Story = StoryObj<typeof meta>;

export const AwaitingReview: Story = {};
export const Unchanged: Story = { args: { entry: storyEntry({ status: 'unchanged', severity: 'none' }) } };
