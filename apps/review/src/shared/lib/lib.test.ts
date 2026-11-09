import { describe, expect, it } from 'vitest';

import { cn } from './cn';
import { formatDateTime, formatInt, formatPercent } from './format';
import { isTypingTarget } from './useHotkeys';

describe('format', () => {
  it('formats percentages without hiding tiny changes', () => {
    expect(formatPercent(0)).toBe('0%');
    expect(formatPercent(0.00001)).toBe('<0.01%');
    expect(formatPercent(0.0012)).toBe('0.12%');
    expect(formatPercent(0.0456)).toBe('4.6%');
    expect(formatPercent(0.166)).toBe('17%');
  });

  it('formats integers and UTC timestamps', () => {
    expect(formatInt(166321.4)).toBe('166,321');
    expect(formatDateTime('2026-11-09T19:25:00Z')).toBe('Nov 9, 2026, 7:25 PM UTC');
  });

  it('joins class names', () => {
    expect(cn('a', false, undefined, 'b', null)).toBe('a b');
  });
});

describe('isTypingTarget', () => {
  it('is true for text fields and false for buttons and sliders', () => {
    const make = (html: string) => {
      const div = document.createElement('div');
      div.innerHTML = html;
      return div.firstElementChild;
    };
    expect(isTypingTarget(make('<input type="search">'))).toBe(true);
    expect(isTypingTarget(make('<textarea></textarea>'))).toBe(true);
    expect(isTypingTarget(make('<select></select>'))).toBe(true);
    expect(isTypingTarget(make('<input type="range">'))).toBe(false);
    expect(isTypingTarget(make('<button></button>'))).toBe(false);
    expect(isTypingTarget(null)).toBe(false);
  });
});
