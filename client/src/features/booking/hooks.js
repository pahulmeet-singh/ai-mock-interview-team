import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { slotsApi } from './api';

// Slots are shared with every other user, so they go stale quickly: refetch every 30 seconds in the background
// (and on window focus) and a slot someone else just took turns grey without a reload.
export function useSlots() {
  return useQuery({ queryKey: queryKeys.slots, queryFn: slotsApi.list, staleTime: 15_000, refetchInterval: 30_000 });
}
