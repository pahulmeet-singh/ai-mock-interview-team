import { api } from '@/lib/api';

// REST resources: /interviews (collection), /interviews/:id (item), /interviews/:id/session and /answers (live session).
export const interviewsApi = {
  list: (filters) => api.get('/interviews', { params: filters }).then((res) => res.data.interviews),
  get: (id) => api.get(`/interviews/${id}`).then((res) => res.data.interview),
  book: (payload) => api.post('/interviews', payload).then((res) => res.data.interview),
  cancel: (id) => api.patch(`/interviews/${id}`, { status: 'cancelled' }).then((res) => res.data.interview),
  // Starting a session makes the server call the AI, which can take several seconds.
  startSession: (id) => api.post(`/interviews/${id}/session`, null, { timeout: 90_000 }).then((res) => res.data.interview),
  saveAnswers: (id, answers) => api.put(`/interviews/${id}/answers`, { answers }).then((res) => res.data),
};
