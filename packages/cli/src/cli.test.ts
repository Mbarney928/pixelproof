import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { run, type CliIo } from './cli.js';
import { serve, tempDir } from './test/helpers.js';

function io(env: Record<string, string> = {}) {
  const out: string[] = [];
  const err: string[] = [];
  const value: CliIo = { stdout: (t) => out.push(t), stderr: (l) => err.push(l), env };
  return { value, out, err };
}

let site: Awaited<ReturnType<typeof serve>>;
let variant = 'a';
beforeAll(async () => {
  site = await serve({});
  // Swap the handler so the page can change between runs.
  site.server.removeAllListeners('request');
  site.server.on('request', (_req, res) => {
    const color = variant === 'a' ? '#2a78d6' : '#d62a2a';
    res.writeHead(200, { 'content-type': 'text/html' });
    res.end(
      `<!doctype html><body style="margin:0"><div style="width:200px;height:80px;background:${color}"></div></body>`,
    );
  });
});
afterAll(() => {
  site.server.close();
});

describe('pixelproof CLI', () => {
  it('runs the full loop: test → approve → test passes → change detected', async () => {
    const dir = await tempDir();
    const configPath = join(dir, 'pixelproof.config.json');
    await writeFile(
      configPath,
      JSON.stringify({
        dir: join(dir, '.pixelproof'),
        targets: { urls: [{ name: 'Card', url: '/card' }] },
        viewports: [{ name: 'small', width: 320, height: 240 }],
        stability: { attempts: 2, intervalMs: 0 },
      }),
    );
    const env = { PIXELPROOF_BASE_URL: site.url };

    const first = io(env);
    expect(await run(['test', '-c', configPath, '--json'], first.value)).toBe(1);
    expect(JSON.parse(first.out.join(''))).toMatchObject({ summary: { new: 1 } });

    expect(await run(['approve', '--all', '-c', configPath], io(env).value)).toBe(0);

    const second = io(env);
    expect(await run(['test', '-c', configPath, '--json'], second.value)).toBe(0);
    expect(JSON.parse(second.out.join(''))).toMatchObject({ summary: { unchanged: 1, changed: 0 } });

    variant = 'b';
    const third = io(env);
    expect(await run(['test', '-c', configPath, '--json', '--log-format', 'json'], third.value)).toBe(1);
    expect(JSON.parse(third.out.join(''))).toMatchObject({ summary: { changed: 1 } });
    const logs = third.err.map((l) => JSON.parse(l) as { msg: string });
    expect(logs.map((l) => l.msg)).toContain('Visual changes need review');
    variant = 'a';
  });

  it('returns 2 with a readable message for config errors', async () => {
    const dir = await tempDir();
    const configPath = join(dir, 'bad.json');
    await writeFile(configPath, JSON.stringify({ targets: {} }));
    const r = io();
    expect(await run(['compare', '-c', configPath], r.value)).toBe(2);
    expect(r.err.join('\n')).toMatch(/Invalid pixelproof config/);
    expect(await run(['capture', '-c', join(dir, 'nope.json')], io().value)).toBe(2);
  });

  it('writes a starter config once', async () => {
    const dir = await tempDir();
    await mkdir(dir, { recursive: true });
    const path = join(dir, 'pixelproof.config.json');
    expect(await run(['init', '-c', path], io().value)).toBe(0);
    expect(JSON.parse(await readFile(path, 'utf8'))).toMatchObject({ themes: ['light', 'dark'] });
    const again = io();
    expect(await run(['init', '-c', path], again.value)).toBe(2);
    expect(again.err.join('')).toMatch(/already exists/);
  });

  it('prints help and version, and rejects unknown commands', async () => {
    const help = io();
    expect(await run(['--help'], help.value)).toBe(0);
    expect(help.out.join('')).toContain('capture');
    const version = io();
    expect(await run(['--version'], version.value)).toBe(0);
    expect(version.out.join('')).toContain('0.1.0');
    expect(await run(['explode'], io().value)).toBe(2);
  });
});
