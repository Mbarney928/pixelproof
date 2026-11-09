import type { Meta, StoryObj } from '@storybook/vue3-vite';

import Kbd from './Kbd.vue';

const meta = { title: 'Shared/Kbd', component: Kbd, args: { keys: 'Esc' } } satisfies Meta<typeof Kbd>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Letter: Story = { args: { keys: 'J' } };
