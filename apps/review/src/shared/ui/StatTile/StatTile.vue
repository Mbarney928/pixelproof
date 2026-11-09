<script setup lang="ts">
import type { BadgeTone } from '../Badge/Badge.vue';

withDefaults(
  defineProps<{
    label: string;
    value: string | number;
    detail?: string | undefined;
    /** Status accent; always paired with the label text, never colour alone. */
    tone?: BadgeTone;
    icon?: string | undefined;
  }>(),
  { tone: 'neutral', detail: undefined, icon: undefined },
);
</script>

<template>
  <div class="tile" :class="`tile--${tone}`">
    <dt class="tile__label">
      <span v-if="icon" class="tile__icon" aria-hidden="true">{{ icon }}</span
      >{{ label }}
    </dt>
    <dd class="tile__value">{{ value }}</dd>
    <dd v-if="detail" class="tile__detail">{{ detail }}</dd>
  </div>
</template>

<style scoped>
.tile {
  margin: 0;
  padding: var(--space-4);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-top: 3px solid var(--tile-accent, var(--color-border));
  border-radius: var(--radius-md);
  min-width: 0;
}
.tile--info {
  --tile-accent: var(--color-info-ink);
}
.tile--good {
  --tile-accent: var(--color-good-ink);
}
.tile--warning {
  --tile-accent: var(--color-warning-ink);
}
.tile--critical {
  --tile-accent: var(--color-critical-ink);
}
.tile__label {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
}
.tile__icon {
  color: var(--tile-accent);
}
.tile__value {
  margin: var(--space-1) 0 0;
  font-size: var(--text-xl);
  font-weight: var(--weight-bold);
  font-variant-numeric: tabular-nums;
}
.tile__detail {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--text-xs);
}
</style>
