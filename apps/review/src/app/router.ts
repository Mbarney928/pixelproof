import { createRouter, createWebHashHistory, type RouteRecordRaw, type RouterHistory } from 'vue-router';

import { RunPage } from '@/pages/run';

export const routes: RouteRecordRaw[] = [
  { path: '/', name: 'run', component: RunPage },
  {
    path: '/snapshot/:id',
    name: 'snapshot',
    // The comparison view is its own chunk: the overview loads without it.
    component: () => import('@/pages/snapshot').then((m) => m.SnapshotPage),
    props: true,
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/pages/not-found').then((m) => m.NotFoundPage),
  },
];

/** Hash history: the app runs from any static folder (Pages, CI artifact, next to a report) without server rewrites. */
export function createAppRouter(history: RouterHistory = createWebHashHistory()) {
  const router = createRouter({ history, routes });
  // Start each page at the top (the snapshot list can be long).
  router.afterEach((to, from) => {
    if (to.path !== from.path && typeof window.scrollTo === 'function') window.scrollTo({ top: 0 });
  });
  return router;
}
