<script setup lang="ts" generic="T extends string">
import { useId } from 'vue';

export interface SegmentOption<V extends string> {
  value: V;
  label: string;
  disabled?: boolean;
  /** Keyboard shortcut shown as a hint, e.g. "1". */
  shortcut?: string;
}

defineProps<{ label: string; options: readonly SegmentOption<T>[]; hideLabel?: boolean }>();
const model = defineModel<T>({ required: true });
const name = useId();
</script>

<template>
  <fieldset class="seg">
    <legend :class="hideLabel ? 'visually-hidden' : 'seg__legend'">{{ label }}</legend>
    <div class="seg__track">
      <label
        v-for="o in options"
        :key="o.value"
        class="seg__option"
        :class="{ 'seg__option--active': model === o.value, 'seg__option--disabled': o.disabled }"
      >
        <input
          v-model="model"
          class="visually-hidden"
          type="radio"
          :name="name"
          :value="o.value"
          :disabled="o.disabled"
        />
        <span>{{ o.label }}</span>
        <kbd v-if="o.shortcut" class="seg__kbd" aria-hidden="true">{{ o.shortcut }}</kbd>
      </label>
    </div>
  </fieldset>
</template>

<style scoped>
.seg {
  border: 0;
  margin: 0;
  padding: 0;
  min-width: 0;
}
.seg__legend {
  padding: 0;
  margin-bottom: var(--space-1);
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
}
.seg__track {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 2px;
  padding: 2px;
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
}
.seg__option {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-3);
  border-radius: 4px;
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  cursor: pointer;
}
.seg__option--active {
  background: var(--color-surface);
  color: var(--color-text);
  box-shadow: var(--shadow-1);
}
.seg__option--disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.seg__option:has(input:focus-visible) {
  box-shadow: var(--focus-ring);
}
.seg__kbd {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: var(--color-text-secondary);
}
</style>
