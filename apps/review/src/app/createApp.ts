import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query';
import { createPinia } from 'pinia';
import { createApp, type App as VueApp } from 'vue';
import type { RouterHistory } from 'vue-router';

import { ReportSourceKey, type ReportSource } from '@/shared/api';

import App from './App.vue';
import { createAppRouter } from './router';

import '@/shared/ui/styles/tokens.css';
import '@/shared/ui/styles/global.css';

/** Builds the app with every dependency injectable, so tests mount exactly what users run. */
export function createReviewApp(options: { source: ReportSource; history?: RouterHistory }): {
  app: VueApp;
  router: ReturnType<typeof createAppRouter>;
} {
  const app = createApp(App);
  const router = createAppRouter(options.history);
  const queryClient = new QueryClient({
    defaultOptions: { queries: { refetchOnWindowFocus: false } },
  });
  app.use(createPinia());
  app.use(router);
  app.use(VueQueryPlugin, { queryClient });
  app.provide(ReportSourceKey, options.source);
  return { app, router };
}
