import { copyFile, mkdir, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';

import { ApprovalsSchema, ReportSchema, type Report } from '@pixelproof/core/schema';

import { paths } from './compare.js';
import type { Config } from './config.js';
import { UserError } from './errors.js';
import type { Logger } from './logger.js';
import { readManifest, writeManifest, type ManifestEntry } from './manifest.js';

export interface ApproveRequest {
  all?: boolean;
  ids?: readonly string[];
  /** An approvals.json exported by the review app. */
  from?: string;
}

async function readJson(path: string, what: string): Promise<unknown> {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch {
    throw new UserError(`Could not read ${what} at ${path}`);
  }
}

/**
 * Promotes reviewed snapshots to the baseline: changed and new images replace or join it, and
 * approved removals drop out of it. Only ids present in the current report can be approved.
 */
export async function approve(
  config: Config,
  request: ApproveRequest,
  options: { logger: Logger; now?: () => Date },
): Promise<{ approved: string[] }> {
  const p = paths(config);
  const parsed = ReportSchema.safeParse(await readJson(join(p.report, 'report.json'), 'the report'));
  if (!parsed.success) throw new UserError('The report is invalid; run `pixelproof compare` again.');
  const report: Report = parsed.data;
  const pending = report.entries.filter((e) => e.status !== 'unchanged');
  const byId = new Map(report.entries.map((e) => [e.id, e]));

  let ids: string[];
  if (request.from) {
    const approvals = ApprovalsSchema.safeParse(await readJson(request.from, 'the approvals file'));
    if (!approvals.success) throw new UserError(`${request.from} is not a valid approvals file`);
    if (approvals.data.runId !== report.runId) {
      throw new UserError(
        `${request.from} was exported for run ${approvals.data.runId}, but the current report is run ${report.runId}`,
      );
    }
    ids = approvals.data.approved;
  } else if (request.all) {
    ids = pending.map((e) => e.id);
  } else {
    ids = [...(request.ids ?? [])];
  }
  if (ids.length === 0)
    throw new UserError('Nothing to approve. Pass snapshot ids, --all, or --from <approvals.json>.');
  const unknown = ids.filter((id) => !byId.has(id));
  if (unknown.length > 0) throw new UserError(`Not in the current report: ${unknown.join(', ')}`);

  await mkdir(p.baseline, { recursive: true });
  const manifestPath = join(p.baseline, 'manifest.json');
  const manifest = new Map((await readManifest(manifestPath))?.entries.map((e) => [e.id, e]));
  const approved: string[] = [];
  for (const id of ids) {
    const entry = byId.get(id);
    if (!entry || entry.status === 'unchanged') continue;
    if (entry.status === 'removed') {
      await rm(join(p.baseline, `${id}.png`), { force: true });
      manifest.delete(id);
    } else {
      await copyFile(join(p.report, 'current', `${id}.png`), join(p.baseline, `${id}.png`));
      const meta: ManifestEntry = {
        id,
        name: entry.name,
        group: entry.group,
        url: entry.url,
        viewport: entry.viewport,
        theme: entry.theme,
        width: entry.width,
        height: entry.height,
        stable: true,
      };
      manifest.set(id, meta);
    }
    approved.push(id);
  }
  await writeManifest(manifestPath, [...manifest.values()], (options.now ?? (() => new Date()))());
  options.logger.info('Approved snapshots', { count: approved.length, baseline: p.baseline });
  return { approved };
}
