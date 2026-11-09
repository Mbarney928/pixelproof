import type { Meta, StoryObj } from '@storybook/vue3-vite';

import Button from '../Button/Button.vue';

import Card from './Card.vue';

const meta = {
  title: 'Shared/Card',
  component: Card,
  args: { title: 'Review progress', description: 'Decisions are saved in this browser.' },
  render: (args) => ({
    components: { Card, Button },
    setup: () => ({ args }),
    template: `<Card v-bind="args">
      <template #actions><Button size="sm" variant="secondary">Show table</Button></template>
      <p style="margin:0">3 of 15 reviewed</p>
    </Card>`,
  }),
} satisfies Meta<typeof Card>;
export default meta;
type Story = StoryObj<typeof meta>;

export const WithTitle: Story = {};
export const Untitled: Story = {
  args: { title: undefined, description: undefined },
  render: (args) => ({
    components: { Card },
    setup: () => ({ args }),
    template: '<Card v-bind="args"><p style="margin:0">Body only</p></Card>',
  }),
};
