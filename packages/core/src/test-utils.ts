import { createImage, type Rect, type RgbaImage } from './image.js';

type Rgba = readonly [number, number, number, number];

/** A white canvas with solid rectangles drawn on it: enough to build any diff scenario by hand. */
export function canvas(
  width: number,
  height: number,
  shapes: readonly (Rect & { color: Rgba })[] = [],
): RgbaImage {
  const img = createImage(width, height, [255, 255, 255, 255]);
  for (const s of shapes) {
    for (let y = s.y; y < s.y + s.height; y++) {
      for (let x = s.x; x < s.x + s.width; x++) {
        const i = (y * width + x) * 4;
        img.data.set(s.color, i);
      }
    }
  }
  return img;
}

export const BLACK: Rgba = [0, 0, 0, 255];
export const BLUE: Rgba = [42, 120, 214, 255];
export const RED: Rgba = [214, 40, 40, 255];
