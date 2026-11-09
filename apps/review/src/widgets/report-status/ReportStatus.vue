<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue';

import { ReportError } from '@/shared/api';
import { ErrorState, Skeleton } from '@/shared/ui';

const props = defineProps<{ isPending: boolean; error: Error | null }>();
defineEmits<{ retry: [] }>();

// Fast loads never flash a skeleton (which would then shift away).
const showSkeleton = ref(false);
const timer = setTimeout(() => {
  showSkeleton.value = true;
}, 400);
onBeforeUnmount(() => {
  clearTimeout(timer);
});

const retryable = () => !(props.error instanceof ReportError) || props.error.code === 'network';
const title = () =>
  props.error instanceof ReportError && props.error.code === 'not_found'
    ? 'No report yet'
    : 'Could not open the report';
</script>

<template>
  <div v-if="isPending" aria-busy="true">
    <span class="visually-hidden" role="status">Loading report</span>
    <div v-if="showSkeleton" class="status__skeleton">
      <Skeleton width="40%" height="2rem" />
      <Skeleton height="6rem" />
      <Skeleton height="16rem" />
    </div>
  </div>
  <ErrorState
    v-else-if="error"
    :title="title()"
    :message="error.message"
    :retryable="retryable()"
    @retry="$emit('retry')"
  />
</template>

<style scoped>
.status__skeleton {
  display: grid;
  gap: var(--space-4);
}
</style>
