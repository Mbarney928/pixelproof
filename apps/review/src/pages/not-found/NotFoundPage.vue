<script setup lang="ts">
import { RouterLink } from 'vue-router';

import { EmptyState } from '@/shared/ui';
</script>

<template>
  <div>
    <h1 class="nf">Page not found</h1>
    <EmptyState title="There is nothing at this address" description="The link may be from an older report.">
      <RouterLink to="/">Go to the run overview</RouterLink>
    </EmptyState>
  </div>
</template>

<style scoped>
.nf {
  font-size: var(--text-xl);
  margin-bottom: var(--space-4);
}
</style>
