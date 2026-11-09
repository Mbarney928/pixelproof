import axe from 'axe-core';
import { expect } from 'vitest';

/** Runs axe on a rendered tree. Colour contrast needs real layout, so it is checked in Playwright instead. */
export async function expectNoAxeViolations(root: Element): Promise<void> {
  const results = await axe.run(root, {
    rules: { 'color-contrast': { enabled: false }, region: { enabled: false } },
  });
  expect(
    results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`),
  ).toEqual([]);
}
