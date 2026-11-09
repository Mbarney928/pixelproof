import { readFileSync } from 'node:fs';

import type AxeBuilder from '@axe-core/playwright';
import { test } from '@playwright/test';

import { expectAccessible } from './axe.js';

interface StoryIndex {
  entries: Record<string, { id: string; type: string; title: string; name: string }>;
}

const index = JSON.parse(readFileSync('apps/review/storybook-static/index.json', 'utf8')) as StoryIndex;
const stories = Object.values(index.entries).filter((e) => e.type === 'story');

for (const story of stories) {
  for (const theme of ['light', 'dark'] as const) {
    test(`${story.title} / ${story.name} (${theme}) passes axe`, async ({ page }) => {
      await page.goto(`/iframe.html?id=${story.id}&viewMode=story&globals=theme:${theme}`);
      await page.locator('#storybook-root').waitFor();
      await page.waitForLoadState('networkidle');
      // A single isolated component is not a full page.
      await expectAccessible(page, (b: AxeBuilder) =>
        b.include('#storybook-root').disableRules(['region', 'landmark-one-main', 'page-has-heading-one']),
      );
    });
  }
}
