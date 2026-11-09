import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { chromium, type Browser, type Page } from 'playwright';

import type { Config } from './config.js';
import type { Logger } from './logger.js';
import { writeManifest, type ManifestEntry } from './manifest.js';
import { runPool } from './pool.js';
import type { CaptureJob } from './targets.js';

/** Removes the usual sources of screenshot noise: motion, blinking carets and scrollbars. */
const STABILIZE_CSS = `
*, *::before, *::after {
  animation-duration: 0s !important; animation-delay: 0s !important;
  transition-duration: 0s !important; transition-delay: 0s !important;
  caret-color: transparent !important; scroll-behavior: auto !important;
}
html { scrollbar-width: none !important; }
::-webkit-scrollbar { display: none !important; }
`;

/** Flags that make Chromium rasterize text and color the same way on every run of the same machine image. */
export const CHROMIUM_ARGS = [
  '--font-render-hinting=none',
  '--force-color-profile=srgb',
  '--disable-skia-runtime-opts',
  '--disable-lcd-text',
  '--hide-scrollbars',
];

export interface CaptureOptions {
  logger: Logger;
  now?: () => Date;
  launch?: () => Promise<Browser>;
}

export interface CaptureSummary {
  captured: number;
  unstable: string[];
  dir: string;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Screenshots until two consecutive captures are byte-identical (or attempts run out), so late
 * fonts, lazy images and async rendering settle before the image is kept.
 */
export async function stableScreenshot(
  take: () => Promise<Buffer>,
  attempts: number,
  intervalMs: number,
): Promise<{ png: Buffer; stable: boolean }> {
  let previous = await take();
  if (attempts <= 1) return { png: previous, stable: true };
  for (let i = 1; i < attempts; i++) {
    await sleep(intervalMs);
    const next = await take();
    if (next.equals(previous)) return { png: next, stable: true };
    previous = next;
  }
  return { png: previous, stable: false };
}

async function preparePage(page: Page, job: CaptureJob, config: Config): Promise<void> {
  const response = await page.goto(job.url, { waitUntil: 'networkidle', timeout: config.timeoutMs });
  if (response && !response.ok()) throw new Error(`HTTP ${response.status()} for ${job.url}`);
  await page.addStyleTag({ content: STABILIZE_CSS });
  if (job.waitFor) await page.locator(job.waitFor).first().waitFor({ timeout: config.timeoutMs });
  await page.evaluate(async () => {
    await document.fonts.ready;
    // Wait for every image (including lazy ones scrolled into a full-page shot) to decode.
    await Promise.all(
      Array.from(document.images, (img) => {
        img.loading = 'eager';
        return img.decode().catch(() => undefined);
      }),
    );
  });
}

/** Captures every job into `<dir>/current/` and writes its manifest. */
export async function capture(
  config: Config,
  jobs: readonly CaptureJob[],
  options: CaptureOptions,
): Promise<CaptureSummary> {
  const { logger } = options;
  const now = options.now ?? (() => new Date());
  const dir = join(config.dir, 'current');
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });

  const browser = await (options.launch ?? (() => chromium.launch({ args: CHROMIUM_ARGS })))();
  const started = Date.now();
  try {
    const entries = await runPool(jobs, config.concurrency, async (job): Promise<ManifestEntry> => {
      const context = await browser.newContext({
        viewport: { width: job.viewport.width, height: job.viewport.height },
        deviceScaleFactor: 1,
        colorScheme: job.theme,
        reducedMotion: 'reduce',
        locale: 'en-US',
        timezoneId: 'UTC',
      });
      try {
        const page = await context.newPage();
        page.setDefaultTimeout(config.timeoutMs);
        try {
          await preparePage(page, job, config);
        } catch (error) {
          throw new Error(
            `Could not load "${job.group} / ${job.name}" (${job.url}): ${(error as Error).message}`,
            { cause: error },
          );
        }
        const mask = job.mask.map((selector) => page.locator(selector));
        const { png, stable } = await stableScreenshot(
          () =>
            page.screenshot({
              fullPage: config.fullPage,
              animations: 'disabled',
              caret: 'hide',
              scale: 'css',
              mask,
              maskColor: '#7F7F7F',
            }),
          config.stability.attempts,
          config.stability.intervalMs,
        );
        await writeFile(join(dir, `${job.id}.png`), png);
        const width = png.readUInt32BE(16);
        const height = png.readUInt32BE(20);
        if (!stable) logger.warn('Snapshot never settled; it may be flaky', { id: job.id });
        logger.debug('Captured', { id: job.id, width, height });
        return {
          id: job.id,
          name: job.name,
          group: job.group,
          url: job.url,
          viewport: job.viewport,
          theme: job.theme,
          width,
          height,
          stable,
        };
      } finally {
        await context.close();
      }
    });
    await writeManifest(join(dir, 'manifest.json'), entries, now());
    logger.info('Captured snapshots', { count: entries.length, ms: Date.now() - started });
    return { captured: entries.length, unstable: entries.filter((e) => !e.stable).map((e) => e.id), dir };
  } finally {
    await browser.close();
  }
}
