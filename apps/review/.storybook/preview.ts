import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query';
import { setup, type Preview } from '@storybook/vue3-vite';
import { createPinia } from 'pinia';
import { createMemoryHistory, createRouter } from 'vue-router';

import { ReportSourceKey } from '../src/shared/api';

import '../src/shared/ui/styles/tokens.css';
import '../src/shared/ui/styles/global.css';

setup((app) => {
  app.use(createPinia());
  app.use(
    createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', name: 'run', component: { render: () => null } },
        { path: '/snapshot/:id', name: 'snapshot', component: { render: () => null } },
      ],
    }),
  );
  app.use(VueQueryPlugin, { queryClient: new QueryClient() });
  app.provide(ReportSourceKey, {
    url: new URL('report/report.json', window.location.href).href,
    fetch: window.fetch.bind(window),
  });
});

const preview: Preview = {
  parameters: {
    layout: 'padded',
    controls: { expanded: true },
    // Fail the story's a11y panel (and the CI scan) on any axe violation.
    a11y: { test: 'error' },
  },
  globalTypes: {
    theme: {
      description: 'Color theme',
      toolbar: { title: 'Theme', icon: 'mirror', items: ['light', 'dark'], dynamicTitle: true },
    },
  },
  initialGlobals: { theme: 'light' },
  decorators: [
    (story, context) => {
      document.documentElement.dataset.theme = context.globals.theme === 'dark' ? 'dark' : 'light';
      return { components: { story }, template: '<story />' };
    },
  ],
};

export default preview;
