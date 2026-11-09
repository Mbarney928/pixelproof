import { fileURLToPath, URL } from 'node:url';

import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vitest/config';

const src = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  // A relative base lets the built app run from any folder: GitHub Pages, a CI artifact, or next to a report.
  base: process.env.BASE_PATH ?? './',
  plugins: [vue()],
  resolve: {
    alias: {
      '@': src('./src'),
      // Use the shared report contract straight from source (browser-safe: zod only).
      '@pixelproof/core/schema': src('../../packages/core/src/schema.ts'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (/node_modules\/(@vue|vue|vue-router|pinia|@tanstack)\//.test(id)) return 'vue';
          if (id.includes('node_modules/zod/')) return 'zod';
          return undefined;
        },
      },
    },
  },
  test: {
    name: 'review',
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
    setupFiles: ['src/test/setup.ts'],
  },
});
