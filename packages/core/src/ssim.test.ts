import { describe, expect, it } from 'vitest';

import { ssim } from './ssim.js';
import { BLACK, canvas } from './test-utils.js';

const card = (dx = 0) => canvas(64, 64, [{ x: 10 + dx, y: 10, width: 30, height: 20, color: BLACK }]);

describe('ssim', () => {
  it('is 1 for identical images', () => {
    expect(ssim(card(), card())).toBeCloseTo(1, 10);
  });

  it('drops more for a removed element than for a 1px shift', () => {
    const shifted = ssim(card(), card(1));
    const removed = ssim(card(), canvas(64, 64));
    expect(shifted).toBeLessThan(1);
    expect(removed).toBeLessThan(shifted);
  });

  it('treats transparent pixels as white page background', () => {
    const transparent = canvas(16, 16, [{ x: 0, y: 0, width: 16, height: 16, color: [0, 0, 0, 0] }]);
    expect(ssim(transparent, canvas(16, 16))).toBeCloseTo(1, 10);
  });

  it('handles images smaller than the window', () => {
    expect(ssim(canvas(4, 4), canvas(4, 4))).toBeCloseTo(1, 10);
  });

  it('rejects images of different sizes', () => {
    expect(() => ssim(canvas(8, 8), canvas(8, 9))).toThrow(RangeError);
  });
});
