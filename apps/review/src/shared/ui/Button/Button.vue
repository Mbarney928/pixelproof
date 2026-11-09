<script setup lang="ts">
import { cva, type VariantProps } from 'class-variance-authority';
import { computed } from 'vue';

const button = cva('btn', {
  variants: {
    variant: {
      primary: 'btn--primary',
      secondary: 'btn--secondary',
      ghost: 'btn--ghost',
      danger: 'btn--danger',
    },
    size: { sm: 'btn--sm', md: 'btn--md' },
  },
  defaultVariants: { variant: 'primary', size: 'md' },
});
type ButtonVariants = VariantProps<typeof button>;

const props = withDefaults(
  defineProps<{
    variant?: NonNullable<ButtonVariants['variant']>;
    size?: NonNullable<ButtonVariants['size']>;
    type?: 'button' | 'submit';
    disabled?: boolean;
    /** Shows a spinner, sets aria-busy and blocks clicks. */
    loading?: boolean;
    pressed?: boolean | undefined;
  }>(),
  { variant: 'primary', size: 'md', type: 'button', disabled: false, loading: false, pressed: undefined },
);
defineEmits<{ click: [event: MouseEvent] }>();

const classes = computed(() => button({ variant: props.variant, size: props.size }));
</script>

<template>
  <button
    :type="props.type"
    :class="classes"
    :disabled="props.disabled || props.loading"
    :aria-busy="props.loading || undefined"
    :aria-pressed="props.pressed"
    @click="$emit('click', $event)"
  >
    <span v-if="props.loading" class="btn__spinner" aria-hidden="true" />
    <slot />
  </button>
</template>

<style scoped>
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  font: inherit;
  font-weight: var(--weight-medium);
  line-height: 1.2;
  cursor: pointer;
  white-space: nowrap;
  transition: background-color 120ms ease;
}
.btn:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}
.btn--md {
  padding: var(--space-2) var(--space-4);
  font-size: var(--text-sm);
  min-height: 2.25rem;
}
.btn--sm {
  padding: var(--space-1) var(--space-3);
  font-size: var(--text-xs);
  min-height: 1.85rem;
}
.btn--primary {
  background: var(--color-accent);
  color: var(--color-on-accent);
}
.btn--primary:hover:not(:disabled) {
  background: var(--color-accent-hover);
}
.btn--secondary {
  background: var(--color-surface);
  color: var(--color-text);
  border-color: var(--color-border);
}
.btn--secondary:hover:not(:disabled),
.btn--ghost:hover:not(:disabled) {
  background: var(--color-surface-2);
}
.btn--ghost {
  background: transparent;
  color: var(--color-text);
}
.btn--danger {
  background: var(--color-critical-bg);
  color: var(--color-critical-ink);
  border-color: currentColor;
}
.btn[aria-pressed='true'] {
  background: var(--color-accent-soft);
  border-color: var(--color-accent);
}
.btn__spinner {
  width: 0.9em;
  height: 0.9em;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
