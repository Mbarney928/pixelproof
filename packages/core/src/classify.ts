import type { Severity } from './schema.js';

export interface ClassifyThresholds {
  /** Share of pixels that may differ before a snapshot counts as changed (0 = any pixel). */
  toleranceRatio: number;
  /** At or above this share of changed pixels a change is major. */
  majorRatio: number;
  /** Below this SSIM a change is major. */
  majorSsim: number;
  /** At or above this share of changed pixels a change is at least moderate. */
  moderateRatio: number;
  /** Below this SSIM a change is at least moderate. */
  moderateSsim: number;
}

export const DEFAULT_THRESHOLDS: ClassifyThresholds = {
  toleranceRatio: 0,
  majorRatio: 0.05,
  majorSsim: 0.9,
  moderateRatio: 0.005,
  moderateSsim: 0.985,
};

export interface DiffMeasures {
  diffPixels: number;
  totalPixels: number;
  ssim: number;
  sizeChanged: boolean;
}

/**
 * Decides whether a diff is a real change and how severe it is. Severity combines *extent* (share of
 * pixels) with *structure* (SSIM), so a large but faint shift and a small but stark removal both rank
 * sensibly. A size change is always major: layout moved.
 */
export function classifyDiff(
  m: DiffMeasures,
  thresholds: Partial<ClassifyThresholds> = {},
): { changed: boolean; severity: Severity; ratio: number } {
  const t = { ...DEFAULT_THRESHOLDS, ...thresholds };
  const ratio = m.totalPixels === 0 ? 0 : m.diffPixels / m.totalPixels;
  const changed = m.sizeChanged || (m.diffPixels > 0 && ratio > t.toleranceRatio);
  if (!changed) return { changed: false, severity: 'none', ratio };
  if (m.sizeChanged || ratio >= t.majorRatio || m.ssim < t.majorSsim)
    return { changed, severity: 'major', ratio };
  if (ratio >= t.moderateRatio || m.ssim < t.moderateSsim) return { changed, severity: 'moderate', ratio };
  return { changed, severity: 'minor', ratio };
}
