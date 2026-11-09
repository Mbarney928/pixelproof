import type { Meta, StoryObj } from '@storybook/vue3-vite';

import { storyEntry } from '@/test/storyData';

import CompareViewer from './CompareViewer.vue';

const meta = {
  title: 'Widgets/CompareViewer',
  component: CompareViewer,
  args: { entry: storyEntry() },
  parameters: { layout: 'fullscreen' },
  render: (args) => ({
    components: { CompareViewer },
    setup: () => ({ args }),
    template: '<div style="padding:16px;max-width:1100px"><CompareViewer v-bind="args" /></div>',
  }),
} satisfies Meta<typeof CompareViewer>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Real engine output: a moved, recoloured button and a new badge, outlined as two regions. */
export const Changed: Story = {};

export const NewSnapshot: Story = {
  args: {
    entry: storyEntry({
      status: 'new',
      severity: 'none',
      images: { current: 'current/settings-card.png' },
    }),
  },
};

export const RemovedSnapshot: Story = {
  args: {
    entry: storyEntry({
      status: 'removed',
      severity: 'none',
      images: { baseline: 'baseline/settings-card.png' },
    }),
  },
};
