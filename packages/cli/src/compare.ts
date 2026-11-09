import { randomUUID } from 'node:crypto';
import { copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { compareSnapshot, decodePng, encodePng, thumbnail } from '@pixelproof/core';
import { REPORT_VERSION, ReportSchema, type Report, type ReportEntry } from '@pixelproof/core/schema';

import type { Config } from './config.js';
import { UserError } from './errors.js';
import type { Logger } from './logger.js';
import { readManifest, type ManifestEntry } from './manifest.js';
import { VERSION } from './version.js';

/** Preview size: the 72×48 list thumbnail at 2× for sharp displays. */
const THUMB = { width: 144, height: 96 };

export const paths = (config: Config) => ({
  baseline: join(config.dir, 'baseline'),
  current: join(config.dir, 'current'),
  report: join(config.dir, 'report'),
});

const STATUS_ORDER = { changed: 0, new: 1, removed: 2, unchanged: 3 } as const;
const SEVERITY_ORDER = { major: 0, moderate: 1, minor: 2, none: 3 } as const;

async function readIfExists(path: string): Promise<Buffer | undefined> {
  try {
    return await readFile(path);
  } catch {
    return undefined;
  }
}

/**
 * Compares the latest capture with the approved baseline and writes a self-contained report folder
 * (`report.json` plus baseline/current/diff images) that the review app can open.
 */
export async function compareRun(
  config: Config,
  options: { logger: Logger; now?: () => Date; runId?: string },
): Promise<Report> {
  const { logger } = options;
  const p = paths(config);
  const current = await readManifest(join(p.current, 'manifest.json'));
  if (!current) throw new UserError(`No capture found in ${p.current}. Run \`pixelproof capture\` first.`);
  const baseline = await readManifest(join(p.baseline, 'manifest.json'));
  if (!baseline) logger.warn('No baseline yet: every snapshot will be reported as new', { dir: p.baseline });

  await rm(p.report, { recursive: true, force: true });
  for (const sub of ['baseline', 'current', 'diff', 'thumb'])
    await mkdir(join(p.report, sub), { recursive: true });

  const baselineById = new Map((baseline?.entries ?? []).map((e) => [e.id, e]));
  const currentIds = new Set(current.entries.map((e) => e.id));
  const all: ManifestEntry[] = [
    ...current.entries,
    ...(baseline?.entries ?? []).filter((e) => !currentIds.has(e.id)),
  ];

  const entries: ReportEntry[] = [];
  for (const meta of all) {
    const basePng = baselineById.has(meta.id)
      ? await readIfExists(join(p.baseline, `${meta.id}.png`))
      : undefined;
    const curPng = currentIds.has(meta.id)
      ? await readIfExists(join(p.current, `${meta.id}.png`))
      : undefined;
    if (!basePng && !curPng) {
      logger.warn('Snapshot image missing on both sides; skipped', { id: meta.id });
      continue;
    }
    const result = compareSnapshot(basePng, curPng, {
      threshold: config.threshold,
      includeAntiAliasing: config.includeAntiAliasing,
      mergeDistance: config.mergeDistance,
      thresholds: { toleranceRatio: config.toleranceRatio },
    });
    const images: ReportEntry['images'] = {};
    if (basePng) {
      await copyFile(join(p.baseline, `${meta.id}.png`), join(p.report, 'baseline', `${meta.id}.png`));
      images.baseline = `baseline/${meta.id}.png`;
    }
    if (curPng) {
      await copyFile(join(p.current, `${meta.id}.png`), join(p.report, 'current', `${meta.id}.png`));
      images.current = `current/${meta.id}.png`;
    }
    if (result.diffPng) {
      await writeFile(join(p.report, 'diff', `${meta.id}.png`), result.diffPng);
      images.diff = `diff/${meta.id}.png`;
    }
    // Lists show a small preview instead of downloading every full-size screenshot.
    const preview = curPng ?? basePng;
    if (preview) {
      await writeFile(
        join(p.report, 'thumb', `${meta.id}.png`),
        encodePng(thumbnail(decodePng(preview), THUMB.width, THUMB.height)),
      );
      images.thumb = `thumb/${meta.id}.png`;
    }
    entries.push({
      id: meta.id,
      name: meta.name,
      group: meta.group,
      viewport: meta.viewport,
      theme: meta.theme,
      url: meta.url,
      status: result.status,
      severity: result.severity,
      width: result.width,
      height: result.height,
      ...(result.diff ? { diff: result.diff } : {}),
      images,
    });
  }

  entries.sort(
    (a, b) =>
      STATUS_ORDER[a.status] - STATUS_ORDER[b.status] ||
      SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] ||
      a.id.localeCompare(b.id),
  );
  const count = (s: ReportEntry['status']) => entries.filter((e) => e.status === s).length;
  const report: Report = ReportSchema.parse({
    version: REPORT_VERSION,
    runId: options.runId ?? randomUUID(),
    createdAt: (options.now ?? (() => new Date()))().toISOString(),
    tool: { name: 'pixelproof', version: VERSION },
    settings: {
      threshold: config.threshold,
      includeAntiAliasing: config.includeAntiAliasing,
      toleranceRatio: config.toleranceRatio,
    },
    summary: {
      total: entries.length,
      changed: count('changed'),
      new: count('new'),
      removed: count('removed'),
      unchanged: count('unchanged'),
    },
    entries,
  });
  await writeFile(join(p.report, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
  logger.info('Compared snapshots', { ...report.summary, report: join(p.report, 'report.json') });
  return report;
}

/** Exit code for CI: 0 when the run passes the `failOn` policy, 1 when it has changes to review. */
export function exitCodeFor(report: Report, failOn: Config['failOn']): 0 | 1 {
  if (failOn === 'never') return 0;
  if (failOn === 'major')
    return report.entries.some((e) => e.severity === 'major' || e.status === 'removed') ? 1 : 0;
  return report.summary.changed + report.summary.new + report.summary.removed > 0 ? 1 : 0;
}
