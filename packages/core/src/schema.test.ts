import { describe, expect, it } from 'vitest';

import { ApprovalsSchema, ReportEntrySchema, snapshotId } from './schema.js';

const entry = {
  id: 'buttons-primary--mobile--dark',
  name: 'Primary',
  group: 'Buttons',
  viewport: { name: 'mobile', width: 375, height: 812 },
  theme: 'dark',
  url: 'http://127.0.0.1:6006/iframe.html?id=buttons--primary',
  status: 'changed',
  severity: 'minor',
  width: 375,
  height: 812,
  images: { baseline: 'baseline/buttons-primary--mobile--dark.png' },
};

describe('snapshotId', () => {
  it('builds stable, safe ids', () => {
    expect(snapshotId('Buttons', 'Primary', 'mobile', 'dark')).toBe('buttons-primary--mobile--dark');
    expect(snapshotId('Café / Menü', 'Größe: L!', 'desktop', 'light')).toBe(
      'cafe-menu-grosse-l--desktop--light',
    );
    expect(snapshotId('***', '', 'tablet', 'light')).toBe('snapshot--tablet--light');
  });
});

describe('report schema', () => {
  it('accepts a valid entry', () => {
    expect(ReportEntrySchema.parse(entry).id).toBe(entry.id);
  });

  it('rejects image paths that escape the report folder', () => {
    for (const bad of [
      '../secrets.png',
      '/etc/passwd',
      'baseline/../../x.png',
      'https://example.com/x.png',
    ]) {
      expect(ReportEntrySchema.safeParse({ ...entry, images: { current: bad } }).success).toBe(false);
    }
  });

  it('rejects unsafe snapshot ids in approvals', () => {
    expect(
      ApprovalsSchema.safeParse({ version: 1, runId: 'r', approved: ['ok-id'], rejected: [] }).success,
    ).toBe(true);
    expect(
      ApprovalsSchema.safeParse({ version: 1, runId: 'r', approved: ['../x'], rejected: [] }).success,
    ).toBe(false);
  });
});
