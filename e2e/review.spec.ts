import { readFile } from 'node:fs/promises';

import { expect, type Page, test } from '@playwright/test';

const heading = (page: Page, name: string | RegExp) => page.getByRole('heading', { level: 1, name });

test('reviews a real run with the keyboard and exports approvals for the CLI', async ({ page }) => {
  await page.goto('./');
  await expect(heading(page, 'Visual review')).toBeVisible();
  await expect(page.getByText('0 of 19 reviewed')).toBeVisible();

  // Narrow to light-mode desktop shots; the filter lives in the URL.
  await page.getByRole('combobox', { name: 'Theme' }).selectOption('light');
  await page.getByRole('combobox', { name: 'Viewport' }).selectOption('desktop');
  await expect(page).toHaveURL(/theme=light/);
  await expect(page).toHaveURL(/viewport=desktop/);

  const table = page.getByRole('region', { name: 'Snapshot table' });
  await table.getByRole('link', { name: /Shop/ }).click();
  await expect(heading(page, 'Shop')).toBeVisible();

  // The diff image is real engine output and actually loads.
  const diff = page.getByRole('img', { name: /Difference/ });
  await expect(diff).toBeVisible();
  expect(await diff.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBe(1280);

  await page.keyboard.press('a');
  await expect(heading(page, 'Checkout')).toBeVisible();
  await page.keyboard.press('r');
  await page.keyboard.press('Escape');

  await expect(heading(page, 'Visual review')).toBeVisible();
  await expect(page).toHaveURL(/theme=light/);
  await expect(page.getByText('2 of 19 reviewed')).toBeVisible();

  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export approvals (1)' }).click();
  const file = await download;
  expect(file.suggestedFilename()).toBe('approvals.json');
  const approvals = JSON.parse(await readFile(await file.path(), 'utf8')) as Record<string, unknown>;
  expect(approvals.approved).toEqual(['lumen-supply-shop--desktop--light']);
  expect(approvals.rejected).toEqual(['lumen-supply-checkout--desktop--light']);

  // Decisions survive a reload.
  await page.reload();
  await expect(page.getByText('2 of 19 reviewed')).toBeVisible();
});

test('compares baseline and current in every view', async ({ page }) => {
  await page.goto('./#/snapshot/lumen-supply-plans--desktop--light');
  await expect(heading(page, 'Plans')).toBeVisible();
  await page.getByRole('radio', { name: /Side by side/ }).check({ force: true });
  await expect(page.getByRole('img', { name: /Baseline/ })).toBeVisible();
  await page.keyboard.press('3');
  const divider = page.getByRole('slider', { name: /Divider position/ });
  await divider.fill('20');
  await expect(page.getByText('20%')).toBeVisible();
  await page.keyboard.press('4');
  await expect(page.getByRole('slider', { name: /Current opacity/ })).toBeVisible();
  await page.keyboard.press('1');
  await page.getByRole('navigation', { name: 'Changed regions' }).getByRole('button').first().click();
  await expect(page.locator('.viewer__region--active')).toBeVisible();
});

test('remembers the chosen theme', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('radio', { name: 'Dark' }).check({ force: true });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('the skip link moves focus to the main content', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Keyboard navigation is a desktop concern');
  await page.goto('./');
  await expect(heading(page, 'Visual review')).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main')).toBeFocused();
});

test('fits small screens without sideways scrolling', async ({ page }) => {
  for (const path of ['./', './#/snapshot/lumen-supply-shop--mobile--dark']) {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  }
});

test('refuses a report from another origin', async ({ page }) => {
  await page.goto('./?report=https%3A%2F%2Fexample.com%2Freport.json');
  await expect(page.getByRole('alert')).toBeVisible();
});
