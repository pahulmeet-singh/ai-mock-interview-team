import { Timer } from 'lucide-react';
import { formatClock } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useSessionStore } from '@/stores/sessionStore';

// Subscribes to ONE field of the store, so a tick re-renders this component and nothing else.
export function SessionTimer() {
  const remaining = useSessionStore((state) => state.remainingSeconds);
  const low = remaining !== null && remaining <= 300;
  const announcement = remaining === 300 ? '5 minutes remaining' : remaining === 60 ? '1 minute remaining' : '';

  return (
    <>
      <div
        role="timer"
        aria-label="Time remaining"
        className={cn('tabular flex items-center gap-2 rounded-md border px-3 py-1.5 font-display text-lg font-semibold', low ? 'border-destructive/50 text-destructive' : 'border-border')}
      >
        <Timer className="size-4" aria-hidden="true" />
        {formatClock(remaining)}
      </div>
      <span className="sr-only" aria-live="assertive">
        {announcement}
      </span>
    </>
  );
}
