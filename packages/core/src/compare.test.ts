import { describe, expect, it } from 'vitest';

import { compareSnapshot } from './compare.js';
import { decodePng, encodePng } from './image.js';
import { BLUE, RED, canvas } from './test-utils.js';

const png = (color = BLUE, extra = 0) =>
  encodePng(canvas(120, 80 + extra, [{ x: 10, y: 10, width: 40, height: 20, color }]));

describe('compareSnapshot', () => {
  it('reports new and removed snapshots without diffing', () => {
    expect(compareSnapshot(undefined, png())).toEqual({
      status: 'new',
      severity: 'none',
      width: 120,
      height: 80,
    });
    expect(compareSnapshot(png(), undefined)).toEqual({
      status: 'removed',
      severity: 'none',
      width: 120,
      height: 80,
    });
    expect(() => compareSnapshot(undefined, undefined)).toThrow();
  });

  it('reports identical images as unchanged with no diff image', () => {
    const result = compareSnapshot(png(), png());
    expect(result).toMatchObject({
      status: 'unchanged',
      severity: 'none',
      diff: { pixels: 0, ssim: 1, regions: [] },
    });
    expect(result.diffPng).toBeUndefined();
  });

  it('describes a change with regions, scores and a diff image', () => {
    const result = compareSnapshot(png(), png(RED));
    expect(result.status).toBe('changed');
    expect(result.severity).toBe('major');
    expect(result.diff).toMatchObject({ pixels: 800, sizeChanged: false });
    expect(result.diff?.ratio).toBeCloseTo(800 / 9600);
    expect(result.diff?.ssim).toBeLessThan(1);
    expect(result.diff?.regions).toEqual([{ x: 10, y: 10, width: 40, height: 20, pixels: 800 }]);
    expect(result.diffPng && decodePng(result.diffPng).width).toBe(120);
  });

  it('treats differences under the tolerance as unchanged', () => {
    const result = compareSnapshot(png(), png(RED), { thresholds: { toleranceRatio: 0.1 } });
    expect(result.status).toBe('unchanged');
    expect(result.diff?.pixels).toBe(800);
  });

  it('flags a height change as major', () => {
    const result = compareSnapshot(png(), png(BLUE, 10));
    expect(result).toMatchObject({
      status: 'changed',
      severity: 'major',
      height: 90,
      diff: { sizeChanged: true },
    });
  });
});
