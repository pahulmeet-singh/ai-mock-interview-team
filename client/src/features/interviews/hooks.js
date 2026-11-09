import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { updateById } from '@/lib/immutable';
import { queryKeys } from '@/lib/queryKeys';
import { interviewsApi } from './api';

export function useInterviews(filters = {}) {
  return useQuery({
    queryKey: queryKeys.interviews.list(filters),
    queryFn: () => interviewsApi.list(filters),
    placeholderData: keepPreviousData, // keep the old rows on screen while a new filter loads
  });
}

export function useInterview(id, options = {}) {
  return useQuery({ queryKey: queryKeys.interviews.detail(id), queryFn: () => interviewsApi.get(id), ...options });
}

export function useBookInterview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: interviewsApi.book,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.interviews.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.slots });
    },
    // Someone else may have taken the slot: refresh the grid so it shows as taken.
    onError: (error) => {
      if (error.status === 409 || error.status === 422) queryClient.invalidateQueries({ queryKey: queryKeys.slots });
    },
  });
}

// Optimistic update: the UI shows "Cancelled" immediately; if the server refuses, we roll back to the snapshot.
export function useCancelInterview() {
  const queryClient = useQueryClient();
  const cancelled = { status: 'cancelled', canStart: false };

  return useMutation({
    mutationFn: interviewsApi.cancel,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.interviews.all });
      const snapshot = queryClient.getQueriesData({ queryKey: queryKeys.interviews.all });
      // The same prefix matches every list (an array) and every detail (an object). Build new values, never mutate.
      queryClient.setQueriesData({ queryKey: queryKeys.interviews.all }, (old) => {
        if (Array.isArray(old)) return updateById(old, id, cancelled);
        if (old?.id === id) return { ...old, ...cancelled };
        return old;
      });
      return { snapshot };
    },
    onError: (_error, _id, context) => context?.snapshot.forEach(([key, data]) => queryClient.setQueryData(key, data)),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.interviews.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.slots });
    },
  });
}

export function useStartSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: interviewsApi.startSession,
    onSuccess: (interview) => {
      queryClient.setQueryData(queryKeys.interviews.detail(interview.id), interview);
      queryClient.invalidateQueries({ queryKey: queryKeys.interviews.all, refetchType: 'none' });
    },
  });
}
