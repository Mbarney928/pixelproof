import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';

export const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

/** Runs axe, retrying while another axe pass (Storybook's a11y addon) is still running. */
export async function expectAccessible(page: Page, configure: (b: AxeBuilder) => AxeBuilder = (b) => b) {
  const builder = configure(new AxeBuilder({ page }).withTags(WCAG));
  for (let attempt = 0; ; attempt++) {
    try {
      const results = await builder.analyze();
      expect(
        results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`),
      ).toEqual([]);
      return;
    } catch (error) {
      if (attempt >= 10 || !String(error).includes('Axe is already running')) throw error;
      await page.waitForTimeout(250);
    }
  }
}
