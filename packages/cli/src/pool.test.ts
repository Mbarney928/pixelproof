import { describe, expect, it } from 'vitest';

import { runPool } from './pool.js';

const tick = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe('runPool', () => {
  it('keeps input order and never exceeds the concurrency limit', async () => {
    let active = 0;
    let peak = 0;
    const results = await runPool([30, 5, 20, 1, 10], 2, async (ms, i) => {
      active++;
      peak = Math.max(peak, active);
      await tick(ms);
      active--;
      return i * 10;
    });
    expect(results).toEqual([0, 10, 20, 30, 40]);
    expect(peak).toBe(2);
  });

  it('stops scheduling after a failure and rejects with it', async () => {
    const started: number[] = [];
    const run = runPool([1, 2, 3, 4, 5], 1, async (n) => {
      started.push(n);
      await tick(1);
      if (n === 2) throw new Error('boom');
      return n;
    });
    await expect(run).rejects.toThrow('boom');
    expect(started).toEqual([1, 2]);
  });

  it('handles an empty list', async () => {
    await expect(runPool([], 4, () => Promise.resolve(1))).resolves.toEqual([]);
  });
});
