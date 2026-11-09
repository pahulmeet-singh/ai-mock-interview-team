import { Button } from '@/components/ui/button';
import { DIFFICULTY_LABEL } from '@/lib/constants';
import { formatDateTime, tzLabel } from '@/lib/format';
import { cn } from '@/lib/utils';

function Row({ label, value }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={cn('text-right font-medium', !value && 'font-normal text-muted-foreground')}>{value ?? 'Not chosen'}</dd>
    </div>
  );
}

export function BookingSummary({ categoryTitle, difficulty, scheduledAt, slotTaken, resumeName, submitting }) {
  const ready = Boolean(categoryTitle && scheduledAt && !slotTaken);
  return (
    <aside className="h-fit rounded-xl border bg-card p-5 lg:sticky lg:top-8" aria-label="Booking summary">
      <h2 className="font-display text-lg font-semibold">Your booking</h2>
      <dl className="mt-3 divide-y text-sm">
        <Row label="Topic" value={categoryTitle} />
        <Row label="Level" value={DIFFICULTY_LABEL[difficulty]} />
        <Row label="Time" value={scheduledAt ? `${formatDateTime(scheduledAt)} ${tzLabel()}` : undefined} />
        <Row label="Resume" value={resumeName ?? 'None attached'} />
      </dl>
      {slotTaken && <p role="alert" className="mt-3 text-sm text-destructive">Someone just took that slot. Pick another time.</p>}
      <Button type="submit" className="mt-5 w-full" loading={submitting} disabled={!ready}>
        Book this slot
      </Button>
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">You can cancel any time before the session starts.</p>
    </aside>
  );
}
