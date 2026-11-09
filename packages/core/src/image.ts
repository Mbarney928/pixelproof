import { PNG } from 'pngjs';

/** An RGBA image held in memory: 4 bytes per pixel, row-major. */
export interface RgbaImage {
  width: number;
  height: number;
  data: Uint8Array;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function createImage(
  width: number,
  height: number,
  rgba: readonly [number, number, number, number] = [0, 0, 0, 0],
): RgbaImage {
  const data = new Uint8Array(width * height * 4);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = rgba[0];
    data[i + 1] = rgba[1];
    data[i + 2] = rgba[2];
    data[i + 3] = rgba[3];
  }
  return { width, height, data };
}

export function decodePng(buffer: Uint8Array): RgbaImage {
  const png = PNG.sync.read(Buffer.from(buffer));
  return {
    width: png.width,
    height: png.height,
    data: new Uint8Array(png.data.buffer, png.data.byteOffset, png.data.length),
  };
}

export function encodePng(image: RgbaImage): Buffer {
  const png = new PNG({ width: image.width, height: image.height });
  png.data = Buffer.from(image.data.buffer, image.data.byteOffset, image.data.length);
  return PNG.sync.write(png);
}

/**
 * Copies `image` onto a canvas of `width × height`. Uncovered area is filled with `fill`, so that a
 * size change shows up as differing pixels instead of crashing the comparison.
 */
export function padImage(
  image: RgbaImage,
  width: number,
  height: number,
  fill: readonly [number, number, number, number],
): RgbaImage {
  if (image.width === width && image.height === height) return image;
  const out = createImage(width, height, fill);
  const rowBytes = Math.min(image.width, width) * 4;
  for (let y = 0; y < Math.min(image.height, height); y++) {
    const from = y * image.width * 4;
    out.data.set(image.data.subarray(from, from + rowBytes), y * width * 4);
  }
  return out;
}

/** Paints `rects` (clipped to the image) with a solid color, in place. Used to blank ignored regions. */
export function fillRects(
  image: RgbaImage,
  rects: readonly Rect[],
  rgba: readonly [number, number, number, number],
): void {
  for (const r of rects) {
    const x0 = Math.max(0, Math.floor(r.x));
    const y0 = Math.max(0, Math.floor(r.y));
    const x1 = Math.min(image.width, Math.ceil(r.x + r.width));
    const y1 = Math.min(image.height, Math.ceil(r.y + r.height));
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        const i = (y * image.width + x) * 4;
        image.data[i] = rgba[0];
        image.data[i + 1] = rgba[1];
        image.data[i + 2] = rgba[2];
        image.data[i + 3] = rgba[3];
      }
    }
  }
}

export function cloneImage(image: RgbaImage): RgbaImage {
  return { width: image.width, height: image.height, data: new Uint8Array(image.data) };
}
