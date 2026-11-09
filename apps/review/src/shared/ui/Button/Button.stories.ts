import type { Meta, StoryObj } from '@storybook/vue3-vite';

import Kbd from '../Kbd/Kbd.vue';

import Button from './Button.vue';

const meta = {
  title: 'Shared/Button',
  component: Button,
  args: { variant: 'primary', size: 'md', disabled: false, loading: false },
  argTypes: {
    variant: { control: 'inline-radio', options: ['primary', 'secondary', 'ghost', 'danger'] },
    size: { control: 'inline-radio', options: ['sm', 'md'] },
  },
  render: (args) => ({
    components: { Button, Kbd },
    setup: () => ({ args }),
    template: '<Button v-bind="args">Approve <Kbd keys="A" /></Button>',
  }),
} satisfies Meta<typeof Button>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};
export const Secondary: Story = { args: { variant: 'secondary' } };
export const Ghost: Story = { args: { variant: 'ghost' } };
export const Danger: Story = { args: { variant: 'danger' } };
export const Small: Story = { args: { size: 'sm' } };
export const Pressed: Story = { args: { variant: 'secondary', pressed: true } };
export const Loading: Story = { args: { loading: true } };
export const Disabled: Story = { args: { disabled: true } };
