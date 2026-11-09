import { api } from '@/lib/api';

// skipAuthRedirect: a 401 from these calls is a normal answer ("not signed in", "wrong password"), not an expired session.
const quiet = { skipAuthRedirect: true };

export const authApi = {
  me: () => api.get('/auth/me', quiet).then((res) => res.data.user),
  login: (payload) => api.post('/auth/login', payload, quiet).then((res) => res.data.user),
  register: (payload) => api.post('/auth/register', payload, quiet).then((res) => res.data.user),
  logout: () => api.post('/auth/logout').then(() => null),
};
