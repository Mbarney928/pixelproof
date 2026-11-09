<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';

import { SeverityBadge, StatusBadge, useReport } from '@/entities/report';
import { useReviewStore } from '@/entities/review';
import { DecisionBar } from '@/features/review-decision';
import { applyFilters, filtersFromQuery } from '@/features/snapshot-filters';
import { formatInt, formatPercent, useHotkeys } from '@/shared/lib';
import { Button, Card, EmptyState, Kbd } from '@/shared/ui';
import { CompareViewer } from '@/widgets/compare-viewer';
import { ReportStatus } from '@/widgets/report-status';

const props = defineProps<{ id: string }>();
const route = useRoute();
const router = useRouter();
const { data: report, isPending, error, refetch } = useReport();
const review = useReviewStore();
const heading = ref<HTMLElement | null>(null);
const autoAdvance = ref(true);

watch(
  report,
  (r) => {
    if (r) review.startRun(r.runId);
  },
  { immediate: true },
);

const entry = computed(() => report.value?.entries.find((e) => e.id === props.id));
/** Next/previous follow the list the reviewer came from (same filters), so j/k walks that list. */
const sequence = computed(() => {
  if (!report.value) return [];
  const filtered = applyFilters(report.value.entries, filtersFromQuery(route.query));
  return filtered.some((e) => e.id === props.id) ? filtered : report.value.entries;
});
const index = computed(() => sequence.value.findIndex((e) => e.id === props.id));
const prev = computed(() => (index.value > 0 ? sequence.value[index.value - 1] : undefined));
const next = computed(() => (index.value >= 0 ? sequence.value[index.value + 1] : undefined));
const backLink = computed(() => ({ name: 'run', query: route.query }));
const go = (id: string | undefined) => {
  if (id) void router.push({ name: 'snapshot', params: { id }, query: route.query });
};

// Move focus to the heading on every snapshot change so screen readers announce where they are.
watch(
  () => [props.id, entry.value !== undefined] as const,
  async ([, ready]) => {
    if (!ready) return;
    await nextTick();
    heading.value?.focus();
  },
  { immediate: true },
);

useHotkeys({
  j: () => {
    go(next.value?.id);
  },
  k: () => {
    go(prev.value?.id);
  },
  Escape: () => {
    void router.push(backLink.value);
  },
});

function onDecided() {
  if (autoAdvance.value) go(next.value?.id);
}
</script>

<template>
  <ReportStatus v-if="!report" :is-pending="isPending" :error="error" @retry="refetch()" />
  <div v-else-if="!entry" class="snap">
    <RouterLink :to="backLink" class="snap__back">← All snapshots</RouterLink>
    <EmptyState title="Snapshot not found" :description="`This report has no snapshot with id “${id}”.`" />
  </div>
  <div v-else class="snap">
    <nav class="snap__nav" aria-label="Snapshot navigation">
      <RouterLink :to="backLink" class="snap__back">← All snapshots <Kbd keys="Esc" /></RouterLink>
      <div class="snap__pager">
        <Button variant="secondary" size="sm" :disabled="!prev" @click="go(prev?.id)">
          Previous <Kbd keys="K" />
        </Button>
        <span class="snap__position">{{ index + 1 }} of {{ sequence.length }}</span>
        <Button variant="secondary" size="sm" :disabled="!next" @click="go(next?.id)">
          Next <Kbd keys="J" />
        </Button>
      </div>
    </nav>

    <header class="snap__head">
      <p class="snap__group">{{ entry.group }}</p>
      <h1 ref="heading" tabindex="-1">{{ entry.name }}</h1>
      <div class="snap__badges">
        <StatusBadge :status="entry.status" />
        <SeverityBadge :severity="entry.severity" />
      </div>
    </header>

    <dl class="snap__facts">
      <div>
        <dt>Viewport</dt>
        <dd>{{ entry.viewport.name }} · {{ entry.viewport.width }}×{{ entry.viewport.height }}</dd>
      </div>
      <div>
        <dt>Theme</dt>
        <dd>{{ entry.theme === 'dark' ? 'Dark' : 'Light' }}</dd>
      </div>
      <div>
        <dt>Screenshot</dt>
        <dd>{{ entry.width }}×{{ entry.height }} px</dd>
      </div>
      <template v-if="entry.diff && entry.status === 'changed'">
        <div>
          <dt>Changed pixels</dt>
          <dd>{{ formatInt(entry.diff.pixels) }} ({{ formatPercent(entry.diff.ratio) }})</dd>
        </div>
        <div>
          <dt>Similarity (SSIM)</dt>
          <dd>{{ entry.diff.ssim.toFixed(3) }}</dd>
        </div>
        <div v-if="entry.diff.sizeChanged">
          <dt>Layout</dt>
          <dd>Page size changed</dd>
        </div>
      </template>
      <div class="snap__url">
        <dt>Captured from</dt>
        <dd>
          <code>{{ entry.url }}</code>
        </dd>
      </div>
    </dl>

    <Card>
      <div class="snap__decision">
        <DecisionBar :entry="entry" @decided="onDecided" />
        <label class="snap__auto">
          <input v-model="autoAdvance" type="checkbox" /> Go to the next snapshot after deciding
        </label>
      </div>
    </Card>

    <CompareViewer :entry="entry" />
  </div>
</template>

<style scoped>
.snap {
  display: grid;
  gap: var(--space-4);
}
.snap__nav {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}
.snap__back {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-sm);
}
.snap__pager {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
.snap__position {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  font-variant-numeric: tabular-nums;
}
.snap__group {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
}
.snap__head h1 {
  font-size: var(--text-xl);
}
.snap__head h1:focus {
  /* Focus is moved here for screen readers; it is not an interactive target, so no ring. */
  outline: none;
  box-shadow: none;
}
.snap__badges {
  display: flex;
  gap: var(--space-2);
  margin-top: var(--space-2);
}
.snap__facts {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2) var(--space-5);
  margin: 0;
  font-size: var(--text-sm);
}
.snap__facts dt {
  color: var(--color-text-secondary);
  font-size: var(--text-xs);
}
.snap__facts dd {
  margin: 0;
  font-variant-numeric: tabular-nums;
}
.snap__url code {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  overflow-wrap: anywhere;
}
.snap__decision {
  display: grid;
  gap: var(--space-3);
}
.snap__auto {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
}
</style>
