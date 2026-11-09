<script setup lang="ts">
import type { Report } from '@pixelproof/core/schema';
import { computed, useId } from 'vue';

import { STATUS_META } from '@/entities/report';
import { useReviewStore } from '@/entities/review';
import { ExportApprovals } from '@/features/export-approvals';
import { Card, StatTile } from '@/shared/ui';

const props = defineProps<{ report: Report }>();
const review = useReviewStore();
const meterId = useId();

const pendingIds = computed(() =>
  props.report.entries.filter((e) => e.status !== 'unchanged').map((e) => e.id),
);
const decided = computed(() => pendingIds.value.filter((id) => review.decisions[id]).length);
const approved = computed(() => pendingIds.value.filter((id) => review.decisions[id] === 'approved').length);
const rejected = computed(() => decided.value - approved.value);

const tiles = computed(() =>
  (['changed', 'new', 'removed', 'unchanged'] as const).map((status) => ({
    status,
    ...STATUS_META[status],
    value: props.report.summary[status],
  })),
);
</script>

<template>
  <div class="summary">
    <dl class="summary__tiles">
      <StatTile
        v-for="t in tiles"
        :key="t.status"
        :label="t.label"
        :value="t.value"
        :detail="t.hint"
        :tone="t.tone"
        :icon="t.icon"
      />
    </dl>
    <Card title="Review progress" class="summary__progress">
      <template v-if="pendingIds.length > 0">
        <div class="summary__meter">
          <span :id="meterId">{{ decided }} of {{ pendingIds.length }} reviewed</span>
          <progress :aria-labelledby="meterId" :max="pendingIds.length" :value="decided">
            {{ decided }} of {{ pendingIds.length }}
          </progress>
        </div>
        <p class="summary__split">{{ approved }} approved · {{ rejected }} rejected</p>
        <ExportApprovals :report="report" />
      </template>
      <p v-else class="summary__split">Every snapshot matches its baseline. Nothing to review.</p>
    </Card>
  </div>
</template>

<style scoped>
.summary {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(16rem, 1fr);
  gap: var(--space-4);
}
.summary__tiles {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
  align-content: start;
  gap: var(--space-3);
  margin: 0;
}
.summary__meter {
  display: grid;
  gap: var(--space-1);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
}
.summary__meter progress {
  width: 100%;
  height: 0.6rem;
  accent-color: var(--color-accent);
}
.summary__split {
  margin: var(--space-2) 0 var(--space-4);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
}
@media (max-width: 760px) {
  .summary {
    grid-template-columns: 1fr;
  }
}
</style>
