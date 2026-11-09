import { APP_TIMEZONE } from './constants';

// Every date in the UI is rendered in one platform time zone (APP_TIMEZONE), so a slot reads the same for
// everyone, whatever their laptop's clock says.
const LOCALE = 'en-IN';
const make = (options) => new Intl.DateTimeFormat(LOCALE, { timeZone: APP_TIMEZONE, ...options });

const dateFmt = make({ day: 'numeric', month: 'short', year: 'numeric' });
const dayFmt = make({ weekday: 'short', day: 'numeric', month: 'short' });
const timeFmt = make({ hour: 'numeric', minute: '2-digit' });
const monthFmt = make({ month: 'short', day: 'numeric' });
const keyFmt = new Intl.DateTimeFormat('en-CA', { timeZone: APP_TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit' });

export const formatDate = (iso) => dateFmt.format(new Date(iso));
export const formatDay = (iso) => dayFmt.format(new Date(iso));
export const formatTime = (iso) => timeFmt.format(new Date(iso));
export const formatShortDate = (iso) => monthFmt.format(new Date(iso));
export const formatDateTime = (iso) => `${formatDay(iso)}, ${formatTime(iso)}`;

// 'YYYY-MM-DD' strings from the slots API are calendar dates in the platform zone; format them in UTC to avoid drift.
const utcDay = (dateKey) => new Date(`${dateKey}T12:00:00Z`);
export const weekdayOf = (dateKey) => new Intl.DateTimeFormat(LOCALE, { timeZone: 'UTC', weekday: 'short' }).format(utcDay(dateKey));
export const dayNumberOf = (dateKey) => new Intl.DateTimeFormat(LOCALE, { timeZone: 'UTC', day: 'numeric' }).format(utcDay(dateKey));
export const monthOf = (dateKey) => new Intl.DateTimeFormat(LOCALE, { timeZone: 'UTC', month: 'short' }).format(utcDay(dateKey));
export const longDayOf = (dateKey) =>
  new Intl.DateTimeFormat(LOCALE, { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long' }).format(utcDay(dateKey));
export const todayKey = () => keyFmt.format(new Date());

export function tzLabel() {
  if (APP_TIMEZONE === 'Asia/Kolkata') return 'IST';
  return new Intl.DateTimeFormat('en-US', { timeZone: APP_TIMEZONE, timeZoneName: 'short' }).formatToParts(new Date()).find((p) => p.type === 'timeZoneName')?.value ?? APP_TIMEZONE;
}

// 93_000 ms → "1m 33s"; 7_500_000 → "2h 5m"; 200_000_000 → "2d 7h"
export function formatCountdown(ms) {
  if (ms <= 0) return 'now';
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (days) return `${days}d ${hours}h`;
  if (hours) return `${hours}h ${minutes}m`;
  if (minutes >= 5) return `${minutes}m`;
  return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
}

// 754 → "12:34"
export function formatClock(totalSeconds) {
  const safe = Math.max(0, totalSeconds ?? 0);
  return `${String(Math.floor(safe / 60)).padStart(2, '0')}:${String(safe % 60).padStart(2, '0')}`;
}

export const formatScore = (value) => (Number.isFinite(value) ? value.toFixed(1) : '-');

export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const countWords = (text) => text.trim().split(/\s+/).filter(Boolean).length;
