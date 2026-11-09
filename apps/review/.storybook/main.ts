import type { StorybookConfig } from '@storybook/vue3-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.ts'],
  addons: ['@storybook/addon-a11y'],
  framework: { name: '@storybook/vue3-vite', options: {} },
  // Synthetic baseline/current/diff images drawn by scripts/story-fixtures.js.
  staticDirs: ['./public'],
  core: { disableTelemetry: true },
};

export default config;
