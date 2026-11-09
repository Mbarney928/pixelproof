import { describe, expect, it } from 'vitest';

import { niceMax } from './scale';

describe('niceMax', () => {
  it('rounds up to a readable axis end', () => {
    expect(niceMax(0.166)).toBeCloseTo(0.2);
    expect(niceMax(0.047)).toBeCloseTo(0.05);
    expect(niceMax(0.0019)).toBeCloseTo(0.002);
    expect(niceMax(0.022)).toBeCloseTo(0.025);
    expect(niceMax(1)).toBe(1);
    expect(niceMax(0)).toBe(1);
  });
});
