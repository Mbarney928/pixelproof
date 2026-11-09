import { describe, expect, it } from 'vitest';

import { classifyDiff } from './classify.js';

const base = { totalPixels: 10_000, ssim: 1, sizeChanged: false };

describe('classifyDiff', () => {
  it('is unchanged with no differing pixels', () => {
    expect(classifyDiff({ ...base, diffPixels: 0 })).toEqual({ changed: false, severity: 'none', ratio: 0 });
  });

  it('respects the tolerance ratio', () => {
    expect(classifyDiff({ ...base, diffPixels: 5, ssim: 0.999 }, { toleranceRatio: 0.001 }).changed).toBe(
      false,
    );
    expect(classifyDiff({ ...base, diffPixels: 11, ssim: 0.999 }, { toleranceRatio: 0.001 }).changed).toBe(
      true,
    );
  });

  it('grades severity by extent and by structure', () => {
    expect(classifyDiff({ ...base, diffPixels: 10, ssim: 0.999 }).severity).toBe('minor');
    expect(classifyDiff({ ...base, diffPixels: 60, ssim: 0.999 }).severity).toBe('moderate');
    expect(classifyDiff({ ...base, diffPixels: 10, ssim: 0.97 }).severity).toBe('moderate');
    expect(classifyDiff({ ...base, diffPixels: 600, ssim: 0.99 }).severity).toBe('major');
    expect(classifyDiff({ ...base, diffPixels: 10, ssim: 0.5 }).severity).toBe('major');
  });

  it('always treats a size change as a major change', () => {
    expect(classifyDiff({ ...base, diffPixels: 0, sizeChanged: true })).toMatchObject({
      changed: true,
      severity: 'major',
    });
  });

  it('handles an empty image', () => {
    expect(classifyDiff({ ...base, totalPixels: 0, diffPixels: 0 }).ratio).toBe(0);
  });
});
