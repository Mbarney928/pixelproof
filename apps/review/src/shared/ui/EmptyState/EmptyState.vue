<script setup lang="ts">
defineProps<{ title: string; description?: string | undefined }>();
</script>

<template>
  <div class="empty">
    <p class="empty__title">{{ title }}</p>
    <p v-if="description" class="empty__description">{{ description }}</p>
    <slot />
  </div>
</template>

<style scoped>
.empty {
  display: grid;
  justify-items: center;
  gap: var(--space-2);
  padding: var(--space-6) var(--space-4);
  text-align: center;
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-md);
}
.empty__title {
  margin: 0;
  font-weight: var(--weight-bold);
}
.empty__description {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
  max-width: 40ch;
}
</style>
