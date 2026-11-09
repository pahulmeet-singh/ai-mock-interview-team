import { describe, expect, it } from 'vitest';
import { generateSlots, isBookableSlot, zonedTimeToUtc } from './slot.service.js';

const IST = { tz: 'Asia/Kolkata', startHour: 10, endHour: 18, slotMinutes: 60, daysAhead: 14, leadMinutes: 30 };

describe('zonedTimeToUtc', () => {
  it('converts IST wall-clock time (UTC+5:30, no daylight saving)', () => {
    expect(zonedTimeToUtc({ year: 2026, month: 10, day: 30, hour: 10 }, 'Asia/Kolkata').toISOString()).toBe('2026-10-30T04:30:00.000Z');
  });

  it('respects daylight saving changes', () => {
    // US clocks jump forward on 8 March 2026, so 10:00 New York is UTC-5 the day before and UTC-4 that day.
    expect(zonedTimeToUtc({ year: 2026, month: 3, day: 7, hour: 10 }, 'America/New_York').toISOString()).toBe('2026-03-07T15:00:00.000Z');
    expect(zonedTimeToUtc({ year: 2026, month: 3, day: 8, hour: 10 }, 'America/New_York').toISOString()).toBe('2026-03-08T14:00:00.000Z');
  });
});

describe('generateSlots', () => {
  const now = new Date('2026-10-29T12:00:00Z'); // 17:30 in India

  it('skips slots that start sooner than the lead time', () => {
    const days = generateSlots(now, IST);
    expect(days[0].date).toBe('2026-10-30'); // nothing bookable is left today
    expect(days[0].slots).toHaveLength(8); // 10:00 to 17:00 starts
    expect(days[0].slots[0]).toBe('2026-10-30T04:30:00.000Z');
  });

  it('never returns a past slot and stays inside the window', () => {
    const days = generateSlots(now, IST);
    const all = days.flatMap((d) => d.slots);
    expect(all.every((iso) => new Date(iso) >= now)).toBe(true);
    expect(days.length).toBeLessThanOrEqual(IST.daysAhead);
  });

  it('keeps a partly-elapsed day with only its later slots', () => {
    const morning = generateSlots(new Date('2026-10-29T05:00:00Z'), IST); // 10:30 IST
    expect(morning[0].date).toBe('2026-10-29');
    expect(morning[0].slots[0]).toBe('2026-10-29T05:30:00.000Z'); // 11:00 IST: starts exactly at the 30-minute lead time
  });
});

describe('isBookableSlot', () => {
  const now = new Date('2026-10-29T12:00:00Z');
  it('accepts generated slots and rejects anything else', () => {
    expect(isBookableSlot('2026-10-30T04:30:00.000Z', now)).toBe(true);
    expect(isBookableSlot('2026-10-30T04:35:00.000Z', now)).toBe(false); // off the grid
    expect(isBookableSlot('2020-01-01T04:30:00.000Z', now)).toBe(false); // in the past
  });
});
