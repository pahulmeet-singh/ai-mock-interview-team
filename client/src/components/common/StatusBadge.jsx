import { Badge } from '@/components/ui/badge';
import { STATUS } from '@/lib/constants';

export function StatusBadge({ status, className }) {
  const meta = STATUS[status] ?? STATUS.booked;
  return (
    <Badge variant={meta.tone} className={className}>
      {status === 'in_progress' && <span className="size-1.5 animate-pulse rounded-full bg-primary" aria-hidden="true" />}
      {meta.label}
    </Badge>
  );
}
