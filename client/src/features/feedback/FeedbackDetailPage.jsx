import { Link, useParams } from 'react-router-dom';
import { CalendarPlus, ChevronLeft, CircleCheck, Target } from 'lucide-react';
import { ErrorState } from '@/components/common/ErrorState';
import { PageLoading } from '@/components/common/LoadingState';
import { Button } from '@/components/ui/button';
import { useCategoryTitles } from '@/features/categories/hooks';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { DIFFICULTY_LABEL } from '@/lib/constants';
import { formatDate } from '@/lib/format';
import { PerQuestionList } from './PerQuestionList';
import { Scorecard } from './Scorecard';
import { useInterviewFeedback } from './hooks';

function PointList({ title, icon: Icon, tone, items }) {
  return (
    <section className="rounded-xl border bg-card p-5">
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      <ul className="mt-3 space-y-3">
        {items.map((item) => (
          <li key={item} className="flex gap-3 text-sm leading-relaxed">
            <Icon className={`mt-0.5 size-4 shrink-0 ${tone}`} aria-hidden="true" />
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function Component() {
  const { id } = useParams();
  const { data: feedback, isPending, error, refetch } = useInterviewFeedback(id);
  const titles = useCategoryTitles();

  const category = feedback?.interview?.category;
  const title = category ? (titles[category] ?? category) : 'Scorecard';
  useDocumentTitle(`${title} scorecard`);

  if (isPending) return <PageLoading />;
  if (error) {
    return (
      <div className="max-w-xl space-y-4">
        <ErrorState error={error} onRetry={error.status === 404 ? undefined : refetch} title={error.status === 404 ? 'No scorecard yet' : "We couldn't load this scorecard"} />
        <Button asChild variant="outline">
          <Link to={`/interviews/${id}`}>Back to the session</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <Link to="/interviews?status=completed" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground">
        <ChevronLeft className="size-4" aria-hidden="true" /> My sessions
      </Link>

      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold leading-tight">{title}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {DIFFICULTY_LABEL[feedback.interview.difficulty]} level, scored on {formatDate(feedback.createdAt)}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to={`/book?category=${category}`}>
            <CalendarPlus /> Book this category again
          </Link>
        </Button>
      </header>

      <div className="space-y-8">
        <Scorecard feedback={feedback} />

        <div className="grid gap-6 md:grid-cols-2">
          <PointList title="What went well" icon={CircleCheck} tone="text-success" items={feedback.strengths} />
          <PointList title="What to work on" icon={Target} tone="text-primary" items={feedback.weaknesses} />
        </div>

        <section aria-labelledby="next-steps">
          <h2 id="next-steps" className="mb-3 font-display text-xl font-semibold">
            Next steps
          </h2>
          <ol className="list-decimal space-y-2 rounded-xl border bg-card py-5 pl-10 pr-6 text-sm leading-relaxed marker:text-primary">
            {feedback.recommendations.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="by-question">
          <h2 id="by-question" className="mb-3 font-display text-xl font-semibold">
            Question by question
          </h2>
          <PerQuestionList items={feedback.perQuestion ?? []} />
        </section>

        <p className="text-xs leading-relaxed text-muted-foreground">
          Scored by {feedback.model}. AI feedback can be wrong or too generous, so use it to find things to practise, not as a verdict.
        </p>
      </div>
    </>
  );
}
