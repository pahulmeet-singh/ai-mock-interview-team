import { APP_NAME } from '@/lib/constants';
import { cn } from '@/lib/utils';

export function Logo({ className, showWordmark = true }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <svg viewBox="0 0 32 32" className="size-8" aria-hidden="true">
        <rect width="32" height="32" rx="9" className="fill-secondary" />
        <path
          d="M8 9.5A2.5 2.5 0 0 1 10.5 7h11A2.5 2.5 0 0 1 24 9.5v8a2.5 2.5 0 0 1-2.5 2.5H15l-4.5 4v-4A2.5 2.5 0 0 1 8 17.5z"
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path d="m12.5 13.6 2.3 2.3 4.7-4.7" fill="none" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {showWordmark && <span className="font-display text-xl font-semibold tracking-tight">{APP_NAME}</span>}
    </span>
  );
}
