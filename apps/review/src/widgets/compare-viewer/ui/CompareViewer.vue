<script setup lang="ts">
import type { ReportEntry } from '@pixelproof/core/schema';
import { computed, nextTick, ref, watch } from 'vue';

import { describeEntry } from '@/entities/report';
import { imageUrl, useReportSource } from '@/shared/api';
import { formatInt, useHotkeys } from '@/shared/lib';
import { Button, Kbd, SegmentedControl } from '@/shared/ui';

import ScaledStage from './ScaledStage.vue';

export type CompareMode = 'side' | 'slider' | 'onion' | 'diff';

const props = defineProps<{ entry: ReportEntry }>();
const source = useReportSource();

const urls = computed(() => ({
  baseline: imageUrl(source.url, props.entry, 'baseline'),
  current: imageUrl(source.url, props.entry, 'current'),
  diff: imageUrl(source.url, props.entry, 'diff'),
}));
const both = computed(() => Boolean(urls.value.baseline && urls.value.current));
const regions = computed(() => props.entry.diff?.regions ?? []);

const modes = computed(() => [
  { value: 'diff' as const, label: 'Diff', shortcut: '1', disabled: !urls.value.diff },
  { value: 'side' as const, label: 'Side by side', shortcut: '2' },
  { value: 'slider' as const, label: 'Slider', shortcut: '3', disabled: !both.value },
  { value: 'onion' as const, label: 'Onion skin', shortcut: '4', disabled: !both.value },
]);
const defaultMode = (): CompareMode => (urls.value.diff ? 'diff' : 'side');
const mode = ref<CompareMode>(defaultMode());
const actualSize = ref(false);
const split = ref(50);
const opacity = ref(50);
const selectedRegion = ref<number | null>(null);

watch(
  () => props.entry.id,
  () => {
    mode.value = defaultMode();
    selectedRegion.value = null;
  },
);

const pick = (m: CompareMode) => {
  if (!modes.value.find((o) => o.value === m)?.disabled) mode.value = m;
};
useHotkeys({
  '1': () => {
    pick('diff');
  },
  '2': () => {
    pick('side');
  },
  '3': () => {
    pick('slider');
  },
  '4': () => {
    pick('onion');
  },
  z: () => {
    actualSize.value = !actualSize.value;
  },
});

async function focusRegion(index: number) {
  selectedRegion.value = index;
  pick('diff');
  await nextTick();
  document
    .getElementById(`region-${props.entry.id}-${index}`)
    ?.scrollIntoView({ block: 'center', inline: 'center' });
}

const alt = (kind: string) => `${kind} screenshot of ${describeEntry(props.entry)}`;
</script>

<template>
  <div class="viewer">
    <div class="viewer__toolbar">
      <SegmentedControl v-model="mode" label="Comparison view" :options="modes" />
      <Button variant="secondary" size="sm" :pressed="actualSize" @click="actualSize = !actualSize">
        Actual size <Kbd keys="Z" />
      </Button>
    </div>

    <div v-if="mode === 'side'" class="viewer__side">
      <figure v-if="urls.baseline" class="viewer__pane">
        <figcaption>Baseline</figcaption>
        <ScaledStage :width="entry.width" :height="entry.height" :actual-size="actualSize">
          <img :src="urls.baseline" :alt="alt('Baseline')" />
        </ScaledStage>
      </figure>
      <figure v-if="urls.current" class="viewer__pane">
        <figcaption>{{ urls.baseline ? 'Current' : 'Current (no baseline yet)' }}</figcaption>
        <ScaledStage :width="entry.width" :height="entry.height" :actual-size="actualSize">
          <img :src="urls.current" :alt="alt('Current')" />
        </ScaledStage>
      </figure>
      <p v-if="!urls.current" class="viewer__note">
        This snapshot is no longer captured. Approving removes it from the baseline.
      </p>
    </div>

    <figure v-else-if="mode === 'slider' && urls.baseline && urls.current" class="viewer__pane">
      <figcaption>Baseline on the left of the divider, current on the right</figcaption>
      <ScaledStage :width="entry.width" :height="entry.height" :actual-size="actualSize">
        <img :src="urls.baseline" :alt="alt('Baseline')" />
        <img :src="urls.current" :alt="alt('Current')" :style="{ clipPath: `inset(0 0 0 ${split}%)` }" />
        <span class="viewer__divider" :style="{ left: `${split}%` }" aria-hidden="true" />
      </ScaledStage>
      <label class="viewer__range">
        Divider position <input v-model.number="split" type="range" min="0" max="100" step="1" />
        <output>{{ split }}%</output>
      </label>
    </figure>

    <figure v-else-if="mode === 'onion' && urls.baseline && urls.current" class="viewer__pane">
      <figcaption>Current over baseline</figcaption>
      <ScaledStage :width="entry.width" :height="entry.height" :actual-size="actualSize">
        <img :src="urls.baseline" :alt="alt('Baseline')" />
        <img :src="urls.current" :alt="alt('Current')" :style="{ opacity: opacity / 100 }" />
      </ScaledStage>
      <label class="viewer__range">
        Current opacity <input v-model.number="opacity" type="range" min="0" max="100" step="1" />
        <output>{{ opacity }}%</output>
      </label>
    </figure>

    <div v-else-if="mode === 'diff' && urls.diff" class="viewer__diff">
      <figure class="viewer__pane">
        <figcaption>Changed pixels in red, with each changed region outlined</figcaption>
        <ScaledStage :width="entry.width" :height="entry.height" :actual-size="actualSize">
          <img :src="urls.diff" :alt="alt('Difference')" />
          <span
            v-for="(r, i) in regions"
            :id="`region-${entry.id}-${i}`"
            :key="i"
            class="viewer__region"
            :class="{ 'viewer__region--active': selectedRegion === i }"
            :style="{
              left: `${r.x - 3}px`,
              top: `${r.y - 3}px`,
              width: `${r.width + 6}px`,
              height: `${r.height + 6}px`,
            }"
            aria-hidden="true"
          >
            <span class="viewer__region-tag">{{ i + 1 }}</span>
          </span>
        </ScaledStage>
      </figure>
      <nav class="viewer__regions" aria-label="Changed regions">
        <h3 class="viewer__regions-title">
          {{ regions.length }} changed {{ regions.length === 1 ? 'region' : 'regions' }}
        </h3>
        <ol>
          <li v-for="(r, i) in regions" :key="i">
            <button
              type="button"
              class="viewer__region-btn"
              :aria-current="selectedRegion === i ? 'true' : undefined"
              @click="focusRegion(i)"
            >
              <span class="viewer__region-num">{{ i + 1 }}</span>
              <span>{{ r.width }}×{{ r.height }} at {{ r.x }}, {{ r.y }}</span>
              <span class="viewer__muted">{{ formatInt(r.pixels) }} px</span>
            </button>
          </li>
        </ol>
      </nav>
    </div>
  </div>
</template>

<style scoped>
.viewer {
  display: grid;
  gap: var(--space-4);
}
.viewer__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-3);
}
.viewer__side {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 18rem), 1fr));
  gap: var(--space-4);
  align-items: start;
}
.viewer__pane {
  margin: 0;
  display: grid;
  gap: var(--space-2);
  min-width: 0;
  overflow-x: auto;
}
.viewer__pane figcaption {
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  color: var(--color-text-secondary);
}
.viewer__note {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
}
.viewer__divider {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  margin-left: -1px;
  background: var(--color-accent);
}
.viewer__range {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  font-size: var(--text-sm);
}
.viewer__range input {
  flex: 1;
  accent-color: var(--color-accent);
}
.viewer__range output {
  min-width: 3ch;
  font-variant-numeric: tabular-nums;
}
.viewer__diff {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 16rem;
  gap: var(--space-4);
  align-items: start;
}
.viewer__region {
  position: absolute;
  border: 2px solid var(--color-accent);
  border-radius: 3px;
}
.viewer__region--active {
  border-width: 4px;
  box-shadow: 0 0 0 9999px rgb(0 0 0 / 0.25);
}
.viewer__region-tag {
  position: absolute;
  top: -2px;
  left: -2px;
  transform: translateY(-100%);
  padding: 0 6px;
  background: var(--color-accent);
  color: var(--color-on-accent);
  font-size: 14px;
  font-weight: var(--weight-bold);
  border-radius: 3px 3px 0 0;
}
.viewer__regions {
  position: sticky;
  top: var(--space-4);
}
.viewer__regions-title {
  font-size: var(--text-sm);
  margin-bottom: var(--space-2);
}
.viewer__regions ol {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: var(--space-1);
  max-height: 60vh;
  overflow-y: auto;
}
.viewer__region-btn {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: var(--space-2);
  width: 100%;
  padding: var(--space-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  color: var(--color-text);
  font: inherit;
  font-size: var(--text-xs);
  text-align: left;
  cursor: pointer;
}
.viewer__region-btn[aria-current='true'] {
  border-color: var(--color-accent);
  background: var(--color-accent-soft);
}
.viewer__region-num {
  display: inline-grid;
  place-items: center;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 4px;
  background: var(--color-accent);
  color: var(--color-on-accent);
  font-weight: var(--weight-bold);
}
.viewer__muted {
  color: var(--color-text-secondary);
}
@media (max-width: 860px) {
  .viewer__diff {
    grid-template-columns: 1fr;
  }
  .viewer__regions {
    position: static;
  }
}
</style>
