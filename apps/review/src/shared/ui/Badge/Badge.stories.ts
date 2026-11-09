import type { Meta, StoryObj } from '@storybook/vue3-vite';

import Badge from './Badge.vue';

const meta = {
  title: 'Shared/Badge',
  component: Badge,
  args: { tone: 'neutral' },
  argTypes: {
    tone: { control: 'inline-radio', options: ['neutral', 'info', 'good', 'warning', 'critical'] },
  },
  render: (args) => ({
    components: { Badge },
    setup: () => ({ args }),
    template: '<Badge v-bind="args">Pending</Badge>',
  }),
} satisfies Meta<typeof Badge>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Neutral: Story = {};
export const AllTones: Story = {
  render: () => ({
    components: { Badge },
    template: `<div style="display:flex;gap:8px;flex-wrap:wrap">
      <Badge tone="neutral" icon="…">Awaiting review</Badge>
      <Badge tone="info" icon="+">New</Badge>
      <Badge tone="good" icon="✓">Approved</Badge>
      <Badge tone="warning" icon="▲">Moderate</Badge>
      <Badge tone="critical" icon="✖">Major</Badge>
    </div>`,
  }),
};
