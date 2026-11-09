import { describe, expect, it } from 'vitest';
import { countWords, formatBytes, formatClock, formatCountdown, formatDateTime, formatScore } from './format';

describe('format helpers', () => {
  it('formats countdowns at every scale', () => {
    expect(formatCountdown(0)).toBe('now');
    expect(formatCountdown(93_000)).toBe('1m 33s');
    expect(formatCountdown(12 * 60_000)).toBe('12m');
    expect(formatCountdown(7_500_000)).toBe('2h 5m');
    expect(formatCountdown(200_000_000)).toBe('2d 7h');
  });

  it('formats the session clock and scores', () => {
    expect(formatClock(754)).toBe('12:34');
    expect(formatClock(-3)).toBe('00:00');
    expect(formatScore(7)).toBe('7.0');
    expect(formatScore(Number.NaN)).toBe('-');
  });

  it('renders slot times in the platform time zone, whatever the computer clock says', () => {
    expect(formatDateTime('2026-10-31T04:30:00.000Z')).toMatch(/Sat.*31 Oct.*10:00 am/);
  });

  it('counts words and formats file sizes', () => {
    expect(countWords('  one   two\nthree ')).toBe(3);
    expect(countWords('')).toBe(0);
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(2 * 1024 * 1024)).toBe('2.0 MB');
  });
});
