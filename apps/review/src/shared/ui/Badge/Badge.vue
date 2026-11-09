<script setup lang="ts">
export type BadgeTone = 'neutral' | 'info' | 'good' | 'warning' | 'critical';

withDefaults(defineProps<{ tone?: BadgeTone; icon?: string | undefined }>(), {
  tone: 'neutral',
  icon: undefined,
});
</script>

<template>
  <span class="badge" :class="`badge--${tone}`">
    <span v-if="icon" class="badge__icon" aria-hidden="true">{{ icon }}</span>
    <slot />
  </span>
</template>

<style scoped>
.badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: 0.1rem var(--space-2);
  border-radius: 999px;
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  line-height: 1.5;
  white-space: nowrap;
}
.badge__icon {
  font-size: 0.85em;
}
.badge--neutral {
  background: var(--color-surface-2);
  color: var(--color-text-secondary);
}
.badge--info {
  background: var(--color-info-bg);
  color: var(--color-info-ink);
}
.badge--good {
  background: var(--color-good-bg);
  color: var(--color-good-ink);
}
.badge--warning {
  background: var(--color-warning-bg);
  color: var(--color-warning-ink);
}
.badge--critical {
  background: var(--color-critical-bg);
  color: var(--color-critical-ink);
}
</style>
