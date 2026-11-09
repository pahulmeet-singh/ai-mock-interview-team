import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useCategoryTitles } from '@/features/categories/hooks';
import { queryKeys } from '@/lib/queryKeys';
import { feedbackApi } from './api';
import { summarizeFeedbacks } from './stats';

export function useFeedbackList() {
  return useQuery({ queryKey: queryKeys.feedback.list, queryFn: feedbackApi.list });
}

export function useInterviewFeedback(id) {
  return useQuery({ queryKey: queryKeys.feedback.byInterview(id), queryFn: () => feedbackApi.forInterview(id), retry: false });
}

// A custom hook that composes two others and memoises the derived result.
export function useFeedbackStats() {
  const { data: feedbacks, ...query } = useFeedbackList();
  const titles = useCategoryTitles();
  const stats = useMemo(() => summarizeFeedbacks(feedbacks ?? [], titles), [feedbacks, titles]);
  return { ...query, feedbacks, stats };
}
