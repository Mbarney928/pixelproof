import { defineConfig, devices } from '@playwright/test';

const ci = Boolean(process.env.CI);

// Prerequisites: `npm run demo` (real report), `npm run build`, `npm run build-storybook`.
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: ci,
  retries: ci ? 1 : 0,
  reporter: ci ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: { baseURL: 'http://127.0.0.1:4173', trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] }, testIgnore: /storybook/ },
    { name: 'mobile', use: { ...devices['Pixel 7'] }, testIgnore: /storybook/ },
    {
      name: 'storybook',
      use: { ...devices['Desktop Chrome'], baseURL: 'http://127.0.0.1:6007' },
      testMatch: /storybook/,
    },
  ],
  webServer: [
    {
      command: 'npx vite preview --host 127.0.0.1 --port 4173 --strictPort',
      cwd: 'apps/review',
      url: 'http://127.0.0.1:4173',
      reuseExistingServer: !ci,
    },
    {
      command: 'npx vite preview --outDir storybook-static --host 127.0.0.1 --port 6007 --strictPort',
      cwd: 'apps/review',
      url: 'http://127.0.0.1:6007',
      reuseExistingServer: !ci,
    },
  ],
});
