import type { Meta, StoryObj } from '@storybook/vue3-vite';

import { sampleReport } from '@/test/storyData';

import ChangeChart from './ChangeChart.vue';

const meta = {
  title: 'Widgets/ChangeChart',
  component: ChangeChart,
  args: {
    entries: sampleReport().entries,
    linkFor: (id: string) => ({ name: 'snapshot', params: { id } }),
  },
} satisfies Meta<typeof ChangeChart>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const NothingChanged: Story = {
  args: { entries: sampleReport().entries.filter((e) => e.status !== 'changed') },
};
