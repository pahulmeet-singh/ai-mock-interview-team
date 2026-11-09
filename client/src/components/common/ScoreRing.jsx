import { TONE_STROKE, scoreTone } from '@/lib/constants';
import { formatScore } from '@/lib/format';
import { cn } from '@/lib/utils';

export function ScoreRing({ value, size = 112, stroke = 9, caption = 'out of 10', className }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const fraction = Math.max(0, Math.min(10, value)) / 10;
  const common = { cx: size / 2, cy: size / 2, r: radius, fill: 'none', strokeWidth: stroke };

  return (
    <div
      className={cn('relative inline-flex shrink-0 items-center justify-center', className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Overall score ${formatScore(value)} out of 10`}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle {...common} className="stroke-muted" />
        <circle
          {...common}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - fraction)}
          className={cn(TONE_STROKE[scoreTone(value)], 'transition-[stroke-dashoffset] duration-700')}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="tabular font-display text-3xl font-semibold leading-none">{formatScore(value)}</span>
        <span className="mt-1 text-xs text-muted-foreground">{caption}</span>
      </div>
    </div>
  );
}
