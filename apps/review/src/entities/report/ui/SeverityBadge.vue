<script setup lang="ts">
import type { Severity } from '@pixelproof/core/schema';

import { Badge } from '@/shared/ui';

import { SEVERITY_META } from '../model/meta';

defineProps<{ severity: Severity }>();
</script>

<template>
  <Badge v-if="severity !== 'none'" :tone="SEVERITY_META[severity].tone" :icon="SEVERITY_META[severity].icon">
    {{ SEVERITY_META[severity].label }}
  </Badge>
  <span v-else class="none">—<span class="visually-hidden">no severity</span></span>
</template>

<style scoped>
.none {
  color: var(--color-text-secondary);
}
</style>
