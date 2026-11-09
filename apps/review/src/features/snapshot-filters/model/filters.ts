import type { ReportEntry, SnapshotStatus, Theme } from '@pixelproof/core/schema';
import { SNAPSHOT_STATUSES, THEMES } from '@pixelproof/core/schema';
import type { LocationQuery, LocationQueryRaw } from 'vue-router';

export type StatusFilter = SnapshotStatus | 'pending' | 'all';

export interface Filters {
  status: StatusFilter;
  group: string;
  viewport: string;
  theme: Theme | '';
  q: string;
}

export const DEFAULT_FILTERS: Filters = { status: 'pending', group: '', viewport: '', theme: '', q: '' };

const first = (v: LocationQuery[string] | undefined) =>
  (Array.isArray(v) ? (v[0] ?? '') : (v ?? '')).slice(0, 200);

/** Filters live in the URL so a filtered view can be bookmarked or shared. Unknown values fall back. */
export function filtersFromQuery(query: LocationQuery): Filters {
  const status = first(query.status);
  const theme = first(query.theme);
  return {
    status: (['pending', 'all', ...SNAPSHOT_STATUSES] as string[]).includes(status)
      ? (status as StatusFilter)
      : DEFAULT_FILTERS.status,
    group: first(query.group),
    viewport: first(query.viewport),
    theme: (THEMES as readonly string[]).includes(theme) ? (theme as Theme) : '',
    q: first(query.q),
  };
}

export function filtersToQuery(filters: Filters): LocationQueryRaw {
  const query: LocationQueryRaw = {};
  for (const key of Object.keys(DEFAULT_FILTERS) as (keyof Filters)[]) {
    if (filters[key] !== DEFAULT_FILTERS[key]) query[key] = filters[key];
  }
  return query;
}

export function applyFilters(entries: readonly ReportEntry[], f: Filters): ReportEntry[] {
  const q = f.q.trim().toLowerCase();
  return entries.filter(
    (e) =>
      (f.status === 'all' || (f.status === 'pending' ? e.status !== 'unchanged' : e.status === f.status)) &&
      (!f.group || e.group === f.group) &&
      (!f.viewport || e.viewport.name === f.viewport) &&
      (!f.theme || e.theme === f.theme) &&
      (!q || `${e.group} ${e.name} ${e.id}`.toLowerCase().includes(q)),
  );
}

export function facetValues(entries: readonly ReportEntry[]) {
  const unique = (values: string[]) => [...new Set(values)].sort((a, b) => a.localeCompare(b));
  return {
    groups: unique(entries.map((e) => e.group)),
    viewports: unique(entries.map((e) => e.viewport.name)),
  };
}
