import { CircleAlert, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function ErrorState({ error, onRetry, title = "We couldn't load this", className }) {
  return (
    <div role="alert" className={cn('flex flex-col items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-5', className)}>
      <div className="flex items-center gap-2 text-destructive">
        <CircleAlert className="size-4" aria-hidden="true" />
        <p className="font-medium">{title}</p>
      </div>
      <p className="text-sm text-muted-foreground">{error?.message ?? 'Something went wrong. Please try again.'}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw /> Try again
        </Button>
      )}
    </div>
  );
}
