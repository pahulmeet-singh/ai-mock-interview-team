import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, LoaderCircle } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { ErrorState } from '@/components/common/ErrorState';
import { FormError } from '@/components/common/FormError';
import { Logo } from '@/components/common/Logo';
import { Splash } from '@/components/common/Splash';
import { Button } from '@/components/ui/button';
import { useCategoryTitles } from '@/features/categories/hooks';
import { useInterview } from '@/features/interviews/hooks';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useEventListener } from '@/hooks/useEventListener';
import { DIFFICULTY_LABEL } from '@/lib/constants';
import { useSessionStore } from '@/stores/sessionStore';
import { AnswerEditor } from './AnswerEditor';
import { QuestionNav } from './QuestionNav';
import { SessionTimer } from './SessionTimer';
import { useAutosave, useSessionClock, useSubmitSession } from './hooks';

function ScoringOverlay() {
  return (
    <div role="status" aria-live="polite" className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-background/95 px-6 text-center">
      <LoaderCircle className="size-8 animate-spin text-primary" aria-hidden="true" />
      <div>
        <p className="font-display text-2xl font-semibold">Scoring your answers</p>
        <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">The interviewer is reading every answer. This usually takes 10 to 30 seconds, so please keep this tab open.</p>
      </div>
    </div>
  );
}

function SessionRoom({ interview }) {
  const titles = useCategoryTitles();
  const begin = useSessionStore((state) => state.begin);
  const ready = useSessionStore((state) => state.interviewId === interview.id);
  const currentIndex = useSessionStore((state) => state.currentIndex);
  const goTo = useSessionStore((state) => state.goTo);
  const answers = useSessionStore((state) => state.answers);
  const remaining = useSessionStore((state) => state.remainingSeconds);
  const { mutate: submitAnswers, isPending, isError, error } = useSubmitSession(interview.id);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const autoSubmitted = useRef(false);

  const { questions } = interview;
  const endsAtMs = Date.parse(interview.endsAt);

  // Seed the store from the server copy once. If this interview is already in the store, begin() keeps the local text.
  useEffect(() => {
    begin({ interviewId: interview.id, questionCount: questions.length, endsAt: endsAtMs, answers: interview.answers });
  }, [begin, interview.id, interview.answers, questions.length, endsAtMs]);

  useSessionClock();
  useAutosave(interview.id);

  // Leaving with unsaved text triggers the browser's own "Leave site?" prompt.
  useEventListener('beforeunload', (event) => {
    if (useSessionStore.getState().dirty) {
      event.preventDefault();
      event.returnValue = '';
    }
  });

  // When the clock hits zero, submit whatever has been typed. The ref makes sure this happens exactly once.
  useEffect(() => {
    if (ready && remaining === 0 && !autoSubmitted.current) {
      autoSubmitted.current = true;
      toast.info('Time is up. Submitting your answers.');
      submitAnswers(useSessionStore.getState().answers);
    }
  }, [ready, remaining, submitAnswers]);

  if (!ready) return <Splash />;

  const total = questions.length;
  const answeredCount = questions.filter((_, index) => answers[index]?.trim()).length;
  const question = questions[currentIndex] ?? questions[0];
  const isLast = currentIndex === total - 1;
  const title = titles[interview.category] ?? interview.category;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-5">
          <Logo showWordmark={false} className="max-sm:hidden" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{title}</p>
            <p className="text-xs text-muted-foreground">
              {DIFFICULTY_LABEL[interview.difficulty]} level, {answeredCount} of {total} answered
            </p>
          </div>
          <SessionTimer />
          <Button onClick={() => setConfirmOpen(true)} disabled={isPending}>
            Submit
          </Button>
        </div>
        <div className="h-0.5 bg-muted" role="progressbar" aria-label="Questions answered" aria-valuemin={0} aria-valuemax={total} aria-valuenow={answeredCount}>
          <div className="h-full bg-primary transition-[width] duration-300" style={{ width: `${(answeredCount / total) * 100}%` }} />
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-6xl flex-1 gap-8 px-5 py-8 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-14 lg:py-12">
        <QuestionNav questions={questions} answers={answers} currentIndex={currentIndex} onSelect={goTo} />

        <section aria-labelledby="question-heading" className="min-w-0 max-w-3xl">
          {remaining === 0 && answeredCount === 0 && (
            <div role="alert" className="mb-8 rounded-xl border border-destructive/30 bg-destructive/5 p-5">
              <p className="font-medium text-destructive">Time ran out before any answers were saved</p>
              <p className="mt-1 text-sm text-muted-foreground">This session cannot be scored. Book a new slot to try again.</p>
              <Button asChild variant="outline" size="sm" className="mt-3">
                <Link to="/book">Book a session</Link>
              </Button>
            </div>
          )}
          {isError && (
            <div className="mb-8 space-y-3">
              <FormError message={`${error.message} Your answers are saved, so you can try again.`} />
              <Button variant="outline" size="sm" onClick={() => submitAnswers(useSessionStore.getState().answers)}>
                Try scoring again
              </Button>
            </div>
          )}

          <p className="text-sm text-muted-foreground">
            Question {currentIndex + 1} of {total}
            <span className="ml-3 rounded-md bg-muted px-2 py-0.5 text-xs">{question.topic}</span>
          </p>
          <h1 id="question-heading" className="mt-3 font-display text-2xl font-semibold leading-snug sm:text-3xl">
            {question.prompt}
          </h1>

          <div className="mt-8">
            <AnswerEditor key={currentIndex} index={currentIndex} />
          </div>

          <div className="mt-8 flex items-center justify-between">
            <Button variant="outline" onClick={() => goTo(currentIndex - 1)} disabled={currentIndex === 0}>
              <ChevronLeft /> Previous
            </Button>
            {isLast ? (
              <Button onClick={() => setConfirmOpen(true)} disabled={isPending}>
                Review and submit
              </Button>
            ) : (
              <Button onClick={() => goTo(currentIndex + 1)}>
                Next question <ChevronRight />
              </Button>
            )}
          </div>
        </section>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Submit your answers?"
        description={
          answeredCount === total
            ? 'You have answered every question. Once submitted you cannot change your answers.'
            : `You have answered ${answeredCount} of ${total} questions. Unanswered questions score zero, and you cannot change your answers after submitting.`
        }
        confirmLabel="Submit and get feedback"
        cancelLabel="Keep working"
        onConfirm={() => {
          setConfirmOpen(false);
          submitAnswers(useSessionStore.getState().answers);
        }}
      />
      {isPending && <ScoringOverlay />}
    </div>
  );
}

export function Component() {
  const { id } = useParams();
  // No refetch on window focus here: a refetch mid-session must never disturb what the user is typing.
  const { data: interview, isPending, error, refetch } = useInterview(id, { refetchOnWindowFocus: false });
  useDocumentTitle('Live session');

  if (isPending) return <Splash />;
  if (error) {
    return (
      <div className="mx-auto max-w-xl px-6 py-16">
        <ErrorState error={error} onRetry={refetch} title="We couldn't open this session" />
      </div>
    );
  }
  if (interview.status === 'completed') return <Navigate to={`/interviews/${id}/feedback`} replace />;
  if (interview.status !== 'in_progress') return <Navigate to={`/interviews/${id}`} replace />;
  return <SessionRoom interview={interview} />;
}
