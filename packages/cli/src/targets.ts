import { snapshotId, type Theme, type Viewport } from '@pixelproof/core/schema';
import { z } from 'zod';

import { resolveUrl, type Config } from './config.js';
import { UserError } from './errors.js';

export interface CaptureJob {
  id: string;
  name: string;
  group: string;
  url: string;
  viewport: Viewport;
  theme: Theme;
  mask: string[];
  waitFor?: string;
}

export type FetchJson = (url: string) => Promise<unknown>;

/** One page or story before it is multiplied by viewports and themes. */
interface PageSpec {
  name: string;
  group: string;
  mask: string[];
  waitFor?: string;
  urlFor: (theme: Theme) => string;
}

const StorybookIndexSchema = z.object({
  entries: z.record(
    z.string(),
    z.object({ id: z.string().min(1), title: z.string(), name: z.string(), type: z.string().optional() }),
  ),
});

/** Converts a glob over "Title/Name" into a RegExp: `**` spans slashes, `*` does not. */
export function globToRegExp(glob: string): RegExp {
  let re = '';
  for (let i = 0; i < glob.length; i++) {
    const ch = glob.charAt(i);
    if (ch === '*' && glob[i + 1] === '*') {
      re += '.*';
      i++;
    } else if (ch === '*') {
      re += '[^/]*';
    } else {
      re += ch.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
    }
  }
  return new RegExp(`^${re}$`, 'i');
}

const defaultFetchJson: FetchJson = async (url) => {
  const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new UserError(`Could not load ${url}: HTTP ${res.status}`);
  return res.json();
};

/** Expands the configured targets × viewports × themes into individual capture jobs. */
export async function resolveJobs(
  config: Config,
  fetchJson: FetchJson = defaultFetchJson,
): Promise<CaptureJob[]> {
  const pages: PageSpec[] = [];

  for (const t of config.targets.urls) {
    const url = resolveUrl(t.url, config.baseUrl);
    pages.push({
      name: t.name,
      group: t.group,
      mask: [...config.mask, ...t.mask],
      ...(t.waitFor ? { waitFor: t.waitFor } : {}),
      urlFor: () => url,
    });
  }

  const sb = config.targets.storybook;
  if (sb) {
    const base = resolveUrl(sb.url, config.baseUrl).replace(/\/?$/, '/');
    let raw: unknown;
    try {
      raw = await fetchJson(`${base}index.json`);
    } catch (error) {
      throw error instanceof UserError
        ? error
        : new UserError(`Could not load ${base}index.json: ${(error as Error).message}`);
    }
    const index = StorybookIndexSchema.safeParse(raw);
    if (!index.success) throw new UserError(`${base}index.json is not a Storybook 7+ index`);
    const include = sb.include.map(globToRegExp);
    const exclude = sb.exclude.map(globToRegExp);
    for (const story of Object.values(index.data.entries)) {
      if (story.type !== undefined && story.type !== 'story') continue;
      const path = `${story.title}/${story.name}`;
      if (!include.some((r) => r.test(path)) || exclude.some((r) => r.test(path))) continue;
      pages.push({
        name: story.name,
        group: story.title,
        mask: [...config.mask],
        urlFor: (theme) => {
          const params = new URLSearchParams({ id: story.id, viewMode: 'story' });
          if (sb.themeGlobal) params.set('globals', `${sb.themeGlobal}:${theme}`);
          return `${base}iframe.html?${params.toString()}`;
        },
      });
    }
  }

  const jobs: CaptureJob[] = [];
  const seen = new Map<string, string>();
  for (const p of pages) {
    for (const viewport of config.viewports) {
      for (const theme of config.themes) {
        const id = snapshotId(p.group, p.name, viewport.name, theme);
        const label = `${p.group} / ${p.name}`;
        const clash = seen.get(id);
        if (clash !== undefined)
          throw new UserError(`"${label}" and "${clash}" map to the same snapshot id ${id}; rename one`);
        seen.set(id, label);
        const { urlFor, ...rest } = p;
        jobs.push({ ...rest, id, viewport, theme, url: urlFor(theme) });
      }
    }
  }
  if (jobs.length === 0)
    throw new UserError('No targets matched. Check `targets` and the include/exclude patterns.');
  return jobs;
}
