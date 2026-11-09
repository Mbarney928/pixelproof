<script setup lang="ts">
import { RouterView } from 'vue-router';

import { AppShell } from '@/widgets/app-shell';
</script>

<template>
  <AppShell>
    <RouterView />
  </AppShell>
</template>
