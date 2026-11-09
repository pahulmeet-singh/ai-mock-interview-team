import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// Skeleton rows that keep the page's shape while data loads, so nothing jumps when it arrives.
export function LoadingState({ rows = 3, rowClassName = 'h-16', label = 'Loading', className }) {
  return (
    <div role="status" aria-live="polite" className={cn('space-y-3', className)}>
      <span className="sr-only">{label}</span>
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className={cn('w-full', rowClassName)} />
      ))}
    </div>
  );
}

export function PageLoading() {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">Loading page</span>
      <Skeleton className="h-9 w-64" />
      <Skeleton className="mt-3 h-4 w-96 max-w-full" />
      <div className="mt-10 space-y-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    </div>
  );
}
