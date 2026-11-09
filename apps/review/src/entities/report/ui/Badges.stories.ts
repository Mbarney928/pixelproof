import { SEVERITIES, SNAPSHOT_STATUSES } from '@pixelproof/core/schema';
import type { Meta, StoryObj } from '@storybook/vue3-vite';

import SeverityBadge from './SeverityBadge.vue';
import StatusBadge from './StatusBadge.vue';

const meta = {
  title: 'Entities/Report badges',
  component: StatusBadge,
  args: { status: 'changed' },
} satisfies Meta<typeof StatusBadge>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Statuses: Story = {
  render: () => ({
    components: { StatusBadge },
    setup: () => ({ statuses: SNAPSHOT_STATUSES }),
    template:
      '<div style="display:flex;gap:8px;flex-wrap:wrap"><StatusBadge v-for="s in statuses" :key="s" :status="s" /></div>',
  }),
};
export const Severities: Story = {
  render: () => ({
    components: { SeverityBadge },
    setup: () => ({ severities: SEVERITIES }),
    template:
      '<div style="display:flex;gap:8px;flex-wrap:wrap"><SeverityBadge v-for="s in severities" :key="s" :severity="s" /></div>',
  }),
};
