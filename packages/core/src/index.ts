export { classifyDiff, DEFAULT_THRESHOLDS, type ClassifyThresholds, type DiffMeasures } from './classify.js';
export { compareSnapshot, type CompareOptions, type CompareResult } from './compare.js';
export { DEFAULT_PIXEL_DIFF, diffPixels, type PixelDiffOptions, type PixelDiffResult } from './diff.js';
export {
  cloneImage,
  createImage,
  decodePng,
  encodePng,
  fillRects,
  padImage,
  type Rect,
  type RgbaImage,
} from './image.js';
export { clusterRegions, type DiffRegion } from './regions.js';
export * from './schema.js';
export { ssim } from './ssim.js';
