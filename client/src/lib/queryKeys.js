// One place defines every React Query cache key. A mutation can then invalidate by prefix:
// invalidateQueries({ queryKey: queryKeys.interviews.all }) refreshes the list and every detail at once.
export const queryKeys = {
  auth: { me: ['auth', 'me'] },
  categories: ['categories'],
  slots: ['slots'],
  interviews: {
    all: ['interviews'],
    list: (filters) => ['interviews', 'list', filters],
    detail: (id) => ['interviews', 'detail', id],
  },
  feedback: {
    all: ['feedback'],
    list: ['feedback', 'list'],
    byInterview: (id) => ['feedback', 'interview', id],
  },
  resumes: ['resumes'],
};
