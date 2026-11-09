import { TONE_BG, TONE_TEXT, scoreTone } from '@/lib/constants';
import { formatScore } from '@/lib/format';
import { cn } from '@/lib/utils';

// One line of the scorecard: a criterion, ten ticks filled to the score, and the number.
// The ticks fill in left to right, staggered by `index`, the one piece of motion in the app.
export function RubricRow({ label, hint, value, index = 0, className }) {
  const tone = scoreTone(value);
  return (
    <div className={cn('grid grid-cols-[minmax(0,12rem)_1fr_3rem] items-center gap-x-5 gap-y-2 py-3 max-sm:grid-cols-[1fr_auto]', className)}>
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      <div className="flex gap-1 max-sm:order-last max-sm:col-span-2" role="img" aria-label={`${label}: ${formatScore(value)} out of 10`}>
        {Array.from({ length: 10 }, (_, i) => (
          <span key={i} className="relative h-2.5 flex-1 overflow-hidden rounded-[3px] bg-muted">
            <span
              className={cn('absolute inset-y-0 left-0 origin-left animate-tick-in rounded-[3px]', TONE_BG[tone])}
              style={{ width: `${Math.max(0, Math.min(1, value - i)) * 100}%`, animationDelay: `${index * 90 + i * 35}ms` }}
            />
          </span>
        ))}
      </div>
      <span className={cn('tabular text-right font-display text-lg font-semibold', TONE_TEXT[tone])}>{formatScore(value)}</span>
    </div>
  );
}
