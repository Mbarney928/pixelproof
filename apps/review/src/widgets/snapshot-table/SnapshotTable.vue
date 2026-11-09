<script setup lang="ts">
import type { ReportEntry } from '@pixelproof/core/schema';
import { RouterLink, type RouteLocationRaw } from 'vue-router';

import { SeverityBadge, StatusBadge } from '@/entities/report';
import { useReviewStore } from '@/entities/review';
import { imageUrl, useReportSource } from '@/shared/api';
import { formatPercent } from '@/shared/lib';
import { Badge, EmptyState } from '@/shared/ui';

defineProps<{ entries: readonly ReportEntry[]; linkFor: (id: string) => RouteLocationRaw }>();
const source = useReportSource();
const review = useReviewStore();
const thumb = (e: ReportEntry) =>
  imageUrl(source.url, e, 'thumb') ??
  imageUrl(source.url, e, 'current') ??
  imageUrl(source.url, e, 'baseline');
</script>

<template>
  <EmptyState
    v-if="entries.length === 0"
    title="No snapshots match"
    description="Try another status or clear the search."
  />
  <div v-else class="table" role="region" aria-label="Snapshot table" tabindex="0">
    <table>
      <thead>
        <tr>
          <th scope="col"><span class="visually-hidden">Preview</span></th>
          <th scope="col">Snapshot</th>
          <th scope="col">Viewport</th>
          <th scope="col">Theme</th>
          <th scope="col">Status</th>
          <th scope="col">Severity</th>
          <th scope="col" class="num">Changed</th>
          <th scope="col">Decision</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="e in entries" :key="e.id">
          <td class="table__thumb">
            <img
              v-if="thumb(e)"
              :src="thumb(e)"
              alt=""
              loading="lazy"
              decoding="async"
              width="72"
              height="48"
            />
          </td>
          <th scope="row">
            <RouterLink :to="linkFor(e.id)" class="table__link">
              <span class="table__group">{{ e.group }}</span>
              {{ e.name }}
            </RouterLink>
          </th>
          <td class="nowrap">
            {{ e.viewport.name }} <span class="muted">{{ e.viewport.width }}px</span>
          </td>
          <td>{{ e.theme === 'dark' ? 'Dark' : 'Light' }}</td>
          <td><StatusBadge :status="e.status" /></td>
          <td><SeverityBadge :severity="e.severity" /></td>
          <td class="num">{{ e.diff && e.status === 'changed' ? formatPercent(e.diff.ratio) : '—' }}</td>
          <td>
            <Badge v-if="review.decisions[e.id] === 'approved'" tone="good" icon="✓">Approved</Badge>
            <Badge v-else-if="review.decisions[e.id] === 'rejected'" tone="critical" icon="✖">Rejected</Badge>
            <span v-else-if="e.status !== 'unchanged'" class="muted">Pending</span>
            <span v-else class="muted">—</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.table {
  overflow-x: auto;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}
table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--text-sm);
}
th,
td {
  padding: var(--space-2) var(--space-3);
  border-bottom: 1px solid var(--color-border);
  text-align: left;
  vertical-align: middle;
}
thead th {
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  color: var(--color-text-secondary);
  background: var(--color-surface-2);
}
tbody tr:last-child > * {
  border-bottom: 0;
}
tbody tr:hover {
  background: var(--color-surface-2);
}
th[scope='row'] {
  font-weight: var(--weight-medium);
}
.table__thumb {
  width: 88px;
}
.table__thumb img {
  display: block;
  width: 72px;
  height: 48px;
  object-fit: cover;
  object-position: top;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background: var(--color-surface-2);
}
.table__link {
  display: grid;
  color: var(--color-text);
  text-decoration: none;
}
.table__link:hover {
  text-decoration: underline;
}
.table__group {
  font-size: var(--text-xs);
  font-weight: var(--weight-regular);
  color: var(--color-text-secondary);
}
.num {
  text-align: right;
  font-variant-numeric: tabular-nums;
}
.nowrap {
  white-space: nowrap;
}
.muted {
  color: var(--color-text-secondary);
}
</style>
