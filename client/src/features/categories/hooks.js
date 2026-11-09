import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { categoriesApi } from './api';

// Categories never change while the app is open, so they are cached forever (staleTime: Infinity).
export function useCategories() {
  return useQuery({ queryKey: queryKeys.categories, queryFn: categoriesApi.list, staleTime: Infinity });
}

// { frontend: 'Frontend engineering', ... } for places that only have a category id.
export function useCategoryTitles() {
  const { data } = useCategories();
  return useMemo(() => Object.fromEntries((data?.categories ?? []).map((c) => [c.id, c.title])), [data]);
}
