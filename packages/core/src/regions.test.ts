import { describe, expect, it } from 'vitest';

import { clusterRegions } from './regions.js';

function maskWith(width: number, height: number, points: [number, number][]): Uint8Array {
  const mask = new Uint8Array(width * height);
  for (const [x, y] of points) mask[y * width + x] = 1;
  return mask;
}

function block(x0: number, y0: number, w: number, h: number): [number, number][] {
  const pts: [number, number][] = [];
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) pts.push([x, y]);
  return pts;
}

describe('clusterRegions', () => {
  it('returns nothing for an empty mask', () => {
    expect(clusterRegions(new Uint8Array(100), 10, 10)).toEqual([]);
  });

  it('keeps distant changes apart and orders them largest first', () => {
    const mask = maskWith(200, 100, [...block(5, 5, 4, 4), ...block(150, 60, 10, 10)]);
    expect(clusterRegions(mask, 200, 100, { mergeDistance: 10 })).toEqual([
      { x: 150, y: 60, width: 10, height: 10, pixels: 100 },
      { x: 5, y: 5, width: 4, height: 4, pixels: 16 },
    ]);
  });

  it('merges nearby fragments (like glyphs of one word) into one region', () => {
    const glyphs = [...block(10, 10, 3, 8), ...block(16, 10, 3, 8), ...block(22, 10, 3, 8)];
    const regions = clusterRegions(maskWith(100, 40, glyphs), 100, 40, { mergeDistance: 8 });
    expect(regions).toEqual([{ x: 10, y: 10, width: 15, height: 8, pixels: 72 }]);
  });

  it('joins diagonal neighbours', () => {
    const regions = clusterRegions(
      maskWith(40, 40, [
        [3, 3],
        [12, 12],
      ]),
      40,
      40,
      { mergeDistance: 8 },
    );
    expect(regions).toHaveLength(1);
    expect(regions[0]).toMatchObject({ x: 3, y: 3, width: 10, height: 10, pixels: 2 });
  });

  it('caps the number of regions by merging the smallest', () => {
    const pts: [number, number][] = [];
    for (let i = 0; i < 6; i++) pts.push(...block(i * 30, 0, 1 + i, 1));
    const regions = clusterRegions(maskWith(200, 5, pts), 200, 5, { mergeDistance: 4, maxRegions: 3 });
    expect(regions).toHaveLength(3);
    expect(regions[0]?.pixels).toBe(6);
    expect(regions[1]?.pixels).toBe(5);
    expect(regions[2]).toMatchObject({ x: 0, pixels: 1 + 2 + 3 + 4 });
  });
});
