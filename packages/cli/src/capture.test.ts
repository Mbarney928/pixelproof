import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { decodePng } from '@pixelproof/core';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { capture, stableScreenshot } from './capture.js';
import { parseConfig } from './config.js';
import { readManifest } from './manifest.js';
import { resolveJobs } from './targets.js';
import { quietLogger, serve, tempDir } from './test/helpers.js';

const PAGE = `<!doctype html><html><head><meta charset="utf-8"><style>
  body { margin: 0; font-family: sans-serif; background: #fff; color: #111; }
  @media (prefers-color-scheme: dark) { body { background: #111; color: #eee; } }
  .spin { width: 40px; height: 40px; background: #2a78d6; animation: spin 1s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .clock { width: 120px; height: 24px; background: #e33; }
  .tall { height: 1400px; }
</style></head><body>
  <h1>Pricing</h1><div class="spin"></div>
  <div class="clock" id="clock"></div>
  <div class="tall"></div>
  <script>setInterval(() => { document.getElementById('clock').textContent = String(Date.now()); }, 16);</script>
</body></html>`;

let site: Awaited<ReturnType<typeof serve>>;
beforeAll(async () => {
  site = await serve({ '/pricing.html': ['text/html', PAGE] });
});
afterAll(() => {
  site.server.close();
});

describe('stableScreenshot', () => {
  it('returns once two consecutive shots match', async () => {
    const shots = [Buffer.from('a'), Buffer.from('b'), Buffer.from('b')];
    let i = 0;
    const result = await stableScreenshot(() => Promise.resolve(shots[i++] ?? Buffer.from('z')), 5, 0);
    expect(result).toEqual({ png: Buffer.from('b'), stable: true });
    expect(i).toBe(3);
  });

  it('gives up after the attempt budget and reports instability', async () => {
    let i = 0;
    const result = await stableScreenshot(() => Promise.resolve(Buffer.from(String(i++))), 3, 0);
    expect(result).toEqual({ png: Buffer.from('2'), stable: false });
  });

  it('takes a single shot when stability checks are off', async () => {
    let calls = 0;
    await stableScreenshot(() => Promise.resolve(Buffer.from(String(calls++))), 1, 0);
    expect(calls).toBe(1);
  });
});

describe('capture (real Chromium)', () => {
  it('captures every viewport × theme, freezes animation and masks moving content', async () => {
    const dir = await tempDir();
    const config = parseConfig({
      dir,
      baseUrl: site.url,
      targets: { urls: [{ name: 'Pricing', url: '/pricing.html', mask: ['.clock'] }] },
      viewports: [
        { name: 'mobile', width: 375, height: 700 },
        { name: 'desktop', width: 1024, height: 700 },
      ],
      themes: ['light', 'dark'],
      concurrency: 2,
    });
    const summary = await capture(config, await resolveJobs(config), { logger: quietLogger() });
    expect(summary.captured).toBe(4);
    // The spinner and ticking clock would differ between shots without freezing and masking.
    expect(summary.unstable).toEqual([]);

    const manifest = await readManifest(join(dir, 'current', 'manifest.json'));
    expect(manifest?.entries.map((e) => [e.id, e.width])).toEqual([
      ['pages-pricing--desktop--dark', 1024],
      ['pages-pricing--desktop--light', 1024],
      ['pages-pricing--mobile--dark', 375],
      ['pages-pricing--mobile--light', 375],
    ]);
    const light = decodePng(await readFile(join(dir, 'current', 'pages-pricing--desktop--light.png')));
    const dark = decodePng(await readFile(join(dir, 'current', 'pages-pricing--desktop--dark.png')));
    expect(light.height).toBeGreaterThan(1400);
    const pixel = (img: typeof light, x: number, y: number) => [
      ...img.data.slice((y * img.width + x) * 4, (y * img.width + x) * 4 + 3),
    ];
    expect(pixel(light, 900, 5)).toEqual([255, 255, 255]);
    expect(pixel(dark, 900, 5)).toEqual([17, 17, 17]);
  });

  it('fails with the page name when a target cannot load', async () => {
    const config = parseConfig({
      dir: await tempDir(),
      baseUrl: site.url,
      targets: { urls: [{ name: 'Missing', url: '/missing.html' }] },
      stability: { attempts: 1, intervalMs: 0 },
    });
    await expect(capture(config, await resolveJobs(config), { logger: quietLogger() })).rejects.toThrow(
      /Could not load "Pages \/ Missing".*HTTP 404/,
    );
  });
});
