import type { Meta, StoryObj } from '@storybook/vue3-vite';

import EmptyState from './EmptyState.vue';

const meta = {
  title: 'Shared/EmptyState',
  component: EmptyState,
  args: { title: 'No snapshots match', description: 'Try another status or clear the search.' },
} satisfies Meta<typeof EmptyState>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const TitleOnly: Story = { args: { description: undefined } };
