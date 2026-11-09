import type { Meta, StoryObj } from '@storybook/vue3-vite';

import { sampleReport } from '@/test/storyData';

import RunSummary from './RunSummary.vue';

const clean = sampleReport();
clean.entries = clean.entries.filter((e) => e.status === 'unchanged');
clean.summary = { total: 2, changed: 0, new: 0, removed: 0, unchanged: 2 };

const meta = {
  title: 'Widgets/RunSummary',
  component: RunSummary,
  args: { report: sampleReport() },
} satisfies Meta<typeof RunSummary>;
export default meta;
type Story = StoryObj<typeof meta>;

export const NeedsReview: Story = {};
export const AllClear: Story = { args: { report: clean } };
