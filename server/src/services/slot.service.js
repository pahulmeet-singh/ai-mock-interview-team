import { env } from '../config/env.js';

// Slots are generated from working hours, not stored: only *booked* slots exist in the database.
// All wall-clock maths is done with Intl so no date library is needed and daylight saving is respected.

const formatters = new Map();
function zonedParts(date, timeZone) {
  if (!formatters.has(timeZone)) {
    formatters.set(
      timeZone,
      new Intl.DateTimeFormat('en-US', {
        timeZone,
        hourCycle: 'h23',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
    );
  }
  const parts = Object.fromEntries(formatters.get(timeZone).formatToParts(date).map((p) => [p.type, p.value]));
  return { year: +parts.year, month: +parts.month, day: +parts.day, hour: +parts.hour % 24, minute: +parts.minute, second: +parts.second };
}

// How far ahead of UTC the zone's wall clock is at this instant.
function offsetMs(date, timeZone) {
  const p = zonedParts(date, timeZone);
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - Math.floor(date.getTime() / 1000) * 1000;
}

// Convert a wall-clock time in `timeZone` to the UTC instant it refers to.
export function zonedTimeToUtc({ year, month, day, hour = 0, minute = 0 }, timeZone) {
  const asIfUtc = Date.UTC(year, month - 1, day, hour, minute);
  const guess = asIfUtc - offsetMs(new Date(asIfUtc), timeZone);
  return new Date(asIfUtc - offsetMs(new Date(guess), timeZone));
}

const pad = (n) => String(n).padStart(2, '0');

export const slotConfig = Object.freeze({
  tz: env.SLOT_TZ,
  startHour: env.SLOT_START_HOUR,
  endHour: env.SLOT_END_HOUR,
  slotMinutes: env.SLOT_MINUTES,
  daysAhead: env.SLOT_DAYS_AHEAD,
  leadMinutes: env.SLOT_LEAD_MINUTES,
});

// Returns [{ date: 'YYYY-MM-DD', slots: [ISO start, ...] }] for the booking window, skipping slots that are too soon.
export function generateSlots(now = new Date(), config = slotConfig) {
  const { tz, startHour, endHour, slotMinutes, daysAhead, leadMinutes } = config;
  const earliest = now.getTime() + leadMinutes * 60_000;
  const today = zonedParts(now, tz);
  const days = [];

  for (let offset = 0; offset < daysAhead; offset++) {
    const day = new Date(Date.UTC(today.year, today.month - 1, today.day + offset)); // calendar arithmetic only
    const [year, month, date] = [day.getUTCFullYear(), day.getUTCMonth() + 1, day.getUTCDate()];
    const slots = [];
    for (let minutes = startHour * 60; minutes + slotMinutes <= endHour * 60; minutes += slotMinutes) {
      const startsAt = zonedTimeToUtc({ year, month, day: date, hour: Math.floor(minutes / 60), minute: minutes % 60 }, tz);
      if (startsAt.getTime() >= earliest) slots.push(startsAt.toISOString());
    }
    if (slots.length) days.push({ date: `${year}-${pad(month)}-${pad(date)}`, slots });
  }
  return days;
}

export function isBookableSlot(iso, now = new Date()) {
  const normalized = new Date(iso).toISOString();
  return generateSlots(now).some((day) => day.slots.includes(normalized));
}
