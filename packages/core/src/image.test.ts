import { describe, expect, it } from 'vitest';

import { createImage, decodePng, encodePng, fillRects, padImage } from './image.js';
import { BLUE, canvas } from './test-utils.js';

describe('image helpers', () => {
  it('round-trips through PNG', () => {
    const img = canvas(6, 4, [{ x: 1, y: 1, width: 2, height: 2, color: BLUE }]);
    const back = decodePng(encodePng(img));
    expect(back.width).toBe(6);
    expect(back.height).toBe(4);
    expect([...back.data]).toEqual([...img.data]);
  });

  it('pads a smaller image with the fill color and keeps the original pixels', () => {
    const img = canvas(2, 2, [{ x: 0, y: 0, width: 2, height: 2, color: BLUE }]);
    const padded = padImage(img, 3, 3, [255, 0, 255, 255]);
    expect([...padded.data.slice(0, 4)]).toEqual([...BLUE]);
    expect([...padded.data.slice(8, 12)]).toEqual([255, 0, 255, 255]);
    expect([...padded.data.slice(-4)]).toEqual([255, 0, 255, 255]);
    expect(padImage(img, 2, 2, [0, 0, 0, 0])).toBe(img);
  });

  it('fills rectangles clipped to the image bounds', () => {
    const img = createImage(4, 4, [255, 255, 255, 255]);
    fillRects(img, [{ x: 2.5, y: -3, width: 10, height: 4 }], [0, 0, 0, 255]);
    const painted = [];
    for (let p = 0; p < 16; p++) if (img.data[p * 4] === 0) painted.push(p);
    // Columns 2-3 of row 0 (x from floor(2.5)=2, y clipped to 0..1).
    expect(painted).toEqual([2, 3]);
  });
});
