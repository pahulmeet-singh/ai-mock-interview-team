import { api } from '@/lib/api';

export const feedbackApi = {
  list: () => api.get('/feedbacks').then((res) => res.data.feedbacks),
  forInterview: (id) => api.get(`/interviews/${id}/feedback`).then((res) => res.data.feedback),
  // POST creates the Feedback resource. The server calls the AI here, so allow a generous timeout.
  submit: (id, answers) => api.post(`/interviews/${id}/feedback`, { answers }, { timeout: 120_000 }).then((res) => res.data.feedback),
};
