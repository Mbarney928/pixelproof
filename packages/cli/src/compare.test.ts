import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

import { decodePng } from '@pixelproof/core';
import { ReportSchema } from '@pixelproof/core/schema';
import { describe, expect, it } from 'vitest';

import { compareRun, exitCodeFor } from './compare.js';
import { quietLogger, seedSide, solidPng, tempDir, testConfig } from './test/helpers.js';

async function scenario() {
  const dir = await tempDir();
  await seedSide(dir, 'baseline', {
    same: solidPng(40, 30),
    tweaked: solidPng(40, 30),
    gone: solidPng(40, 30),
  });
  await seedSide(dir, 'current', {
    same: solidPng(40, 30),
    tweaked: solidPng(40, 30, { x: 5, y: 5, size: 6 }),
    fresh: solidPng(40, 30),
  });
  return dir;
}

describe('compareRun', () => {
  it('classifies every snapshot and writes a valid, self-contained report', async () => {
    const dir = await scenario();
    const report = await compareRun(testConfig(dir), {
      logger: quietLogger(),
      runId: 'run-1',
      now: () => new Date('2026-11-09T12:00:00Z'),
    });

    expect(report.summary).toEqual({ total: 4, changed: 1, new: 1, removed: 1, unchanged: 1 });
    expect(report.entries.map((e) => [e.id, e.status])).toEqual([
      ['tweaked', 'changed'],
      ['fresh', 'new'],
      ['gone', 'removed'],
      ['same', 'unchanged'],
    ]);
    const tweaked = report.entries[0];
    expect(tweaked?.diff?.regions).toEqual([{ x: 5, y: 5, width: 6, height: 6, pixels: 36 }]);
    expect(tweaked?.images).toEqual({
      baseline: 'baseline/tweaked.png',
      current: 'current/tweaked.png',
      diff: 'diff/tweaked.png',
      thumb: 'thumb/tweaked.png',
    });

    const onDisk = ReportSchema.parse(JSON.parse(await readFile(join(dir, 'report', 'report.json'), 'utf8')));
    expect(onDisk.runId).toBe('run-1');
    expect((await readdir(join(dir, 'report', 'diff'))).sort()).toEqual(['tweaked.png']);
    expect((await readdir(join(dir, 'report', 'current'))).sort()).toEqual([
      'fresh.png',
      'same.png',
      'tweaked.png',
    ]);
    expect((await readdir(join(dir, 'report', 'baseline'))).sort()).toEqual([
      'gone.png',
      'same.png',
      'tweaked.png',
    ]);
    // Every snapshot gets a list preview, taken from the current image or (when removed) the baseline.
    expect((await readdir(join(dir, 'report', 'thumb'))).sort()).toEqual([
      'fresh.png',
      'gone.png',
      'same.png',
      'tweaked.png',
    ]);
    const thumb = decodePng(await readFile(join(dir, 'report', 'thumb', 'gone.png')));
    expect([thumb.width, thumb.height]).toEqual([144, 96]);
  });

  it('reports everything as new when there is no baseline yet', async () => {
    const dir = await tempDir();
    await seedSide(dir, 'current', { a: solidPng(10, 10), b: solidPng(10, 10) });
    const lines: string[] = [];
    const report = await compareRun(testConfig(dir), { logger: quietLogger(lines) });
    expect(report.summary).toMatchObject({ total: 2, new: 2 });
    expect(lines.some((l) => l.includes('No baseline yet'))).toBe(true);
  });

  it('fails clearly when nothing was captured', async () => {
    await expect(compareRun(testConfig(await tempDir()), { logger: quietLogger() })).rejects.toThrow(
      /Run `pixelproof capture` first/,
    );
  });

  it('turns the failOn policy into an exit code', async () => {
    const report = await compareRun(testConfig(await scenario()), { logger: quietLogger() });
    expect(exitCodeFor(report, 'any')).toBe(1);
    expect(exitCodeFor(report, 'never')).toBe(0);
    // A removed snapshot always fails the "major" policy.
    expect(exitCodeFor(report, 'major')).toBe(1);
    const onlyMinor = {
      ...report,
      entries: report.entries
        .filter((e) => e.status !== 'removed')
        .map((e) => ({ ...e, severity: e.severity === 'major' ? ('minor' as const) : e.severity })),
    };
    expect(exitCodeFor(onlyMinor, 'major')).toBe(0);
    expect(
      exitCodeFor({ ...report, summary: { ...report.summary, changed: 0, new: 0, removed: 0 } }, 'any'),
    ).toBe(0);
  });
});
