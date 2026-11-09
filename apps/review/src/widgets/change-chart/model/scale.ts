/** Rounds `max` up to a readable axis end: 1, 2, 2.5 or 5 × 10ⁿ. */
export function niceMax(max: number): number {
  if (max <= 0) return 1;
  const exp = Math.floor(Math.log10(max));
  const base = 10 ** exp;
  for (const step of [1, 2, 2.5, 5, 10]) {
    if (step * base >= max) return step * base;
  }
  return 10 * base;
}
