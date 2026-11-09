<script setup lang="ts">
defineProps<{ keys: string }>();
</script>

<template>
  <kbd class="kbd">{{ keys }}</kbd>
</template>

<style scoped>
.kbd {
  display: inline-block;
  min-width: 1.5em;
  padding: 0 0.35em;
  border: 1px solid var(--color-border);
  border-bottom-width: 2px;
  border-radius: 4px;
  background: var(--color-surface);
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  text-align: center;
  color: var(--color-text);
}
</style>
