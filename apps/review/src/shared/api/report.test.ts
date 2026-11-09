import { describe, expect, it } from 'vitest';

import { fakeFetch, REPORT_URL, sampleReport } from '@/test/fixtures';

import { fetchReport, imageUrl, ReportError, resolveReportUrl } from './report';

const APP = 'https://example.github.io/pixelproof/index.html';

describe('resolveReportUrl', () => {
  it('defaults to report/report.json next to the app', () => {
    expect(resolveReportUrl('', APP)).toBe('https://example.github.io/pixelproof/report/report.json');
  });

  it('accepts other relative report paths', () => {
    expect(resolveReportUrl('?report=runs/42/report.json', APP)).toBe(
      'https://example.github.io/pixelproof/runs/42/report.json',
    );
  });

  it('refuses locations outside the app', () => {
    for (const bad of [
      'https://evil.example/report.json',
      '//evil.example/report.json',
      '../secrets/report.json',
      '/etc/report.json',
      'report.txt',
      'javascript:alert(1)//.json',
    ]) {
      expect(() => resolveReportUrl(`?report=${encodeURIComponent(bad)}`, APP)).toThrow(ReportError);
    }
  });
});

describe('fetchReport', () => {
  it('returns a validated report', async () => {
    const report = await fetchReport(REPORT_URL, fakeFetch(sampleReport()));
    expect(report.summary.total).toBe(7);
  });

  it('maps failures to clear, typed errors', async () => {
    const codeOf = async (f: typeof fetch) => {
      try {
        await fetchReport(REPORT_URL, f);
      } catch (error) {
        return error instanceof ReportError ? error.code : 'other';
      }
      return 'none';
    };
    expect(await codeOf(fakeFetch({}, 404))).toBe('not_found');
    expect(await codeOf(fakeFetch({}, 500))).toBe('network');
    expect(await codeOf(() => Promise.reject(new TypeError('offline')))).toBe('network');
    expect(await codeOf(fakeFetch('{ nope'))).toBe('invalid');
    expect(await codeOf(fakeFetch({ ...sampleReport(), version: 99 }))).toBe('invalid');
  });
});

describe('imageUrl', () => {
  it('resolves image paths against the report location', () => {
    const entry = sampleReport().entries[0];
    if (!entry) throw new Error('fixture');
    expect(imageUrl(REPORT_URL, entry, 'diff')).toBe(
      'http://localhost/report/diff/demo-shop-home--desktop--light.png',
    );
    const added = sampleReport().entries.find((e) => e.status === 'new');
    if (!added) throw new Error('fixture');
    expect(imageUrl(REPORT_URL, added, 'baseline')).toBeUndefined();
  });
});
