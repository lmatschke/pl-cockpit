import { describe, expect, it } from 'vitest';
import { formatDate } from './date.js';

describe('formatDate', () => {
  it('formats an ISO date as TT.MM.JJJJ', () => {
    expect(formatDate('2026-11-14')).toBe('14.11.2026');
    expect(formatDate('2027-01-05')).toBe('05.01.2027');
  });

  it('formats the date part of an ISO timestamp', () => {
    expect(formatDate('2026-03-09T08:15:00.000Z')).toBe('09.03.2026');
  });

  it('returns an empty string for empty or invalid input', () => {
    expect(formatDate(null)).toBe('');
    expect(formatDate(undefined)).toBe('');
    expect(formatDate('')).toBe('');
    expect(formatDate('kein datum')).toBe('');
  });
});
