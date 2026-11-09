import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { loadConfig, parseConfig, resolveUrl } from './config.js';
import { UserError } from './errors.js';

const minimal = { targets: { urls: [{ name: 'Home', url: 'https://example.com/' }] } };

describe('config', () => {
  it('fills sensible defaults', () => {
    const c = parseConfig(minimal);
    expect(c).toMatchObject({
      dir: '.pixelproof',
      viewports: [{ name: 'desktop', width: 1280, height: 800 }],
      themes: ['light'],
      threshold: 0.1,
      failOn: 'any',
      concurrency: 4,
      stability: { attempts: 3, intervalMs: 150 },
    });
    expect(c.targets.urls[0]).toMatchObject({ group: 'Pages', mask: [] });
  });

  it('lets environment variables override the file', () => {
    const c = parseConfig(
      { ...minimal, targets: { urls: [{ name: 'Home', url: '/home' }] } },
      {
        PIXELPROOF_BASE_URL: 'http://127.0.0.1:4173/app/',
        PIXELPROOF_DIR: 'out',
        PIXELPROOF_CONCURRENCY: '2',
      },
    );
    expect(c).toMatchObject({ baseUrl: 'http://127.0.0.1:4173/app/', dir: 'out', concurrency: 2 });
  });

  it('explains every field problem in one readable error', () => {
    const run = () =>
      parseConfig({
        targets: { urls: [{ name: 'Bad', url: 'javascript:alert(1)' }] },
        viewports: [{ name: 'a', width: 100, height: 800 }],
        themes: ['sepia'],
      });
    expect(run).toThrow(UserError);
    expect(run).toThrow(/targets\.urls\.0\.url/);
    expect(run).toThrow(/viewports\.0\.width/);
    expect(run).toThrow(/themes\.0/);
  });

  it('checks cross-field rules once the shape is valid', () => {
    const run = () =>
      parseConfig({
        targets: { urls: [{ name: 'Home', url: '/home' }] },
        viewports: [
          { name: 'a', width: 400, height: 800 },
          { name: 'a', width: 800, height: 800 },
        ],
      });
    expect(run).toThrow(/Duplicate viewport "a"/);
    expect(run).toThrow(/baseUrl: Needed for relative URLs such as \/home/);
  });

  it('requires at least one kind of target', () => {
    expect(() => parseConfig({ targets: {} })).toThrow(/Configure `urls`, `storybook`, or both/);
    expect(() => parseConfig(null)).toThrow(UserError);
  });

  it('loads from disk and reports missing or malformed files', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'pixelproof-config-'));
    const good = join(dir, 'good.json');
    const bad = join(dir, 'bad.json');
    await writeFile(good, JSON.stringify(minimal));
    await writeFile(bad, '{ nope');
    await expect(loadConfig(good)).resolves.toMatchObject({ themes: ['light'] });
    await expect(loadConfig(bad)).rejects.toThrow(/not valid JSON/);
    await expect(loadConfig(join(dir, 'missing.json'))).rejects.toThrow(/not found/);
  });

  it('resolves relative URLs against a base that has a path prefix', () => {
    expect(resolveUrl('/pricing.html', 'http://127.0.0.1:4173/site')).toBe(
      'http://127.0.0.1:4173/site/pricing.html',
    );
    expect(resolveUrl('https://example.com/x', undefined)).toBe('https://example.com/x');
    expect(() => resolveUrl('/x', undefined)).toThrow(UserError);
  });
});
