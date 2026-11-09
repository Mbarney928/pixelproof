<script setup lang="ts">
import Button from '../Button/Button.vue';

withDefaults(defineProps<{ title?: string; message: string; retryLabel?: string; retryable?: boolean }>(), {
  title: 'Something went wrong',
  retryLabel: 'Try again',
  retryable: false,
});
defineEmits<{ retry: [] }>();
</script>

<template>
  <div class="error" role="alert">
    <span class="error__icon" aria-hidden="true">⛔</span>
    <div>
      <p class="error__title">{{ title }}</p>
      <p class="error__message">{{ message }}</p>
      <Button v-if="retryable" variant="secondary" size="sm" @click="$emit('retry')">{{ retryLabel }}</Button>
    </div>
  </div>
</template>

<style scoped>
.error {
  display: flex;
  gap: var(--space-3);
  padding: var(--space-4);
  background: var(--color-critical-bg);
  color: var(--color-critical-ink);
  border-radius: var(--radius-md);
}
.error__title {
  margin: 0;
  font-weight: var(--weight-bold);
}
.error__message {
  margin: var(--space-1) 0 var(--space-3);
}
</style>
