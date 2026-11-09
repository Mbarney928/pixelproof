<script setup lang="ts">
import { SegmentedControl } from '@/shared/ui';

import { useThemeStore, type ThemeChoice } from '../model/theme';

const theme = useThemeStore();
const options = [
  { value: 'auto', label: 'Auto' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
] as const satisfies readonly { value: ThemeChoice; label: string }[];
</script>

<template>
  <SegmentedControl v-model="theme.choice" label="Color theme" hide-label :options="options" />
</template>
