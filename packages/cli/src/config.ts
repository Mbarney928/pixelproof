import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { ThemeSchema, ViewportSchema } from '@pixelproof/core/schema';
import { z } from 'zod';

import { UserError } from './errors.js';

const HttpUrl = z.url({ protocol: /^https?$/, error: 'Use an absolute http(s) URL' });
/** A page URL: absolute http(s), or a path such as `/pricing.html` resolved against `baseUrl`. */
const PageUrl = z.union([
  HttpUrl,
  z.string().regex(/^\/[^\s]*$/, 'Use an http(s) URL or a path starting with /'),
]);
const Selector = z.string().min(1).max(500);

const UrlTargetSchema = z.object({
  name: z.string().min(1).max(200),
  group: z.string().min(1).max(200).default('Pages'),
  url: PageUrl,
  /** Extra CSS selectors masked only on this page. */
  mask: z.array(Selector).default([]),
  /** A selector to wait for before capturing (e.g. a chart that renders late). */
  waitFor: Selector.optional(),
});

const StorybookTargetSchema = z.object({
  url: PageUrl,
  /** Glob patterns over "Title/Story name", e.g. `Components/**`. Default: every story. */
  include: z.array(z.string().min(1)).default(['**']),
  exclude: z.array(z.string().min(1)).default([]),
  /** Storybook global used to switch theme, e.g. `theme` gives `&globals=theme:dark`. */
  themeGlobal: z
    .string()
    .regex(/^[A-Za-z0-9_.-]+$/)
    .optional(),
});

export const ConfigSchema = z
  .object({
    /** Where baselines, captures and the report live. */
    dir: z.string().min(1).default('.pixelproof'),
    baseUrl: HttpUrl.optional(),
    targets: z
      .object({ urls: z.array(UrlTargetSchema).default([]), storybook: StorybookTargetSchema.optional() })
      .refine(
        (t) => t.urls.length > 0 || t.storybook !== undefined,
        'Configure `urls`, `storybook`, or both',
      ),
    viewports: z
      .array(ViewportSchema)
      .min(1)
      .default([{ name: 'desktop', width: 1280, height: 800 }]),
    themes: z.array(ThemeSchema).min(1).default(['light']),
    /** Per-pixel color tolerance (0-1). */
    threshold: z.number().min(0).max(1).default(0.1),
    includeAntiAliasing: z.boolean().default(false),
    /** Share of pixels allowed to differ before a snapshot counts as changed. */
    toleranceRatio: z.number().min(0).max(1).default(0),
    mergeDistance: z.number().int().min(1).max(200).default(12),
    /** CSS selectors masked in every capture (clocks, avatars, ads). */
    mask: z.array(Selector).default([]),
    fullPage: z.boolean().default(true),
    concurrency: z.number().int().min(1).max(16).default(4),
    timeoutMs: z.number().int().min(1000).max(300_000).default(30_000),
    stability: z
      .object({
        attempts: z.number().int().min(1).max(10).default(3),
        intervalMs: z.number().int().min(0).max(5000).default(150),
      })
      .default({ attempts: 3, intervalMs: 150 }),
    /** Exit non-zero when there are `any` visual changes, only `major` ones, or `never`. */
    failOn: z.enum(['any', 'major', 'never']).default('any'),
  })
  .superRefine((c, ctx) => {
    const relative = [
      ...c.targets.urls.map((t) => t.url),
      ...(c.targets.storybook ? [c.targets.storybook.url] : []),
    ].filter((u) => u.startsWith('/'));
    if (relative.length > 0 && !c.baseUrl) {
      ctx.addIssue({
        code: 'custom',
        path: ['baseUrl'],
        message: `Needed for relative URLs such as ${relative[0] ?? ''}`,
      });
    }
    const names = new Set<string>();
    for (const v of c.viewports) {
      if (names.has(v.name))
        ctx.addIssue({ code: 'custom', path: ['viewports'], message: `Duplicate viewport "${v.name}"` });
      names.add(v.name);
    }
  });

export type Config = z.infer<typeof ConfigSchema>;
export type UrlTarget = z.infer<typeof UrlTargetSchema>;
export type StorybookTarget = z.infer<typeof StorybookTargetSchema>;

/** Environment variables that override the file, so CI can point the same config at a preview URL. */
export interface ConfigEnv {
  PIXELPROOF_BASE_URL?: string | undefined;
  PIXELPROOF_DIR?: string | undefined;
  PIXELPROOF_CONCURRENCY?: string | undefined;
}

export function parseConfig(raw: unknown, env: ConfigEnv = {}): Config {
  const input = typeof raw === 'object' && raw !== null ? { ...(raw as Record<string, unknown>) } : raw;
  if (typeof input === 'object' && input !== null) {
    const o = input as Record<string, unknown>;
    if (env.PIXELPROOF_BASE_URL) o.baseUrl = env.PIXELPROOF_BASE_URL;
    if (env.PIXELPROOF_DIR) o.dir = env.PIXELPROOF_DIR;
    if (env.PIXELPROOF_CONCURRENCY) o.concurrency = Number(env.PIXELPROOF_CONCURRENCY);
  }
  const result = ConfigSchema.safeParse(input);
  if (!result.success) {
    const lines = result.error.issues.map(
      (i) => `  • ${i.path.length ? i.path.join('.') : '(root)'}: ${i.message}`,
    );
    throw new UserError(`Invalid pixelproof config:\n${lines.join('\n')}`);
  }
  return result.data;
}

export async function loadConfig(path: string, env: ConfigEnv = {}): Promise<Config> {
  let text: string;
  try {
    text = await readFile(resolve(path), 'utf8');
  } catch {
    throw new UserError(`Config file not found: ${path}. Create one with \`pixelproof init\`.`);
  }
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch (error) {
    throw new UserError(`Config file is not valid JSON: ${(error as Error).message}`);
  }
  return parseConfig(raw, env);
}

/** Resolves a target URL against `baseUrl`, keeping the base's path prefix (e.g. `/sprintfit/`). */
export function resolveUrl(url: string, baseUrl: string | undefined): string {
  if (!url.startsWith('/')) return url;
  if (!baseUrl) throw new UserError(`Relative URL ${url} needs baseUrl`);
  return new URL(url.slice(1), baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`).toString();
}

export const STARTER_CONFIG = {
  $comment: 'pixelproof config. See README for every option.',
  baseUrl: 'http://127.0.0.1:6006',
  targets: { storybook: { url: '/', include: ['**'], exclude: [] } },
  viewports: [
    { name: 'mobile', width: 375, height: 812 },
    { name: 'desktop', width: 1280, height: 800 },
  ],
  themes: ['light', 'dark'],
  mask: ['[data-pixelproof-ignore]'],
};
