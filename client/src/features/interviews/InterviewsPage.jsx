import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CalendarPlus, ListChecks } from 'lucide-react';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { LoadingState } from '@/components/common/LoadingState';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCategories, useCategoryTitles } from '@/features/categories/hooks';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { cn } from '@/lib/utils';
import { InterviewRow } from './InterviewRow';
import { useInterviews } from './hooks';

const TABS = [
  { value: 'upcoming', label: 'Upcoming', empty: { title: 'Nothing booked yet', description: 'Pick a category and a time slot. It takes under a minute.' } },
  { value: 'completed', label: 'Completed', empty: { title: 'No scorecards yet', description: 'Finish a session and its scorecard will appear here.' } },
  { value: 'cancelled', label: 'Cancelled', empty: { title: 'Nothing cancelled or missed', description: 'Sessions you cancel or miss are kept here for reference.' } },
];

export function Component() {
  useDocumentTitle('My sessions');

  // The filters live in the URL (?status=completed&category=frontend): they survive a refresh, can be bookmarked
  // or shared, and the browser's back button steps through them.
  const [params, setParams] = useSearchParams();
  const status = params.get('status') ?? 'upcoming';
  const category = params.get('category') ?? 'all';

  const filters = useMemo(() => ({ status, ...(category !== 'all' && { category }) }), [status, category]);
  const { data: interviews, isPending, isPlaceholderData, error, refetch } = useInterviews(filters);
  const { data: catalog } = useCategories();
  const titles = useCategoryTitles();

  const setParam = (key, value, fallback) =>
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        if (value === fallback) next.delete(key);
        else next.set(key, value);
        return next;
      },
      { replace: true },
    );

  const tab = TABS.find((t) => t.value === status) ?? TABS[0];

  return (
    <>
      <PageHeader
        title="My sessions"
        description="Everything you have booked, taken or cancelled."
        actions={
          <Button asChild>
            <Link to="/book">
              <CalendarPlus /> Book a session
            </Link>
          </Button>
        }
      />

      <Tabs value={tab.value} onValueChange={(value) => setParam('status', value, 'upcoming')}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <TabsList aria-label="Session status">
            {TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value}>
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="w-56 pb-2">
            <Select value={category} onValueChange={(value) => setParam('category', value, 'all')}>
              <SelectTrigger aria-label="Filter by category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {catalog?.categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <TabsContent value={tab.value}>
          {isPending ? (
            <LoadingState rows={4} label="Loading sessions" />
          ) : error ? (
            <ErrorState error={error} onRetry={refetch} />
          ) : interviews.length === 0 ? (
            <EmptyState
              icon={ListChecks}
              title={tab.empty.title}
              description={tab.empty.description}
              action={
                tab.value !== 'completed' && (
                  <Button asChild>
                    <Link to="/book">Book a session</Link>
                  </Button>
                )
              }
            />
          ) : (
            <ul className={cn('divide-y rounded-xl border bg-card transition-opacity', isPlaceholderData && 'opacity-60')}>
              {interviews.map((interview) => (
                <InterviewRow key={interview.id} interview={interview} categoryTitle={titles[interview.category] ?? interview.category} />
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>
    </>
  );
}
