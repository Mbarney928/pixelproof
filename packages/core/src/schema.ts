/**
 * The report contract between the CLI (writer) and the review app (reader). Browser-safe: zod only.
 * Exposed as `@pixelproof/core/schema` so the UI never bundles the Node image code.
 */
import { z } from 'zod';

export const REPORT_VERSION = 1;

export const SNAPSHOT_STATUSES = ['changed', 'new', 'removed', 'unchanged'] as const;
export const SEVERITIES = ['major', 'moderate', 'minor', 'none'] as const;
export const THEMES = ['light', 'dark'] as const;

export const SnapshotStatusSchema = z.enum(SNAPSHOT_STATUSES);
export const SeveritySchema = z.enum(SEVERITIES);
export const ThemeSchema = z.enum(THEMES);

/** Filesystem- and URL-safe identifier: lowercase letters and digits joined by `-` or `--`. */
export const SnapshotIdSchema = z
  .string()
  .min(1)
  .max(200)
  .regex(/^[a-z0-9]+(?:--?[a-z0-9]+)*$/, 'Use lowercase letters, digits and dashes');

export const ViewportSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(40)
    .regex(/^[a-z0-9-]+$/, 'Use lowercase letters, digits and dashes'),
  width: z.number().int().min(200).max(3840),
  height: z.number().int().min(200).max(4320),
});

export const RegionSchema = z.object({
  x: z.number().int().nonnegative(),
  y: z.number().int().nonnegative(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  pixels: z.number().int().positive(),
});

/** Relative paths (inside the report folder) to the images for one snapshot. */
const ImagePath = z
  .string()
  .regex(/^(baseline|current|diff|thumb)\/[a-z0-9-]+\.png$/, 'Image paths stay inside the report folder');

export const ReportEntrySchema = z.object({
  id: SnapshotIdSchema,
  name: z.string().min(1).max(200),
  group: z.string().min(1).max(200),
  viewport: ViewportSchema,
  theme: ThemeSchema,
  url: z.string().max(2000),
  status: SnapshotStatusSchema,
  severity: SeveritySchema,
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  diff: z
    .object({
      pixels: z.number().int().nonnegative(),
      ratio: z.number().min(0).max(1),
      ssim: z.number().min(-1).max(1),
      sizeChanged: z.boolean(),
      regions: z.array(RegionSchema),
    })
    .optional(),
  images: z.object({
    baseline: ImagePath.optional(),
    current: ImagePath.optional(),
    diff: ImagePath.optional(),
    /** Small preview of the top of the page, for lists. */
    thumb: ImagePath.optional(),
  }),
});

export const ReportSchema = z.object({
  version: z.literal(REPORT_VERSION),
  runId: z.string().min(1).max(100),
  createdAt: z.iso.datetime(),
  tool: z.object({ name: z.literal('pixelproof'), version: z.string() }),
  settings: z.object({
    threshold: z.number().min(0).max(1),
    includeAntiAliasing: z.boolean(),
    toleranceRatio: z.number().min(0).max(1),
  }),
  summary: z.object({
    total: z.number().int().nonnegative(),
    changed: z.number().int().nonnegative(),
    new: z.number().int().nonnegative(),
    removed: z.number().int().nonnegative(),
    unchanged: z.number().int().nonnegative(),
  }),
  entries: z.array(ReportEntrySchema),
});

/** What a reviewer decided, exported by the review app and applied by `pixelproof approve`. */
export const ApprovalsSchema = z.object({
  version: z.literal(REPORT_VERSION),
  runId: z.string().min(1).max(100),
  approved: z.array(SnapshotIdSchema),
  rejected: z.array(SnapshotIdSchema),
});

export type SnapshotStatus = z.infer<typeof SnapshotStatusSchema>;
export type Severity = z.infer<typeof SeveritySchema>;
export type Theme = z.infer<typeof ThemeSchema>;
export type Viewport = z.infer<typeof ViewportSchema>;
export type Region = z.infer<typeof RegionSchema>;
export type ReportEntry = z.infer<typeof ReportEntrySchema>;
export type Report = z.infer<typeof ReportSchema>;
export type Approvals = z.infer<typeof ApprovalsSchema>;

/** Builds a stable snapshot id such as `buttons-primary--mobile--dark`. */
export function snapshotId(group: string, name: string, viewport: string, theme: Theme): string {
  const slug = (s: string) =>
    s
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/ß/g, 'ss')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  return [slug(`${group} ${name}`) || 'snapshot', slug(viewport), theme].join('--').replace(/-{3,}/g, '--');
}
