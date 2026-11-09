import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { fn } from 'storybook/test';

import ErrorState from './ErrorState.vue';

const meta = {
  title: 'Shared/ErrorState',
  component: ErrorState,
  args: {
    title: 'Could not load the report',
    message: 'The network request failed.',
    retryable: true,
    onRetry: fn(),
  },
} satisfies Meta<typeof ErrorState>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Retryable: Story = {};
export const NotRetryable: Story = {
  args: { title: 'No report found', message: 'Run `npx pixelproof test` to create one.', retryable: false },
};
