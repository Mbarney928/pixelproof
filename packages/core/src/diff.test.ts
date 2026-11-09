import { describe, expect, it } from 'vitest';

import { diffPixels } from './diff.js';
import { BLACK, BLUE, RED, canvas } from './test-utils.js';

describe('diffPixels', () => {
  it('finds nothing in identical images', () => {
    const img = canvas(20, 20, [{ x: 2, y: 2, width: 5, height: 5, color: BLUE }]);
    const result = diffPixels(img, canvas(20, 20, [{ x: 2, y: 2, width: 5, height: 5, color: BLUE }]));
    expect(result.diffPixels).toBe(0);
    expect(result.mask.every((v) => v === 0)).toBe(true);
    expect(result.sizeChanged).toBe(false);
  });

  it('marks exactly the pixels of a recolored block', () => {
    const before = canvas(20, 20, [{ x: 5, y: 5, width: 4, height: 3, color: BLUE }]);
    const after = canvas(20, 20, [{ x: 5, y: 5, width: 4, height: 3, color: RED }]);
    const result = diffPixels(before, after);
    expect(result.diffPixels).toBe(12);
    expect(result.mask.reduce((s, v) => s + v, 0)).toBe(12);
    expect(result.mask[5 * 20 + 5]).toBe(1);
    expect(result.mask[0]).toBe(0);
    // Differences are painted red in the reviewer image; context is faded.
    const i = (5 * 20 + 5) * 4;
    expect([...result.diffImage.data.slice(i, i + 3)]).toEqual([230, 20, 60]);
    expect(result.diffImage.data[0]).toBe(255);
  });

  it('ignores small color jitter under the threshold but not with threshold 0', () => {
    const before = canvas(10, 10, [{ x: 0, y: 0, width: 10, height: 10, color: [100, 100, 100, 255] }]);
    const after = canvas(10, 10, [{ x: 0, y: 0, width: 10, height: 10, color: [103, 101, 100, 255] }]);
    expect(diffPixels(before, after, { threshold: 0.1 }).diffPixels).toBe(0);
    expect(diffPixels(before, after, { threshold: 0 }).diffPixels).toBe(100);
  });

  it('skips ignored regions', () => {
    const before = canvas(30, 10, [{ x: 0, y: 0, width: 5, height: 5, color: BLACK }]);
    const after = canvas(30, 10, [{ x: 20, y: 0, width: 5, height: 5, color: BLACK }]);
    expect(diffPixels(before, after).diffPixels).toBe(50);
    expect(diffPixels(before, after, { ignore: [{ x: 18, y: 0, width: 12, height: 10 }] }).diffPixels).toBe(
      25,
    );
  });

  it('pads mismatched sizes so the extra area counts as changed', () => {
    const result = diffPixels(canvas(10, 10), canvas(10, 12));
    expect(result.sizeChanged).toBe(true);
    expect(result.width).toBe(10);
    expect(result.height).toBe(12);
    expect(result.diffPixels).toBe(20);
  });
});
