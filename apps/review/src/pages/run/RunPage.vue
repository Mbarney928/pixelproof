<script setup lang="ts">
import { computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { useReport } from '@/entities/report';
import { useReviewStore } from '@/entities/review';
import {
  applyFilters,
  FilterBar,
  filtersFromQuery,
  filtersToQuery,
  type Filters,
} from '@/features/snapshot-filters';
import { formatDateTime, formatPercent } from '@/shared/lib';
import { Card, Kbd } from '@/shared/ui';
import { ChangeChart } from '@/widgets/change-chart';
import { ReportStatus } from '@/widgets/report-status';
import { RunSummary } from '@/widgets/run-summary';
import { SnapshotTable } from '@/widgets/snapshot-table';

const route = useRoute();
const router = useRouter();
const { data: report, isPending, error, refetch } = useReport();
const review = useReviewStore();

watch(
  report,
  (r) => {
    if (r) review.startRun(r.runId);
  },
  { immediate: true },
);

const filters = computed<Filters>({
  get: () => filtersFromQuery(route.query),
  set: (value) => {
    void router.replace({ query: filtersToQuery(value) });
  },
});
const visible = computed(() => (report.value ? applyFilters(report.value.entries, filters.value) : []));
const linkFor = (id: string) => ({ name: 'snapshot', params: { id }, query: route.query });
</script>

<template>
  <ReportStatus v-if="!report" :is-pending="isPending" :error="error" @retry="refetch()" />
  <div v-else class="run">
    <header class="run__head">
      <div>
        <h1>Visual review</h1>
        <p class="run__meta">
          Run <code>{{ report.runId.slice(0, 8) }}</code> · {{ formatDateTime(report.createdAt) }} ·
          {{ report.summary.total }} snapshots · threshold {{ report.settings.threshold }} · tolerance
          {{ formatPercent(report.settings.toleranceRatio) }}
        </p>
      </div>
    </header>

    <RunSummary :report="report" />
    <ChangeChart :entries="report.entries" :link-for="linkFor" />

    <Card title="Snapshots" description="Open a snapshot to compare it with its baseline and decide.">
      <template #actions>
        <details class="run__keys">
          <summary>Keyboard shortcuts</summary>
          <dl>
            <div>
              <dt><Kbd keys="J" /> / <Kbd keys="K" /></dt>
              <dd>Next / previous snapshot</dd>
            </div>
            <div>
              <dt><Kbd keys="A" /> <Kbd keys="R" /> <Kbd keys="U" /></dt>
              <dd>Approve, reject, undo</dd>
            </div>
            <div>
              <dt><Kbd keys="1" />–<Kbd keys="4" /></dt>
              <dd>Diff, side by side, slider, onion skin</dd>
            </div>
            <div>
              <dt><Kbd keys="Z" /></dt>
              <dd>Toggle actual size</dd>
            </div>
            <div>
              <dt><Kbd keys="Esc" /></dt>
              <dd>Back to the list</dd>
            </div>
          </dl>
        </details>
      </template>
      <div class="run__list">
        <FilterBar v-model="filters" :entries="report.entries" :matches="visible.length" />
        <SnapshotTable :entries="visible" :link-for="linkFor" />
      </div>
    </Card>
  </div>
</template>

<style scoped>
.run {
  display: grid;
  gap: var(--space-5);
}
.run__head h1 {
  font-size: var(--text-xl);
}
.run__meta {
  margin: var(--space-1) 0 0;
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
}
.run__meta code {
  font-family: var(--font-mono);
}
.run__list {
  display: grid;
  gap: var(--space-4);
}
.run__keys {
  font-size: var(--text-sm);
}
.run__keys summary {
  cursor: pointer;
  color: var(--color-accent);
}
.run__keys dl {
  display: grid;
  gap: var(--space-1);
  margin: var(--space-2) 0 0;
}
.run__keys dl div {
  display: flex;
  gap: var(--space-2);
}
.run__keys dt {
  min-width: 6rem;
}
.run__keys dd {
  margin: 0;
  color: var(--color-text-secondary);
}
</style>
