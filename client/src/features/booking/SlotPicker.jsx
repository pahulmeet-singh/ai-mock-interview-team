import { memo } from 'react';
import { dayNumberOf, formatTime, longDayOf, monthOf, tzLabel, weekdayOf } from '@/lib/format';
import { cn } from '@/lib/utils';

function DateStrip({ days, activeDate, onChange }) {
  return (
    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2" role="group" aria-label="Choose a day">
      {days.map((day) => {
        const open = day.slots.filter((slot) => slot.status === 'open').length;
        const active = day.date === activeDate;
        return (
          <button
            key={day.date}
            type="button"
            onClick={() => onChange(day.date)}
            aria-pressed={active}
            aria-label={`${longDayOf(day.date)}, ${open} ${open === 1 ? 'slot' : 'slots'} open`}
            className={cn(
              'flex w-[4.5rem] shrink-0 flex-col items-center rounded-lg border px-2 py-2.5 transition-colors',
              active ? 'border-primary bg-primary/10' : 'hover:border-ring/50',
              open === 0 && !active && 'opacity-45',
            )}
          >
            <span className="text-xs text-muted-foreground">{weekdayOf(day.date)}</span>
            <span className="tabular font-display text-2xl font-semibold leading-tight">{dayNumberOf(day.date)}</span>
            <span className="text-xs text-muted-foreground">{monthOf(day.date)}</span>
          </button>
        );
      })}
    </div>
  );
}

// memo: when you pick a slot, only the two buttons whose `selected` flag changed re-render, not all eight.
// That relies on onSelect being a stable reference (see useCallback in BookingPage) and on React Query
// keeping unchanged slot objects referentially equal between refetches.
const SlotButton = memo(function SlotButton({ slot, selected, onSelect }) {
  const taken = slot.status === 'taken';
  const mine = slot.status === 'mine';
  return (
    <button
      type="button"
      disabled={taken || mine}
      aria-pressed={selected}
      onClick={() => onSelect(slot.startsAt)}
      className={cn(
        'flex h-14 flex-col items-center justify-center rounded-lg border text-sm transition-colors',
        selected ? 'border-primary bg-primary text-primary-foreground' : 'hover:border-primary/60 hover:bg-accent/50',
        taken && 'cursor-not-allowed border-dashed bg-muted/40 text-muted-foreground/60 hover:border-border hover:bg-muted/40',
        mine && 'cursor-not-allowed border-primary/40 text-primary hover:border-primary/40 hover:bg-transparent',
      )}
    >
      <span className={cn('tabular font-medium', taken && 'line-through')}>{formatTime(slot.startsAt)}</span>
      {taken && <span className="text-[11px]">Taken</span>}
      {mine && <span className="text-[11px]">Yours</span>}
    </button>
  );
});

export const SlotGrid = memo(function SlotGrid({ slots, value, onSelect }) {
  if (slots.length === 0) return <p className="mt-4 text-sm text-muted-foreground">No slots on this day.</p>;
  return (
    <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4" role="group" aria-label="Available times">
      {slots.map((slot) => (
        <SlotButton key={slot.startsAt} slot={slot} selected={slot.startsAt === value} onSelect={onSelect} />
      ))}
    </div>
  );
});

export function SlotPicker({ days, activeDate, onDateChange, value, onSelect, slotMinutes }) {
  const activeDay = days.find((day) => day.date === activeDate);
  return (
    <div>
      <DateStrip days={days} activeDate={activeDate} onChange={onDateChange} />
      <SlotGrid slots={activeDay?.slots ?? []} value={value} onSelect={onSelect} />
      <p className="mt-3 text-xs text-muted-foreground">
        Times are in {tzLabel()}. Each slot is {slotMinutes} minutes.
      </p>
    </div>
  );
}
