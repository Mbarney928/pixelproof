import { expect, test } from '@playwright/test';

import { expectAccessible } from './axe.js';

const pages = [
  { path: './', heading: 'Visual review' },
  { path: './#/?status=all', heading: 'Visual review' },
  { path: './#/snapshot/lumen-supply-shop--desktop--light', heading: 'Shop' },
  { path: './#/snapshot/lumen-supply-about--mobile--dark', heading: 'About' },
  { path: './#/snapshot/lumen-supply-gift-cards--desktop--light', heading: 'Gift cards' },
  { path: './#/missing', heading: /not found/i },
];

for (const theme of ['light', 'dark'] as const) {
  for (const { path, heading } of pages) {
    test(`${path} has no WCAG 2.2 AA violations in ${theme} mode`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme });
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
      await expectAccessible(page);
    });
  }
}

test('the chart table view and slider view are accessible', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Show table' }).click();
  await expectAccessible(page);
  await page.goto('./#/snapshot/lumen-supply-shop--desktop--light');
  await expect(page.getByRole('heading', { level: 1, name: 'Shop' })).toBeVisible();
  await page.keyboard.press('3');
  await expectAccessible(page);
});
