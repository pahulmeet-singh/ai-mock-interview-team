import { QueryClient } from '@tanstack/react-query';

// React Query owns SERVER state: it fetches, caches, de-duplicates and refreshes data from the API.
//  - staleTime: for 30 s cached data counts as fresh, so navigating back is instant and makes no request
//  - refetchOnWindowFocus: when the tab regains focus, stale data is refreshed in the background
//  - retry: network blips are retried twice, but a 4xx (bad input, not found, not signed in) never is
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 10 * 60_000,
      refetchOnWindowFocus: true,
      retry: (failureCount, error) => !(error?.status >= 400 && error?.status < 500) && failureCount < 2,
    },
    mutations: { retry: false },
  },
});
