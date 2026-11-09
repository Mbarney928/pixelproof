<script setup lang="ts">
import { useId } from 'vue';

defineProps<{ title?: string | undefined; description?: string | undefined }>();
const titleId = useId();
</script>

<template>
  <section class="card" :aria-labelledby="title ? titleId : undefined">
    <header v-if="title || $slots['actions']" class="card__head">
      <div>
        <h2 v-if="title" :id="titleId" class="card__title">{{ title }}</h2>
        <p v-if="description" class="card__description">{{ description }}</p>
      </div>
      <div v-if="$slots['actions']" class="card__actions"><slot name="actions" /></div>
    </header>
    <slot />
  </section>
</template>

<style scoped>
.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-1);
  padding: var(--space-5);
  min-width: 0;
}
.card__head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}
.card__title {
  font-size: var(--text-md);
  font-weight: var(--weight-bold);
}
.card__description {
  margin: var(--space-1) 0 0;
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
}
.card__actions {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}
</style>
