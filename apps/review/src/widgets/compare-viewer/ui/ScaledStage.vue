<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

/**
 * A `width × height` px canvas scaled down to fit its container (or shown at 100%). Screenshots are
 * captured at 1 image px per CSS px, so everything inside can be positioned in image pixels.
 */
const props = defineProps<{ width: number; height: number; actualSize: boolean }>();
const host = ref<HTMLElement | null>(null);
const available = ref(props.width);
let observer: ResizeObserver | undefined;

onMounted(() => {
  if (!host.value) return;
  available.value = host.value.clientWidth || props.width;
  if (typeof ResizeObserver === 'undefined') return;
  observer = new ResizeObserver(([entry]) => {
    if (entry) available.value = entry.contentRect.width;
  });
  observer.observe(host.value);
});
onBeforeUnmount(() => observer?.disconnect());

const scale = computed(() => (props.actualSize ? 1 : Math.min(1, available.value / props.width)));
defineExpose({ scale });
</script>

<template>
  <div ref="host" class="host">
    <div class="frame" :style="{ width: `${width * scale}px`, height: `${height * scale}px` }">
      <div
        class="stage"
        :style="{ width: `${width}px`, height: `${height}px`, transform: `scale(${scale})` }"
      >
        <slot :scale="scale" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.host {
  width: 100%;
  min-width: 0;
}
.frame {
  position: relative;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: repeating-conic-gradient(var(--checker-a) 0 25%, var(--checker-b) 0 50%) 0 0 / 16px 16px;
}
.stage {
  position: absolute;
  top: 0;
  left: 0;
  transform-origin: 0 0;
}
.stage :deep(img) {
  position: absolute;
  top: 0;
  left: 0;
  max-width: none;
  user-select: none;
}
</style>
