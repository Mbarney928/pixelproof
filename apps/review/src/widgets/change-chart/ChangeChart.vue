<script setup lang="ts">
import type { ReportEntry } from '@pixelproof/core/schema';
import { computed, ref, useId } from 'vue';
import { RouterLink, type RouteLocationRaw } from 'vue-router';

import { SEVERITY_META } from '@/entities/report';
import { formatInt, formatPercent } from '@/shared/lib';
import { Button, Card, EmptyState } from '@/shared/ui';

import { niceMax } from './model/scale';

const props = withDefaults(
  defineProps<{
    entries: readonly ReportEntry[];
    limit?: number;
    linkFor: (id: string) => RouteLocationRaw;
  }>(),
  { limit: 12 },
);

const rows = computed(() =>
  props.entries
    .filter((e) => e.status === 'changed' && e.diff)
    .map((e) => ({ entry: e, ratio: e.diff?.ratio ?? 0 }))
    .sort((a, b) => b.ratio - a.ratio)
    .slice(0, props.limit),
);
const axisMax = computed(() => niceMax(Math.max(0, ...rows.value.map((r) => r.ratio))));
const ticks = computed(() => [0, axisMax.value / 2, axisMax.value]);
const showTable = ref(false);
const active = ref<string | null>(null);
const tooltipId = useId();
const label = (e: ReportEntry) => `${e.name} · ${e.viewport.name} · ${e.theme}`;
</script>

<template>
  <Card
    title="Largest changes"
    description="Share of each screenshot's pixels that changed. The longest bars usually deserve a look first."
  >
    <template #actions>
      <Button
        v-if="rows.length > 0"
        variant="secondary"
        size="sm"
        :pressed="showTable"
        @click="showTable = !showTable"
      >
        {{ showTable ? 'Show chart' : 'Show table' }}
      </Button>
    </template>

    <EmptyState
      v-if="rows.length === 0"
      title="No changed snapshots"
      description="Nothing differs from the baseline."
    />

    <div
      v-else-if="showTable"
      class="chart__table"
      role="region"
      aria-label="Largest changes table"
      tabindex="0"
    >
      <table>
        <thead>
          <tr>
            <th scope="col">Snapshot</th>
            <th scope="col" class="num">Changed pixels</th>
            <th scope="col" class="num">Share</th>
            <th scope="col" class="num">SSIM</th>
            <th scope="col">Severity</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in rows" :key="r.entry.id">
            <th scope="row">{{ r.entry.group }} / {{ label(r.entry) }}</th>
            <td class="num">{{ formatInt(r.entry.diff?.pixels ?? 0) }}</td>
            <td class="num">{{ formatPercent(r.ratio) }}</td>
            <td class="num">{{ (r.entry.diff?.ssim ?? 1).toFixed(3) }}</td>
            <td>{{ SEVERITY_META[r.entry.severity].label }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <figure v-else class="chart">
      <ul class="chart__rows" :style="{ '--ticks': ticks.length - 1 }">
        <li v-for="r in rows" :key="r.entry.id" class="chart__row">
          <span class="chart__label">{{ label(r.entry) }}</span>
          <span class="chart__plot">
            <RouterLink
              :to="linkFor(r.entry.id)"
              class="chart__hit"
              :aria-describedby="active === r.entry.id ? tooltipId : undefined"
              @mouseenter="active = r.entry.id"
              @mouseleave="active = null"
              @focus="active = r.entry.id"
              @blur="active = null"
            >
              <span class="chart__bar" :style="{ width: `${(r.ratio / axisMax) * 100}%` }" />
              <span class="visually-hidden">
                {{ r.entry.group }} / {{ label(r.entry) }}: {{ formatPercent(r.ratio) }} of pixels changed.
                Open.
              </span>
            </RouterLink>
            <span v-if="active === r.entry.id" :id="tooltipId" role="tooltip" class="chart__tooltip">
              <strong>{{ r.entry.group }} / {{ r.entry.name }}</strong>
              <span
                >{{ formatInt(r.entry.diff?.pixels ?? 0) }} px changed ({{ formatPercent(r.ratio) }})</span
              >
              <span
                >SSIM {{ (r.entry.diff?.ssim ?? 1).toFixed(3) }} ·
                {{ r.entry.diff?.regions.length ?? 0 }} regions</span
              >
            </span>
          </span>
          <span class="chart__value" aria-hidden="true">{{ formatPercent(r.ratio) }}</span>
        </li>
      </ul>
      <div class="chart__row chart__axisrow" aria-hidden="true">
        <span />
        <span class="chart__axis">
          <span v-for="t in ticks" :key="t">{{ formatPercent(t) }}</span>
        </span>
        <span />
      </div>
      <figcaption class="visually-hidden">
        Bar chart of the {{ rows.length }} most changed snapshots by share of changed pixels. A table view is
        available.
      </figcaption>
    </figure>
  </Card>
</template>

<style scoped>
.chart {
  margin: 0;
}
.chart__rows {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: var(--space-1);
}
.chart__row {
  display: grid;
  grid-template-columns: minmax(8rem, 15rem) minmax(0, 1fr) 3.5rem;
  align-items: center;
  gap: var(--space-3);
}
.chart__label {
  font-size: var(--text-sm);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.chart__plot {
  position: relative;
  /* Recessive gridlines at each tick. */
  background-image: linear-gradient(to right, var(--color-border) 1px, transparent 1px);
  background-size: calc(100% / var(--ticks)) 100%;
}
.chart__hit {
  display: flex;
  align-items: center;
  height: 1.75rem;
  border-radius: 4px;
}
.chart__bar {
  display: block;
  height: 0.75rem;
  min-width: 2px;
  background: var(--color-series-1);
  border-radius: 0 4px 4px 0;
}
.chart__hit:hover .chart__bar,
.chart__hit:focus-visible .chart__bar {
  filter: brightness(1.15);
}
.chart__value {
  font-size: var(--text-sm);
  font-variant-numeric: tabular-nums;
  color: var(--color-text-secondary);
}
.chart__tooltip {
  position: absolute;
  left: 0;
  bottom: calc(100% + 4px);
  z-index: 2;
  display: grid;
  gap: 2px;
  padding: var(--space-2) var(--space-3);
  background: var(--color-text);
  color: var(--color-bg);
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  white-space: nowrap;
  pointer-events: none;
}
.chart__axisrow {
  margin-top: var(--space-1);
}
.chart__axis {
  display: flex;
  justify-content: space-between;
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
}
.chart__table {
  overflow-x: auto;
}
.chart__table table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--text-sm);
}
.chart__table th,
.chart__table td {
  padding: var(--space-2);
  border-bottom: 1px solid var(--color-border);
  text-align: left;
}
.chart__table th[scope='row'] {
  font-weight: var(--weight-medium);
}
.num {
  text-align: right !important;
  font-variant-numeric: tabular-nums;
}
@media (max-width: 640px) {
  .chart__row {
    grid-template-columns: minmax(0, 1fr) 3.5rem;
  }
  .chart__label {
    grid-column: 1 / -1;
  }
  .chart__axisrow > span:first-child {
    display: none;
  }
}
</style>
