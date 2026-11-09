import { classifyDiff, type ClassifyThresholds } from './classify.js';
import { diffPixels, type PixelDiffOptions } from './diff.js';
import { decodePng, encodePng, padImage } from './image.js';
import { clusterRegions } from './regions.js';
import type { ReportEntry, Severity, SnapshotStatus } from './schema.js';
import { ssim } from './ssim.js';

export interface CompareOptions extends Partial<PixelDiffOptions> {
  thresholds?: Partial<ClassifyThresholds>;
  /** Distance in px within which differing pixels join the same region. */
  mergeDistance?: number;
}

export interface CompareResult {
  status: SnapshotStatus;
  severity: Severity;
  width: number;
  height: number;
  diff?: NonNullable<ReportEntry['diff']>;
  /** PNG of the highlighted differences, present only when the snapshot changed. */
  diffPng?: Buffer;
}

/** Compares one baseline/current pair of PNG files. Either side may be missing (new or removed). */
export function compareSnapshot(
  baselinePng: Uint8Array | undefined,
  currentPng: Uint8Array | undefined,
  options: CompareOptions = {},
): CompareResult {
  if (!baselinePng) {
    if (!currentPng) throw new Error('compareSnapshot needs at least one image');
    const current = decodePng(currentPng);
    return { status: 'new', severity: 'none', width: current.width, height: current.height };
  }
  if (!currentPng) {
    const baseline = decodePng(baselinePng);
    return { status: 'removed', severity: 'none', width: baseline.width, height: baseline.height };
  }

  const baseline = decodePng(baselinePng);
  const current = decodePng(currentPng);
  const pixel = diffPixels(baseline, current, options);
  const { width, height } = pixel;
  const white = [255, 255, 255, 255] as const;
  const score =
    pixel.diffPixels === 0
      ? 1
      : ssim(padImage(baseline, width, height, white), padImage(current, width, height, white));
  const verdict = classifyDiff(
    {
      diffPixels: pixel.diffPixels,
      totalPixels: width * height,
      ssim: score,
      sizeChanged: pixel.sizeChanged,
    },
    options.thresholds,
  );

  const regions = verdict.changed
    ? clusterRegions(pixel.mask, width, height, { mergeDistance: options.mergeDistance ?? 12 })
    : [];
  const diff = {
    pixels: pixel.diffPixels,
    ratio: Math.min(1, verdict.ratio),
    ssim: Math.max(-1, Math.min(1, score)),
    sizeChanged: pixel.sizeChanged,
    regions,
  };
  if (!verdict.changed) return { status: 'unchanged', severity: 'none', width, height, diff };
  return {
    status: 'changed',
    severity: verdict.severity,
    width,
    height,
    diff,
    diffPng: encodePng(pixel.diffImage),
  };
}
