<script setup lang="ts">
import type { ReportEntry } from '@pixelproof/core/schema';
import { computed } from 'vue';

import { Button } from '@/shared/ui';

import { DEFAULT_FILTERS, facetValues, type Filters } from '../model/filters';

const props = defineProps<{ entries: readonly ReportEntry[]; matches: number }>();
const model = defineModel<Filters>({ required: true });

const facets = computed(() => facetValues(props.entries));
const isDefault = computed(() => JSON.stringify(model.value) === JSON.stringify(DEFAULT_FILTERS));
const set = <K extends keyof Filters>(key: K, value: Filters[K]) => {
  model.value = { ...model.value, [key]: value };
};
const onInput = (key: 'group' | 'viewport' | 'q', event: Event) => {
  set(key, (event.target as HTMLInputElement | HTMLSelectElement).value);
};
</script>

<template>
  <form class="filters" role="search" aria-label="Filter snapshots" @submit.prevent>
    <label class="filters__field">
      <span>Status</span>
      <select
        :value="model.status"
        @change="set('status', ($event.target as HTMLSelectElement).value as Filters['status'])"
      >
        <option value="pending">Needs review</option>
        <option value="changed">Changed</option>
        <option value="new">New</option>
        <option value="removed">Removed</option>
        <option value="unchanged">Unchanged</option>
        <option value="all">All snapshots</option>
      </select>
    </label>
    <label class="filters__field">
      <span>Group</span>
      <select :value="model.group" @change="onInput('group', $event)">
        <option value="">All groups</option>
        <option v-for="g in facets.groups" :key="g" :value="g">{{ g }}</option>
      </select>
    </label>
    <label class="filters__field">
      <span>Viewport</span>
      <select :value="model.viewport" @change="onInput('viewport', $event)">
        <option value="">All viewports</option>
        <option v-for="v in facets.viewports" :key="v" :value="v">{{ v }}</option>
      </select>
    </label>
    <label class="filters__field">
      <span>Theme</span>
      <select
        :value="model.theme"
        @change="set('theme', ($event.target as HTMLSelectElement).value as Filters['theme'])"
      >
        <option value="">Light and dark</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </label>
    <label class="filters__field filters__search">
      <span>Search</span>
      <input type="search" :value="model.q" placeholder="Name or id" @input="onInput('q', $event)" />
    </label>
    <div class="filters__meta">
      <span aria-live="polite">{{ matches }} {{ matches === 1 ? 'snapshot' : 'snapshots' }}</span>
      <Button v-if="!isDefault" variant="ghost" size="sm" @click="model = { ...DEFAULT_FILTERS }"
        >Reset filters</Button
      >
    </div>
  </form>
</template>

<style scoped>
.filters {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: var(--space-3);
}
.filters__field {
  display: grid;
  gap: var(--space-1);
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
}
.filters__field select,
.filters__field input {
  min-height: 2.25rem;
  padding: var(--space-1) var(--space-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  color: var(--color-text);
  font: inherit;
  font-size: var(--text-sm);
}
.filters__search {
  flex: 1 1 12rem;
}
.filters__meta {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-left: auto;
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
}
</style>
