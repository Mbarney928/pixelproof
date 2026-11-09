import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { createImage, encodePng } from '@pixelproof/core';

import { parseConfig, type Config } from '../config.js';
import { createLogger } from '../logger.js';
import { writeManifest, type ManifestEntry } from '../manifest.js';

export async function tempDir(): Promise<string> {
  return mkdtemp(join(tmpdir(), 'pixelproof-'));
}

export function testConfig(dir: string, extra: Record<string, unknown> = {}): Config {
  return parseConfig({ dir, targets: { urls: [{ name: 'Home', url: 'http://127.0.0.1:1/' }] }, ...extra });
}

export function quietLogger(lines: string[] = []) {
  return createLogger({ level: 'debug', write: (l) => lines.push(l) });
}

/** A solid-colour PNG of `w × h`, optionally with one block painted another colour. */
export function solidPng(w: number, h: number, block?: { x: number; y: number; size: number }): Buffer {
  const img = createImage(w, h, [255, 255, 255, 255]);
  if (block) {
    for (let y = block.y; y < block.y + block.size; y++) {
      for (let x = block.x; x < block.x + block.size; x++) img.data.set([200, 30, 30, 255], (y * w + x) * 4);
    }
  }
  return encodePng(img);
}

export function entry(id: string, extra: Partial<ManifestEntry> = {}): ManifestEntry {
  return {
    id,
    name: id,
    group: 'Pages',
    url: 'http://127.0.0.1:1/',
    viewport: { name: 'desktop', width: 1280, height: 800 },
    theme: 'light',
    width: 40,
    height: 30,
    stable: true,
    ...extra,
  };
}

/** Writes PNGs and a manifest into `<dir>/<side>/`. */
export async function seedSide(
  dir: string,
  side: 'baseline' | 'current',
  files: Record<string, Buffer>,
): Promise<void> {
  const folder = join(dir, side);
  await mkdir(folder, { recursive: true });
  for (const [id, png] of Object.entries(files)) await writeFile(join(folder, `${id}.png`), png);
  await writeManifest(
    join(folder, 'manifest.json'),
    Object.keys(files).map((id) => entry(id)),
    new Date('2026-11-09T12:00:00Z'),
  );
}

/** Serves an in-memory map of path → [content-type, body] on 127.0.0.1. */
export async function serve(
  routes: Record<string, [string, string]>,
): Promise<{ url: string; server: Server }> {
  const server = createServer((req, res) => {
    const path = new URL(req.url ?? '/', 'http://x').pathname;
    const route = routes[path];
    if (!route) {
      res.writeHead(404).end('not found');
      return;
    }
    res.writeHead(200, { 'content-type': route[0] }).end(route[1]);
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address() as AddressInfo;
  return { url: `http://127.0.0.1:${port}`, server };
}
