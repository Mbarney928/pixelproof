import { ReportSchema, type Report, type ReportEntry } from '@pixelproof/core/schema';

const viewport = (name: 'mobile' | 'desktop') =>
  name === 'mobile' ? { name, width: 390, height: 844 } : { name, width: 1280, height: 800 };

function entry(
  id: string,
  name: string,
  status: ReportEntry['status'],
  extra: Partial<ReportEntry> = {},
): ReportEntry {
  const vp = id.includes('mobile') ? viewport('mobile') : viewport('desktop');
  return {
    id,
    name,
    group: 'Demo shop',
    viewport: vp,
    theme: id.endsWith('dark') ? 'dark' : 'light',
    url: `http://127.0.0.1:4310/${name.toLowerCase()}.html`,
    status,
    severity: 'none',
    width: vp.width,
    height: vp.height,
    images: {
      ...(status !== 'new' ? { baseline: `baseline/${id}.png` } : {}),
      ...(status !== 'removed' ? { current: `current/${id}.png` } : {}),
      ...(status === 'changed' ? { diff: `diff/${id}.png` } : {}),
    },
    ...extra,
  };
}

/** A small, valid report: three changed, one new, one removed, two unchanged. */
export function sampleReport(): Report {
  return ReportSchema.parse({
    version: 1,
    runId: 'run-abc12345',
    createdAt: '2026-11-09T12:00:00Z',
    tool: { name: 'pixelproof', version: '0.1.0' },
    settings: { threshold: 0.1, includeAntiAliasing: false, toleranceRatio: 0 },
    summary: { total: 7, changed: 3, new: 1, removed: 1, unchanged: 2 },
    entries: [
      entry('demo-shop-home--desktop--light', 'Home', 'changed', {
        severity: 'major',
        diff: {
          pixels: 64000,
          ratio: 0.0625,
          ssim: 0.81,
          sizeChanged: false,
          regions: [
            { x: 0, y: 0, width: 1280, height: 40, pixels: 51200 },
            { x: 100, y: 300, width: 200, height: 64, pixels: 12800 },
          ],
        },
      }),
      entry('demo-shop-pricing--mobile--dark', 'Pricing', 'changed', {
        severity: 'moderate',
        diff: {
          pixels: 3300,
          ratio: 0.01,
          ssim: 0.97,
          sizeChanged: false,
          regions: [{ x: 10, y: 10, width: 40, height: 20, pixels: 800 }],
        },
      }),
      entry('demo-shop-checkout--desktop--dark', 'Checkout', 'changed', {
        severity: 'minor',
        diff: {
          pixels: 410,
          ratio: 0.0004,
          ssim: 0.998,
          sizeChanged: false,
          regions: [{ x: 5, y: 5, width: 10, height: 10, pixels: 410 }],
        },
      }),
      entry('demo-shop-about--mobile--light', 'About', 'new'),
      entry('demo-shop-gift-cards--desktop--light', 'Gift cards', 'removed'),
      entry('demo-shop-home--mobile--light', 'Home', 'unchanged', {
        diff: { pixels: 0, ratio: 0, ssim: 1, sizeChanged: false, regions: [] },
      }),
      entry('demo-shop-pricing--desktop--light', 'Pricing', 'unchanged', {
        diff: { pixels: 0, ratio: 0, ssim: 1, sizeChanged: false, regions: [] },
      }),
    ],
  });
}

export const REPORT_URL = 'http://localhost/report/report.json';

/** A fetch stub that serves `body` as JSON (or fails the way a server would). */
export function fakeFetch(body: unknown, status = 200): typeof fetch {
  return () =>
    Promise.resolve(
      new Response(typeof body === 'string' ? body : JSON.stringify(body), {
        status,
        headers: { 'content-type': 'application/json' },
      }),
    );
}
