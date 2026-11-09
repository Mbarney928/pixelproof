import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      {
        test: { name: 'core', root: 'packages/core', environment: 'node', include: ['src/**/*.test.ts'] },
      },
      {
        test: {
          name: 'cli',
          root: 'packages/cli',
          environment: 'node',
          include: ['src/**/*.test.ts'],
          testTimeout: 60_000,
          hookTimeout: 120_000,
        },
      },
      'apps/review',
    ],
    coverage: {
      provider: 'v8',
      include: ['packages/*/src/**/*.ts', 'apps/review/src/**/*.{ts,vue}'],
      exclude: [
        '**/*.test.ts',
        '**/*.stories.ts',
        '**/index.ts',
        'packages/cli/src/bin.ts',
        'apps/review/src/main.ts',
        'apps/review/src/test/**',
      ],
      thresholds: { lines: 85, functions: 85, statements: 85, branches: 80 },
    },
  },
});
