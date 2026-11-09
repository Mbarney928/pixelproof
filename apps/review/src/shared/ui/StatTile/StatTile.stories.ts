import type { Meta, StoryObj } from '@storybook/vue3-vite';

import StatTile from './StatTile.vue';

const meta = {
  title: 'Shared/StatTile',
  component: StatTile,
  args: { label: 'Changed', value: 11, detail: 'Differs from baseline', tone: 'warning', icon: '▲' },
  argTypes: {
    tone: { control: 'inline-radio', options: ['neutral', 'info', 'good', 'warning', 'critical'] },
  },
  render: (args) => ({
    components: { StatTile },
    setup: () => ({ args }),
    template: '<dl style="margin:0;max-width:14rem"><StatTile v-bind="args" /></dl>',
  }),
} satisfies Meta<typeof StatTile>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Warning: Story = {};
export const Neutral: Story = {
  args: { label: 'Unchanged', value: 5, tone: 'neutral', icon: '=', detail: 'Matches baseline' },
};
export const Zero: Story = {
  args: { label: 'Removed', value: 0, tone: 'neutral', icon: '−', detail: undefined },
};
