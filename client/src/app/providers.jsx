import { lazy, Suspense } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/features/auth/AuthContext';
import { setUnauthorizedHandler } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import { queryClient } from './queryClient';

// Any 401 from the API (an expired session) clears the cached user; ProtectedRoute then redirects to /login.
setUnauthorizedHandler(() => queryClient.setQueryData(queryKeys.auth.me, null));

// The React Query devtools show every cache entry live: great for explaining caching in the viva. They are
// loaded only in development and never ship in the production bundle.
const showDevtools = import.meta.env.DEV && import.meta.env.MODE !== 'test';
const Devtools = showDevtools ? lazy(() => import('@tanstack/react-query-devtools').then((m) => ({ default: m.ReactQueryDevtools }))) : null;

export function Providers({ children, client = queryClient }) {
  return (
    <QueryClientProvider client={client}>
      <AuthProvider>{children}</AuthProvider>
      <Toaster />
      {Devtools && (
        <Suspense fallback={null}>
          <Devtools initialIsOpen={false} buttonPosition="bottom-left" />
        </Suspense>
      )}
    </QueryClientProvider>
  );
}
