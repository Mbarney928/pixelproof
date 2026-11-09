<script setup lang="ts">
import type { ReportEntry } from '@pixelproof/core/schema';
import { computed, ref } from 'vue';

import { isPending } from '@/entities/report';
import { useReviewStore } from '@/entities/review';
import { useHotkeys } from '@/shared/lib';
import { Badge, Button, Kbd } from '@/shared/ui';

const props = defineProps<{ entry: ReportEntry }>();
const emit = defineEmits<{ decided: [decision: 'approved' | 'rejected'] }>();

const review = useReviewStore();
const decision = computed(() => review.decisions[props.entry.id]);
const announcement = ref('');

function approve() {
  if (!isPending(props.entry)) return;
  review.decide(props.entry.id, 'approved');
  announcement.value = `Approved ${props.entry.name}. It will become the new baseline.`;
  emit('decided', 'approved');
}
function reject() {
  if (!isPending(props.entry)) return;
  review.decide(props.entry.id, 'rejected');
  announcement.value = `Rejected ${props.entry.name}. The baseline stays as it is.`;
  emit('decided', 'rejected');
}
function undo() {
  if (!decision.value) return;
  review.undo(props.entry.id);
  announcement.value = `Decision on ${props.entry.name} cleared.`;
}

useHotkeys({ a: approve, r: reject, u: undo });
</script>

<template>
  <div class="decision">
    <template v-if="isPending(entry)">
      <div class="decision__state">
        <Badge v-if="decision === 'approved'" tone="good" icon="✓">Approved</Badge>
        <Badge v-else-if="decision === 'rejected'" tone="critical" icon="✖">Rejected</Badge>
        <Badge v-else tone="neutral" icon="…">Awaiting review</Badge>
      </div>
      <div class="decision__actions">
        <Button :pressed="decision === 'approved'" @click="approve"> Approve <Kbd keys="A" /> </Button>
        <Button variant="secondary" :pressed="decision === 'rejected'" @click="reject">
          Reject <Kbd keys="R" />
        </Button>
        <Button v-if="decision" variant="ghost" @click="undo">Undo <Kbd keys="U" /></Button>
      </div>
    </template>
    <p v-else class="decision__none">Matches the baseline. Nothing to review.</p>
    <p class="visually-hidden" role="status">{{ announcement }}</p>
  </div>
</template>

<style scoped>
.decision {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}
.decision__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}
.decision__none {
  margin: 0;
  color: var(--color-text-secondary);
}
</style>
