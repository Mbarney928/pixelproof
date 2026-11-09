import pixelmatch from 'pixelmatch';

import { cloneImage, fillRects, padImage, type Rect, type RgbaImage } from './image.js';

export interface PixelDiffOptions {
  /** Per-pixel color distance tolerance, 0 (exact) to 1 (anything goes). pixelmatch's YIQ metric. */
  threshold: number;
  /** Count anti-aliased edge pixels as differences. Off by default: font smoothing jitter is noise. */
  includeAntiAliasing: boolean;
  /** Regions excluded from comparison (timestamps, avatars, ads), in image pixels. */
  ignore: readonly Rect[];
}

export interface PixelDiffResult {
  width: number;
  height: number;
  /** One byte per pixel: 1 where the images differ. */
  mask: Uint8Array;
  diffPixels: number;
  /** A faded copy of the current image with differing pixels painted red: what reviewers look at. */
  diffImage: RgbaImage;
  sizeChanged: boolean;
}

export const DEFAULT_PIXEL_DIFF: PixelDiffOptions = {
  threshold: 0.1,
  includeAntiAliasing: false,
  ignore: [],
};

// Areas that exist in only one image are filled with an obviously artificial color so they always differ.
const PAD = [255, 0, 255, 255] as const;
const IGNORED = [127, 127, 127, 255] as const;
const DIFF_COLOR: [number, number, number] = [230, 20, 60];

export function diffPixels(
  baseline: RgbaImage,
  current: RgbaImage,
  options: Partial<PixelDiffOptions> = {},
): PixelDiffResult {
  const opts = { ...DEFAULT_PIXEL_DIFF, ...options };
  const width = Math.max(baseline.width, current.width);
  const height = Math.max(baseline.height, current.height);
  const sizeChanged = baseline.width !== current.width || baseline.height !== current.height;

  const a = cloneImage(padImage(baseline, width, height, PAD));
  const b = cloneImage(padImage(current, width, height, PAD));
  if (opts.ignore.length > 0) {
    fillRects(a, opts.ignore, IGNORED);
    fillRects(b, opts.ignore, IGNORED);
  }

  // pixelmatch in mask mode leaves unchanged pixels transparent, so the mask can be read back exactly.
  const maskImage = new Uint8Array(width * height * 4);
  const diffCount = pixelmatch(a.data, b.data, maskImage, width, height, {
    threshold: opts.threshold,
    includeAA: opts.includeAntiAliasing,
    diffMask: true,
    diffColor: DIFF_COLOR,
    aaColor: [255, 200, 0],
  });

  const mask = new Uint8Array(width * height);
  const diffImage = new Uint8Array(width * height * 4);
  for (let p = 0, i = 0; p < mask.length; p++, i += 4) {
    const isDiff =
      maskImage[i + 3] !== 0 &&
      maskImage[i] === DIFF_COLOR[0] &&
      maskImage[i + 1] === DIFF_COLOR[1] &&
      maskImage[i + 2] === DIFF_COLOR[2];
    if (isDiff) {
      mask[p] = 1;
      diffImage[i] = DIFF_COLOR[0];
      diffImage[i + 1] = DIFF_COLOR[1];
      diffImage[i + 2] = DIFF_COLOR[2];
    } else {
      // Grey, faded context so the red differences stand out.
      const r = b.data[i] ?? 0;
      const g = b.data[i + 1] ?? 0;
      const bl = b.data[i + 2] ?? 0;
      const lum = 0.299 * r + 0.587 * g + 0.114 * bl;
      const faded = Math.round(255 - (255 - lum) * 0.25);
      diffImage[i] = faded;
      diffImage[i + 1] = faded;
      diffImage[i + 2] = faded;
    }
    diffImage[i + 3] = 255;
  }

  return {
    width,
    height,
    mask,
    diffPixels: diffCount,
    diffImage: { width, height, data: diffImage },
    sizeChanged,
  };
}
