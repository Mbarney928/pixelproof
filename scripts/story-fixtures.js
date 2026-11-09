// Draws a small synthetic "settings card" twice (the second with a moved button and a new
// colour) and diffs them with the real engine, so Storybook shows genuine pixelproof output.
// Run after `npm run build`: node scripts/story-fixtures.js
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { compareSnapshot, createImage, encodePng, fillRects } from '@pixelproof/core';

const out = join(dirname(fileURLToPath(import.meta.url)), '../apps/review/.storybook/public/report');
const W = 480;
const H = 300;

function card({ buttonX, buttonColor, badge }) {
  const img = createImage(W, H, [246, 247, 251, 255]);
  fillRects(img, [{ x: 0, y: 0, width: W, height: 44 }], [38, 34, 82, 255]); // header
  fillRects(img, [{ x: 24, y: 72, width: W - 48, height: 196 }], [255, 255, 255, 255]); // card
  fillRects(img, [{ x: 48, y: 96, width: 220, height: 14 }], [40, 40, 52, 255]); // title
  for (let i = 0; i < 4; i++)
    fillRects(img, [{ x: 48, y: 126 + i * 18, width: 360 - i * 40, height: 8 }], [170, 172, 184, 255]);
  fillRects(img, [{ x: buttonX, y: 220, width: 120, height: 32 }], buttonColor);
  if (badge) fillRects(img, [{ x: 360, y: 92, width: 72, height: 22 }], [255, 196, 64, 255]);
  return encodePng(img);
}

const baseline = card({ buttonX: 48, buttonColor: [91, 79, 214, 255], badge: false });
const current = card({ buttonX: 72, buttonColor: [33, 120, 214, 255], badge: true });
const result = compareSnapshot(baseline, current);
if (!result.diffPng || !result.diff) throw new Error('expected a difference');

const files = {
  'baseline/settings-card.png': baseline,
  'current/settings-card.png': current,
  'diff/settings-card.png': result.diffPng,
};
for (const [path, png] of Object.entries(files)) {
  await mkdir(dirname(join(out, path)), { recursive: true });
  await writeFile(join(out, path), png);
}
console.log(`Wrote story fixtures (${result.severity}, ${result.diff.regions.length} regions) to ${out}`);
