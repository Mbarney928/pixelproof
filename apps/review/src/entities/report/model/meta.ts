import type { ReportEntry, Severity, SnapshotStatus } from '@pixelproof/core/schema';

import type { BadgeTone } from '@/shared/ui';

/** Status always renders as icon + label + tone, so it never relies on colour alone. */
export const STATUS_META: Record<
  SnapshotStatus,
  { label: string; tone: BadgeTone; icon: string; hint: string }
> = {
  changed: { label: 'Changed', tone: 'warning', icon: '◐', hint: 'Differs from the approved baseline' },
  new: { label: 'New', tone: 'info', icon: '✚', hint: 'No baseline yet' },
  removed: { label: 'Removed', tone: 'critical', icon: '✖', hint: 'In the baseline but no longer captured' },
  unchanged: { label: 'Unchanged', tone: 'good', icon: '✓', hint: 'Matches the baseline' },
};

export const SEVERITY_META: Record<Severity, { label: string; tone: BadgeTone; icon: string }> = {
  major: { label: 'Major', tone: 'critical', icon: '▲▲' },
  moderate: { label: 'Moderate', tone: 'warning', icon: '▲' },
  minor: { label: 'Minor', tone: 'neutral', icon: '▽' },
  none: { label: 'None', tone: 'neutral', icon: '·' },
};

/** Entries that need a human decision. */
export function isPending(entry: ReportEntry): boolean {
  return entry.status !== 'unchanged';
}

export function describeEntry(entry: ReportEntry): string {
  return `${entry.group} / ${entry.name}, ${entry.viewport.name} ${entry.viewport.width}px, ${entry.theme}`;
}
