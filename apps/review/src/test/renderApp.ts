import { flushPromises } from '@vue/test-utils';
import { afterEach } from 'vitest';
import { createMemoryHistory } from 'vue-router';

import { createReviewApp } from '@/app/createApp';

import { fakeFetch, REPORT_URL, sampleReport } from './fixtures';

const mounted: (() => void)[] = [];
afterEach(() => {
  while (mounted.length > 0) mounted.pop()?.();
});

/** Mounts the real app (router, Pinia, vue-query, report client) at `path`. Query with `screen`. */
export async function renderApp(path = '/', fetchImpl: typeof fetch = fakeFetch(sampleReport())) {
  const { app, router } = createReviewApp({
    source: { url: REPORT_URL, fetch: fetchImpl },
    history: createMemoryHistory(),
  });
  await router.push(path);
  await router.isReady();
  const host = document.createElement('div');
  document.body.appendChild(host);
  app.mount(host);
  mounted.push(() => {
    app.unmount();
    host.remove();
  });
  await flushPromises();
  return { router, container: host };
}
