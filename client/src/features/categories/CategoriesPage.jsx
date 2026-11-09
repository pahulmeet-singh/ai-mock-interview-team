import { memo, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarPlus, Search } from 'lucide-react';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { LoadingState } from '@/components/common/LoadingState';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/hooks/useDebounce';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { getCategoryIcon } from './categoryMeta';
import { useCategories } from './hooks';

// memo: a row re-renders only when its own category changes, not every time the search box does.
const CategoryRow = memo(function CategoryRow({ category }) {
  const Icon = getCategoryIcon(category.id);
  return (
    <li className="grid gap-x-5 gap-y-4 px-5 py-5 sm:grid-cols-[2.75rem_minmax(0,1fr)_auto] sm:items-start">
      <span className="flex size-11 items-center justify-center rounded-lg bg-secondary text-primary">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <h2 className="font-display text-xl font-semibold leading-tight">{category.title}</h2>
        <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted-foreground">{category.summary}</p>
        <ul className="mt-3 flex flex-wrap gap-1.5" aria-label={`Topics in ${category.title}`}>
          {category.topics.map((topic) => (
            <li key={topic} className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
              {topic}
            </li>
          ))}
        </ul>
      </div>
      <Button asChild variant="outline" className="self-start">
        <Link to={`/book?category=${category.id}`}>
          <CalendarPlus /> Book a session
        </Link>
      </Button>
    </li>
  );
});

export function Component() {
  useDocumentTitle('Categories');
  const { data, isPending, error, refetch } = useCategories();

  // A CONTROLLED input: React state is the single source of truth for what the box shows.
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 200);

  // Derived data: computed from state during render, never stored in state of its own.
  const categories = useMemo(() => {
    const needle = debouncedQuery.trim().toLowerCase();
    const all = data?.categories ?? [];
    if (!needle) return all;
    return all.filter((c) => `${c.title} ${c.summary} ${c.topics.join(' ')}`.toLowerCase().includes(needle));
  }, [data, debouncedQuery]);

  return (
    <>
      <PageHeader title="Categories" description="Pick the kind of interview you want to practise. Each session asks five questions at the difficulty you choose." />

      <div className="relative mb-6 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search categories or topics"
          aria-label="Search categories"
          className="pl-9"
        />
      </div>

      {isPending ? (
        <LoadingState rows={4} rowClassName="h-28" label="Loading categories" />
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : categories.length === 0 ? (
        <EmptyState icon={Search} title="No categories match" description={`Nothing matches "${debouncedQuery}". Try a broader word such as "React" or "SQL".`} />
      ) : (
        <ul className="divide-y rounded-xl border bg-card">
          {categories.map((category) => (
            <CategoryRow key={category.id} category={category} />
          ))}
        </ul>
      )}
    </>
  );
}
