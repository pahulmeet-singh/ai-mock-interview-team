import { create } from 'zustand';

const secondsUntil = (endsAt) => (endsAt ? Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)) : null);

const initial = {
  interviewId: null,
  questionCount: 0,
  currentIndex: 0,
  answers: {},
  endsAt: null,
  remainingSeconds: null,
  saveState: 'idle', // idle | saving | saved | error
  lastSavedAt: null,
  dirty: false,
};

// State for the live interview that many distant components read: the timer, the current question and the
// draft answers. Components subscribe with selectors (useSessionStore((s) => s.remainingSeconds)), so the timer
// ticking every second re-renders only the timer, not the editor.
export const useSessionStore = create((set) => ({
  ...initial,

  // Seeds the store from the server. If the same interview is already loaded (the user left and came back),
  // keep what they typed: it may be newer than the server's copy.
  begin: ({ interviewId, questionCount, endsAt, answers }) =>
    set((state) =>
      state.interviewId === interviewId
        ? state
        : { ...initial, interviewId, questionCount, endsAt, answers: { ...answers }, remainingSeconds: secondsUntil(endsAt) },
    ),

  // Immutable update: a new answers object every time.
  setAnswer: (index, text) => set((state) => ({ answers: { ...state.answers, [index]: text }, dirty: true, saveState: 'idle' })),

  goTo: (index) => set((state) => ({ currentIndex: Math.min(Math.max(index, 0), Math.max(state.questionCount - 1, 0)) })),

  // Returning the same state object tells Zustand nothing changed, so no component re-renders.
  tick: () =>
    set((state) => {
      const remaining = secondsUntil(state.endsAt);
      return remaining === state.remainingSeconds ? state : { remainingSeconds: remaining };
    }),

  markSaving: () => set({ saveState: 'saving' }),

  // `saved` is the exact answers object that was sent. If the user kept typing during the request,
  // state.answers is a different object, so dirty stays true: referential equality as a cheap change detector.
  markSaved: (saved, savedAt) => set((state) => ({ saveState: 'saved', lastSavedAt: savedAt, dirty: state.answers !== saved })),

  markError: () => set({ saveState: 'error' }),
  reset: () => set(initial),
}));
