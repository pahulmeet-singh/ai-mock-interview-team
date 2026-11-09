import { api } from '@/lib/api';

export const slotsApi = {
  list: () => api.get('/slots').then((res) => res.data), // { timezone, slotMinutes, days: [{ date, slots: [{ startsAt, status }] }] }
};
