import type { Meta, StoryObj } from '@storybook/vue3-vite';

import Skeleton from './Skeleton.vue';

const meta = {
  title: 'Shared/Skeleton',
  component: Skeleton,
  args: { width: '60%', height: '1.25rem' },
} satisfies Meta<typeof Skeleton>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Line: Story = {};
export const Block: Story = { args: { width: '100%', height: '8rem' } };
