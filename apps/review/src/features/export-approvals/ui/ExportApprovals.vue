<script setup lang="ts">
import type { Report } from '@pixelproof/core/schema';
import { computed, ref } from 'vue';

import { useReviewStore } from '@/entities/review';
import { Button } from '@/shared/ui';

const props = defineProps<{ report: Report }>();
const review = useReviewStore();
const approvals = computed(() => review.toApprovals(props.report));
const exported = ref(false);

function download() {
  const blob = new Blob([`${JSON.stringify(approvals.value, null, 2)}\n`], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'approvals.json';
  link.click();
  URL.revokeObjectURL(url);
  exported.value = true;
}
</script>

<template>
  <div class="export">
    <Button :disabled="approvals.approved.length === 0" @click="download">
      Export approvals ({{ approvals.approved.length }})
    </Button>
    <p class="export__hint" :class="{ 'export__hint--done': exported }" aria-live="polite">
      {{ exported ? 'Saved. Apply it with' : 'Then apply it with' }}
      <code>npx pixelproof approve --from approvals.json</code>
    </p>
  </div>
</template>

<style scoped>
.export {
  display: grid;
  gap: var(--space-2);
  justify-items: start;
}
.export__hint {
  margin: 0;
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
}
.export__hint code {
  font-family: var(--font-mono);
  overflow-wrap: anywhere;
}
.export__hint--done {
  color: var(--color-good-ink);
}
</style>
