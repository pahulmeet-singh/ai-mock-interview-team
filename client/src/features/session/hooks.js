import { useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { feedbackApi } from '@/features/feedback/api';
import { interviewsApi } from '@/features/interviews/api';
import { useDebounce } from '@/hooks/useDebounce';
import { queryKeys } from '@/lib/queryKeys';
import { useSessionStore } from '@/stores/sessionStore';

// Drives the countdown: calls the store's tick() every second. The cleanup function stops the interval when the
// session page unmounts. Only components that select remainingSeconds re-render on each tick.
export function useSessionClock() {
  const tick = useSessionStore((state) => state.tick);
  useEffect(() => {
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [tick]);
}

// Saves the draft to the server 1.5 s after the user stops typing. The store tracks whether anything is unsaved.
export function useAutosave(interviewId) {
  const answers = useSessionStore((state) => state.answers);
  const debounced = useDebounce(answers, 1500);
  const latestRequest = useRef(0);

  useEffect(() => {
    const { dirty, answers: current, markSaving, markSaved, markError } = useSessionStore.getState();
    if (!dirty) return;
    const request = ++latestRequest.current;
    markSaving();
    interviewsApi
      .saveAnswers(interviewId, current)
      // Ignore a slow, older response that arrives after a newer save was already sent.
      .then(({ savedAt }) => request === latestRequest.current && markSaved(current, savedAt))
      .catch(() => request === latestRequest.current && markError());
  }, [debounced, interviewId]);
}

export function useSubmitSession(interviewId) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: (answers) => feedbackApi.submit(interviewId, answers),
    onSuccess: (feedback) => {
      queryClient.setQueryData(queryKeys.feedback.byInterview(interviewId), feedback);
      queryClient.invalidateQueries({ queryKey: queryKeys.interviews.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.feedback.list });
      useSessionStore.getState().reset();
      navigate(`/interviews/${interviewId}/feedback`, { replace: true });
    },
  });
}
