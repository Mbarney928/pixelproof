const integer = new Intl.NumberFormat('en-US');

export function formatInt(n: number): string {
  return integer.format(Math.round(n));
}

/** 0.0123 → "1.23%"; tiny non-zero values never round down to "0%". */
export function formatPercent(ratio: number): string {
  const pct = ratio * 100;
  if (pct === 0) return '0%';
  if (pct < 0.01) return '<0.01%';
  if (pct < 1) return `${pct.toFixed(2)}%`;
  if (pct < 10) return `${pct.toFixed(1)}%`;
  return `${Math.round(pct)}%`;
}

export function formatDateTime(iso: string): string {
  return (
    new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }).format(
      new Date(iso),
    ) + ' UTC'
  );
}
