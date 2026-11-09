import { describe, expect, it } from 'vitest';

import { createLogger } from './logger.js';

describe('logger', () => {
  it('writes JSON lines with fields and drops undefined values', () => {
    const lines: string[] = [];
    const log = createLogger({
      format: 'json',
      write: (l) => lines.push(l),
      now: () => new Date('2026-11-09T10:00:00Z'),
    });
    log.info('Captured', { count: 3, skipped: undefined });
    expect(JSON.parse(lines[0] ?? '')).toEqual({
      time: '2026-11-09T10:00:00.000Z',
      level: 'info',
      msg: 'Captured',
      count: 3,
    });
  });

  it('filters by level and formats for people', () => {
    const lines: string[] = [];
    const log = createLogger({ level: 'warn', write: (l) => lines.push(l) });
    log.debug('hidden');
    log.info('hidden');
    log.warn('Flaky', { id: 'a' });
    log.error('Broken');
    expect(lines).toEqual(['! Flaky  id=a', '✗ Broken']);
  });
});
