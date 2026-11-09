import type { RgbaImage } from './image.js';

const C1 = (0.01 * 255) ** 2;
const C2 = (0.03 * 255) ** 2;

/** Rec. 601 luma, with alpha composited over white so transparent areas compare as page background. */
function luma(image: RgbaImage): Float64Array {
  const out = new Float64Array(image.width * image.height);
  for (let p = 0, i = 0; p < out.length; p++, i += 4) {
    const a = (image.data[i + 3] ?? 255) / 255;
    const r = (image.data[i] ?? 0) * a + 255 * (1 - a);
    const g = (image.data[i + 1] ?? 0) * a + 255 * (1 - a);
    const b = (image.data[i + 2] ?? 0) * a + 255 * (1 - a);
    out[p] = 0.299 * r + 0.587 * g + 0.114 * b;
  }
  return out;
}

/**
 * Mean structural similarity (SSIM, Wang et al. 2004) over square windows of grayscale pixels.
 *
 * Pixel counts say *how much* changed; SSIM says *how noticeable* it is. A 1px shift of a whole
 * card can flip thousands of pixels yet keep SSIM near 1, while a missing button flips few pixels
 * and drops SSIM sharply in its window. Windows of `window` px move by `step` px; a stride larger
 * than 1 trades a little precision for a large speed-up on full-page screenshots.
 *
 * Both images must have the same size. Returns 1 for identical images.
 */
export function ssim(a: RgbaImage, b: RgbaImage, options: { window?: number; step?: number } = {}): number {
  if (a.width !== b.width || a.height !== b.height) {
    throw new RangeError(`SSIM needs equal sizes, got ${a.width}×${a.height} and ${b.width}×${b.height}`);
  }
  const { width, height } = a;
  const win = Math.max(1, Math.min(options.window ?? 8, width, height));
  const step = Math.max(1, options.step ?? 4);
  const la = luma(a);
  const lb = luma(b);
  const n = win * win;

  let total = 0;
  let count = 0;
  for (let y = 0; y + win <= height; y += step) {
    for (let x = 0; x + win <= width; x += step) {
      let sumA = 0;
      let sumB = 0;
      let sumAA = 0;
      let sumBB = 0;
      let sumAB = 0;
      for (let wy = 0; wy < win; wy++) {
        const row = (y + wy) * width + x;
        for (let wx = 0; wx < win; wx++) {
          const va = la[row + wx] ?? 0;
          const vb = lb[row + wx] ?? 0;
          sumA += va;
          sumB += vb;
          sumAA += va * va;
          sumBB += vb * vb;
          sumAB += va * vb;
        }
      }
      const meanA = sumA / n;
      const meanB = sumB / n;
      const varA = sumAA / n - meanA * meanA;
      const varB = sumBB / n - meanB * meanB;
      const cov = sumAB / n - meanA * meanB;
      total +=
        ((2 * meanA * meanB + C1) * (2 * cov + C2)) / ((meanA ** 2 + meanB ** 2 + C1) * (varA + varB + C2));
      count++;
    }
  }
  return count === 0 ? 1 : total / count;
}
