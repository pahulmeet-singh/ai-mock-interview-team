import { api } from '@/lib/api';

export const categoriesApi = {
  list: () => api.get('/categories').then((res) => res.data), // { categories, difficulties }
};
