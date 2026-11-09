import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { CalendarPlus, ChartNoAxesColumn } from 'lucide-react';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { PageHeader } from '@/components/common/PageHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/AuthContext';
import { useCategoryTitles } from '@/features/categories/hooks';
import { useInterviews } from '@/features/interviews/hooks';
import { useCountdown } from '@/hooks/useCountdown';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { DIFFICULTY_LABEL, TONE_BG, TONE_TEXT, scoreTone } from '@/lib/constants';
import { formatCountdown, formatDate, formatDateTime, formatScore, tzLabel } from '@/lib/format';
import { sortBy } from '@/lib/immutable';
import { cn } from '@/lib/utils';
import { SkillRadar } from './SkillRadar';
import { TrendChart } from './TrendChart';
import { useFeedbackStats } from './hooks';

function NextSession({ interview, title }) {
  const msLeft = useCountdown(interview.scheduledAt, 30_000);
  const live = interview.status === 'in_progress';
  return (
    <section aria-label="Next session" className="mb-8 flex flex-wrap items-center gap-x-8 gap-y-4 rounded-xl border border-l-[3px] border-l-primary bg-card px-6 py-5">
      <div className="min-w-0 flex-1 basis-64">
        <p className="text-sm text-muted-foreground">{live ? 'Session in progress' : 'Next session'}</p>
        <p className="mt-0.5 truncate font-display text-xl font-semibold">{title}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {DIFFICULTY_LABEL[interview.difficulty]} level, {formatDateTime(interview.scheduledAt)} {tzLabel()}
        </p>
      </div>
      {!live && msLeft > 0 && (
        <p className="text-sm text-muted-foreground">
          Starts in <span className="tabular font-display text-lg font-semibold text-foreground">{formatCountdown(msLeft)}</span>
        </p>
      )}
      <Button asChild>
        <Link to={live ? `/interviews/${interview.id}/session` : `/interviews/${interview.id}`}>{live ? 'Resume session' : interview.canStart ? 'Start session' : 'View details'}</Link>
      </Button>
    </section>
  );
}

function Stat({ label, value, sub, valueClassName }) {
  return (
    <div className="border-border px-5 py-4 max-sm:odd:border-r max-sm:[&:nth-child(-n+2)]:border-b sm:border-r sm:px-6 sm:py-5 sm:last:border-r-0">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className={cn('tabular mt-1 truncate font-display text-3xl font-semibold leading-tight', valueClassName)}>{value}</dd>
      {sub && <p className="mt-0.5 text-sm text-muted-foreground">{sub}</p>}
    </div>
  );
}

function Panel({ title, description, children }) {
  return (
    <section className="rounded-xl border bg-card p-5">
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
}

export function Component() {
  useDocumentTitle('Dashboard');
  const { user } = useAuth();
  const titles = useCategoryTitles();
  const { stats, isPending, error, refetch } = useFeedbackStats();
  const upcoming = useInterviews({ status: 'upcoming' });

  // The next session is the earliest upcoming one: derived from the list, so it is always in sync with it.
  const next = useMemo(() => sortBy(upcoming.data ?? [], (i) => i.scheduledAt)[0] ?? null, [upcoming.data]);

  const firstName = user?.name.split(' ')[0];

  return (
    <>
      <PageHeader
        title={`Hello, ${firstName}`}
        description="Your progress across every scored session."
        actions={
          <Button asChild>
            <Link to="/book">
              <CalendarPlus /> Book a session
            </Link>
          </Button>
        }
      />

      {next && <NextSession interview={next} title={titles[next.category] ?? next.category} />}

      {isPending ? (
        <div role="status" aria-live="polite" className="space-y-6">
          <span className="sr-only">Loading your scorecards</span>
          <Skeleton className="h-24 w-full" />
          <div className="grid gap-6 lg:grid-cols-2">
            <Skeleton className="h-80" />
            <Skeleton className="h-80" />
          </div>
        </div>
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : stats.count === 0 ? (
        <EmptyState
          icon={ChartNoAxesColumn}
          title="Your first scorecard will appear here"
          description="Take a session and you will see your scores by criterion, your trend over time and exactly what to practise next."
          action={
            <Button asChild>
              <Link to="/book">Book a session</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-6">
          <dl className="grid grid-cols-2 overflow-hidden rounded-xl border bg-card sm:grid-cols-4">
            <Stat label="Sessions scored" value={stats.count} />
            <Stat label="Average score" value={formatScore(stats.average)} sub="out of 10" valueClassName={TONE_TEXT[scoreTone(stats.average)]} />
            <Stat label="Strongest" value={stats.strongest.label} sub={`${formatScore(stats.strongest.value)} on average`} valueClassName="text-base sm:text-xl" />
            <Stat label="Work on" value={stats.weakest.label} sub={`${formatScore(stats.weakest.value)} on average`} valueClassName="text-base sm:text-xl" />
          </dl>

          <div className="grid gap-6 lg:grid-cols-2">
            <Panel title="Skill profile" description="Average score for each criterion across all sessions.">
              <SkillRadar data={stats.byCriterion} />
            </Panel>
            <Panel title="Score over time" description="Overall score of each session, oldest to newest.">
              <TrendChart trend={stats.trend} />
            </Panel>
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
            <Panel title="By category">
              <ul className="space-y-4">
                {stats.byCategory.map((c) => (
                  <li key={c.category}>
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="truncate font-medium">{c.title}</span>
                      <span className={cn('tabular font-display text-base font-semibold', TONE_TEXT[scoreTone(c.average)])}>{formatScore(c.average)}</span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted" role="img" aria-label={`${c.title}: ${formatScore(c.average)} out of 10 over ${c.count} sessions`}>
                      <div className={cn('h-full rounded-full', TONE_BG[scoreTone(c.average)])} style={{ width: `${c.average * 10}%` }} />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {c.count} {c.count === 1 ? 'session' : 'sessions'}
                    </p>
                  </li>
                ))}
              </ul>
            </Panel>

            <section className="rounded-xl border bg-card" aria-labelledby="recent">
              <h2 id="recent" className="p-5 pb-3 font-display text-lg font-semibold">
                Recent scorecards
              </h2>
              <ul className="divide-y border-t">
                {stats.recent.map((f) => (
                  <li key={f.id}>
                    <Link to={`/interviews/${f.interviewId}/feedback`} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 px-5 py-3.5 transition-colors hover:bg-accent/40">
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">{titles[f.interview.category] ?? f.interview.category}</span>
                        <span className="block text-xs text-muted-foreground">
                          {DIFFICULTY_LABEL[f.interview.difficulty]} level, {formatDate(f.interview.scheduledAt)}
                        </span>
                      </span>
                      <span className={cn('tabular font-display text-lg font-semibold', TONE_TEXT[scoreTone(f.overallScore)])}>{formatScore(f.overallScore)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      )}
    </>
  );
}
