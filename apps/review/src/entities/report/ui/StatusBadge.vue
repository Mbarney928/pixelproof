<script setup lang="ts">
import type { SnapshotStatus } from '@pixelproof/core/schema';

import { Badge } from '@/shared/ui';

import { STATUS_META } from '../model/meta';

defineProps<{ status: SnapshotStatus }>();
</script>

<template>
  <Badge :tone="STATUS_META[status].tone" :icon="STATUS_META[status].icon">{{
    STATUS_META[status].label
  }}</Badge>
</template>
