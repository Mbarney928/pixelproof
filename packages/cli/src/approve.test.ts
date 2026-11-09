import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { approve } from './approve.js';
import { compareRun } from './compare.js';
import { readManifest } from './manifest.js';
import { quietLogger, seedSide, solidPng, tempDir, testConfig } from './test/helpers.js';

async function reviewed() {
  const dir = await tempDir();
  await seedSide(dir, 'baseline', {
    tweaked: solidPng(40, 30),
    gone: solidPng(40, 30),
    same: solidPng(40, 30),
  });
  await seedSide(dir, 'current', {
    tweaked: solidPng(40, 30, { x: 1, y: 1, size: 4 }),
    fresh: solidPng(40, 30),
    same: solidPng(40, 30),
  });
  const config = testConfig(dir);
  const report = await compareRun(config, { logger: quietLogger(), runId: 'run-7' });
  return { dir, config, report };
}

describe('approve', () => {
  it('approves everything pending: updates, adds and removes baseline images', async () => {
    const { dir, config } = await reviewed();
    const result = await approve(config, { all: true }, { logger: quietLogger() });
    expect(result.approved.sort()).toEqual(['fresh', 'gone', 'tweaked']);
    expect((await readdir(join(dir, 'baseline'))).sort()).toEqual([
      'fresh.png',
      'manifest.json',
      'same.png',
      'tweaked.png',
    ]);
    const manifest = await readManifest(join(dir, 'baseline', 'manifest.json'));
    expect(manifest?.entries.map((e) => e.id)).toEqual(['fresh', 'same', 'tweaked']);
    expect(await readFile(join(dir, 'baseline', 'tweaked.png'))).toEqual(
      await readFile(join(dir, 'current', 'tweaked.png')),
    );
  });

  it('approves selected ids only and ignores unchanged ones', async () => {
    const { dir, config } = await reviewed();
    const result = await approve(config, { ids: ['tweaked', 'same'] }, { logger: quietLogger() });
    expect(result.approved).toEqual(['tweaked']);
    expect((await readdir(join(dir, 'baseline'))).sort()).toContain('gone.png');
  });

  it('applies an approvals file exported by the review app', async () => {
    const { dir, config } = await reviewed();
    const file = join(dir, 'approvals.json');
    await writeFile(
      file,
      JSON.stringify({ version: 1, runId: 'run-7', approved: ['fresh'], rejected: ['tweaked'] }),
    );
    await expect(approve(config, { from: file }, { logger: quietLogger() })).resolves.toEqual({
      approved: ['fresh'],
    });
  });

  it('refuses stale, unknown, malformed or empty approvals', async () => {
    const { dir, config } = await reviewed();
    const logger = quietLogger();
    const stale = join(dir, 'stale.json');
    await writeFile(stale, JSON.stringify({ version: 1, runId: 'run-6', approved: ['fresh'], rejected: [] }));
    await expect(approve(config, { from: stale }, { logger })).rejects.toThrow(/exported for run run-6/);

    const traversal = join(dir, 'evil.json');
    await writeFile(
      traversal,
      JSON.stringify({ version: 1, runId: 'run-7', approved: ['../../etc/passwd'], rejected: [] }),
    );
    await expect(approve(config, { from: traversal }, { logger })).rejects.toThrow(
      /not a valid approvals file/,
    );

    await expect(approve(config, { ids: ['nope'] }, { logger })).rejects.toThrow(
      /Not in the current report: nope/,
    );
    await expect(approve(config, {}, { logger })).rejects.toThrow(/Nothing to approve/);
    await expect(approve(config, { from: join(dir, 'missing.json') }, { logger })).rejects.toThrow(
      /Could not read/,
    );
  });

  it('needs a report first', async () => {
    await expect(
      approve(testConfig(await tempDir()), { all: true }, { logger: quietLogger() }),
    ).rejects.toThrow(/Could not read the report/);
  });
});
