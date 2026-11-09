import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CalendarPlus, ChevronLeft, FileText, Play } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { ErrorState } from '@/components/common/ErrorState';
import { PageLoading } from '@/components/common/LoadingState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { useCategoryTitles } from '@/features/categories/hooks';
import { useCountdown } from '@/hooks/useCountdown';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { DIFFICULTY_LABEL, TONE_TEXT, scoreTone } from '@/lib/constants';
import { toastError } from '@/lib/errors';
import { formatCountdown, formatDateTime, formatScore, tzLabel } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useCancelInterview, useInterview, useStartSession } from './hooks';

function Fact({ label, children }) {
  return (
    <div className="py-3.5 sm:grid sm:grid-cols-[10rem_1fr] sm:gap-4">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium sm:mt-0">{children}</dd>
    </div>
  );
}

export function Component() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: interview, isPending, error, refetch } = useInterview(id);
  const titles = useCategoryTitles();
  const cancel = useCancelInterview();
  const start = useStartSession();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const untilStart = useCountdown(interview?.scheduledAt);
  const untilOpen = useCountdown(interview?.opensAt);

  const title = interview ? (titles[interview.category] ?? interview.category) : 'Session';
  useDocumentTitle(title);

  if (isPending) return <PageLoading />;
  if (error) return <ErrorState error={error} onRetry={refetch} title="We couldn't load this session" />;

  const onStart = () => start.mutate(id, { onSuccess: () => navigate(`/interviews/${id}/session`), onError: (err) => toastError(err) });
  const onCancel = () =>
    cancel.mutate(id, {
      onSuccess: () => {
        setConfirmOpen(false);
        toast.success('Session cancelled. The slot is free again.');
      },
      onError: (err) => {
        setConfirmOpen(false);
        toastError(err);
      },
    });

  const { status } = interview;
  const score = interview.feedback?.overallScore;

  return (
    <>
      <Link to="/interviews" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground">
        <ChevronLeft className="size-4" aria-hidden="true" /> My sessions
      </Link>

      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold leading-tight">{title}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{DIFFICULTY_LABEL[interview.difficulty]} level</p>
        </div>
        <StatusBadge status={status} className="mt-1.5" />
      </header>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_21rem]">
        <dl className="h-fit divide-y rounded-xl border bg-card px-5">
          <Fact label="When">
            {formatDateTime(interview.scheduledAt)} <span className="font-normal text-muted-foreground">{tzLabel()}</span>
          </Fact>
          <Fact label="Length">{interview.durationMinutes} minutes</Fact>
          <Fact label="Questions">Written by the AI when you start</Fact>
          <Fact label="Resume">
            {interview.resume ? (
              <span className="inline-flex items-center gap-1.5">
                <FileText className="size-4 text-muted-foreground" aria-hidden="true" /> {interview.resume.fileName}
              </span>
            ) : (
              <span className="font-normal text-muted-foreground">None attached</span>
            )}
          </Fact>
        </dl>

        <aside className="h-fit rounded-xl border bg-card p-5" aria-label="Session actions">
          {status === 'booked' && (
            <>
              <h2 className="font-display text-lg font-semibold">{interview.canStart ? 'Ready when you are' : 'Not open yet'}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {interview.canStart
                  ? `You will get a set of questions and ${interview.durationMinutes} minutes to answer them. Your answers save as you type.`
                  : `This session opens ${formatDateTime(interview.opensAt)}, in ${formatCountdown(untilOpen)}.`}
              </p>
              {untilStart > 0 && <p className="mt-3 text-sm">Slot starts in <span className="tabular font-medium">{formatCountdown(untilStart)}</span></p>}
              <Button className="mt-5 w-full" disabled={!interview.canStart} loading={start.isPending} onClick={onStart}>
                <Play /> {start.isPending ? 'Writing your questions' : 'Start session'}
              </Button>
              <Button variant="ghost" className="mt-2 w-full text-muted-foreground" onClick={() => setConfirmOpen(true)}>
                Cancel this booking
              </Button>
            </>
          )}

          {status === 'in_progress' && (
            <>
              <h2 className="font-display text-lg font-semibold">Session in progress</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">Your answers are saved. Pick up where you left off.</p>
              <Button className="mt-5 w-full" onClick={() => navigate(`/interviews/${id}/session`)}>
                <Play /> Resume session
              </Button>
            </>
          )}

          {status === 'completed' && (
            <>
              <h2 className="font-display text-lg font-semibold">Scorecard ready</h2>
              {score !== undefined && (
                <p className="mt-2">
                  <span className={cn('tabular font-display text-4xl font-semibold', TONE_TEXT[scoreTone(score)])}>{formatScore(score)}</span>
                  <span className="ml-1.5 text-sm text-muted-foreground">out of 10</span>
                </p>
              )}
              <Button asChild className="mt-5 w-full">
                <Link to={`/interviews/${id}/feedback`}>View scorecard</Link>
              </Button>
            </>
          )}

          {(status === 'cancelled' || status === 'missed') && (
            <>
              <h2 className="font-display text-lg font-semibold">{status === 'missed' ? 'You missed this slot' : 'This booking was cancelled'}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">Book another time whenever you are ready.</p>
              <Button asChild className="mt-5 w-full">
                <Link to={`/book?category=${interview.category}`}>
                  <CalendarPlus /> Book another time
                </Link>
              </Button>
            </>
          )}
        </aside>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Cancel this booking?"
        description={`Your ${formatDateTime(interview.scheduledAt)} slot will be released for someone else. You can book again at any time.`}
        confirmLabel="Cancel booking"
        destructive
        pending={cancel.isPending}
        onConfirm={onCancel}
      />
    </>
  );
}
