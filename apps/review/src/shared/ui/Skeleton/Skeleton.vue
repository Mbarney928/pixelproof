<script setup lang="ts">
withDefaults(defineProps<{ width?: string; height?: string }>(), { width: '100%', height: '1em' });
</script>

<template>
  <span class="skeleton" aria-hidden="true" :style="{ width, height }" />
</template>

<style scoped>
.skeleton {
  display: block;
  border-radius: var(--radius-sm);
  background: linear-gradient(90deg, var(--color-surface-2), var(--color-border), var(--color-surface-2));
  background-size: 200% 100%;
  animation: shimmer 1.4s ease-in-out infinite;
}
@keyframes shimmer {
  from {
    background-position: 100% 0;
  }
  to {
    background-position: -100% 0;
  }
}
</style>
