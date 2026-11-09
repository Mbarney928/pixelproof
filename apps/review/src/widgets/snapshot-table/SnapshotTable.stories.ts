import type { Meta, StoryObj } from '@storybook/vue3-vite';

import { sampleReport } from '@/test/storyData';

import SnapshotTable from './SnapshotTable.vue';

const meta = {
  title: 'Widgets/SnapshotTable',
  component: SnapshotTable,
  args: {
    entries: sampleReport().entries,
    linkFor: (id: string) => ({ name: 'snapshot', params: { id } }),
  },
} satisfies Meta<typeof SnapshotTable>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Empty: Story = { args: { entries: [] } };
