import { ReportSchema, type Report, type ReportEntry } from '@pixelproof/core/schema';

export type ReportErrorCode = 'not_found' | 'invalid' | 'network' | 'bad_location';

export class ReportError extends Error {
  override readonly name = 'ReportError';
  constructor(
    readonly code: ReportErrorCode,
    message: string,
  ) {
    super(message);
  }
}

export const DEFAULT_REPORT_PATH = 'report/report.json';

/**
 * Where to load the report from: `?report=<path>` or the default `report/report.json`, always
 * relative to the app. Absolute URLs and `..` are refused so a crafted link cannot make the app
 * load data (or images) from somewhere else.
 */
export function resolveReportUrl(search: string, appUrl: string): string {
  const requested = new URLSearchParams(search).get('report') ?? DEFAULT_REPORT_PATH;
  if (
    !/^[\w\-./]+\.json$/.test(requested) ||
    requested.split('/').includes('..') ||
    requested.startsWith('/')
  ) {
    throw new ReportError(
      'bad_location',
      `Refusing to load a report from “${requested}”. Use a relative .json path.`,
    );
  }
  return new URL(requested, appUrl).toString();
}

export async function fetchReport(url: string, fetchImpl: typeof fetch = fetch): Promise<Report> {
  let res: Response;
  try {
    res = await fetchImpl(url, { headers: { accept: 'application/json' } });
  } catch {
    throw new ReportError(
      'network',
      'The report could not be downloaded. Check your connection and try again.',
    );
  }
  if (res.status === 404) {
    throw new ReportError(
      'not_found',
      'No report found. Run `pixelproof test` and open the generated report folder.',
    );
  }
  if (!res.ok) throw new ReportError('network', `The report server answered with HTTP ${res.status}.`);
  let body: unknown;
  try {
    body = await res.json();
  } catch {
    throw new ReportError('invalid', 'The report file is not valid JSON.');
  }
  const parsed = ReportSchema.safeParse(body);
  if (!parsed.success) {
    throw new ReportError(
      'invalid',
      'The report was written by an incompatible pixelproof version or is damaged.',
    );
  }
  return parsed.data;
}

export type ImageKind = keyof ReportEntry['images'];

/** Absolute URL of one of an entry's images, or undefined when that side does not exist. */
export function imageUrl(reportUrl: string, entry: ReportEntry, kind: ImageKind): string | undefined {
  const path = entry.images[kind];
  return path ? new URL(path, reportUrl).toString() : undefined;
}
