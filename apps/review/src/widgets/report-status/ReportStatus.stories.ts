import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { fn } from 'storybook/test';

import { ReportError } from '@/shared/api';

import ReportStatus from './ReportStatus.vue';

const meta = {
  title: 'Widgets/ReportStatus',
  component: ReportStatus,
  args: { isPending: true, error: null, onRetry: fn() },
} satisfies Meta<typeof ReportStatus>;
export default meta;
type Story = StoryObj<typeof meta>;

/** The skeleton appears only after 400 ms, so fast loads never flash. */
export const Loading: Story = {};
export const NoReport: Story = {
  args: {
    isPending: false,
    error: new ReportError('not_found', 'Run `npx pixelproof test` to create a report.'),
  },
};
export const NetworkError: Story = {
  args: { isPending: false, error: new ReportError('network', 'The network request failed.') },
};
