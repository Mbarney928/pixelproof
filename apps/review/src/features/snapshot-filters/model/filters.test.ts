import { describe, expect, it } from 'vitest';

import { sampleReport } from '@/test/fixtures';

import { applyFilters, DEFAULT_FILTERS, facetValues, filtersFromQuery, filtersToQuery } from './filters';

const entries = sampleReport().entries;

describe('filters', () => {
  it('round-trips through the URL and omits defaults', () => {
    const f = { ...DEFAULT_FILTERS, status: 'changed' as const, theme: 'dark' as const, q: 'price' };
    const query = filtersToQuery(f);
    expect(query).toEqual({ status: 'changed', theme: 'dark', q: 'price' });
    expect(filtersFromQuery(query as Record<string, string>)).toEqual(f);
    expect(filtersToQuery(DEFAULT_FILTERS)).toEqual({});
  });

  it('falls back on unknown or repeated values', () => {
    expect(filtersFromQuery({ status: 'bogus', theme: 'sepia', group: ['A', 'B'] })).toEqual({
      ...DEFAULT_FILTERS,
      group: 'A',
    });
  });

  it('shows what needs review by default', () => {
    expect(applyFilters(entries, DEFAULT_FILTERS).map((e) => e.status)).not.toContain('unchanged');
    expect(applyFilters(entries, { ...DEFAULT_FILTERS, status: 'all' })).toHaveLength(7);
  });

  it('combines status, viewport, theme and search', () => {
    const f = { ...DEFAULT_FILTERS, status: 'changed' as const, viewport: 'mobile', theme: 'dark' as const };
    expect(applyFilters(entries, f).map((e) => e.name)).toEqual(['Pricing']);
    expect(
      applyFilters(entries, { ...DEFAULT_FILTERS, status: 'all', q: 'GIFT' }).map((e) => e.status),
    ).toEqual(['removed']);
    expect(applyFilters(entries, { ...DEFAULT_FILTERS, group: 'Other' })).toEqual([]);
  });

  it('lists facet values once, sorted', () => {
    expect(facetValues(entries)).toEqual({ groups: ['Demo shop'], viewports: ['desktop', 'mobile'] });
  });
});
