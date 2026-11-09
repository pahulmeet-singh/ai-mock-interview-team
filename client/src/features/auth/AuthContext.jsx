import { createContext, useContext, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { authApi } from './api';

// Who is signed in? The JWT sits in an HttpOnly cookie that JavaScript cannot read, so the only way to know is
// to ask the server (GET /auth/me). That answer is server state, so React Query owns it; this Context just makes
// it available everywhere without prop drilling. "Not signed in" is a normal answer (null), not an error.
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const { data: user, isPending } = useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: async () => {
      try {
        return await authApi.me();
      } catch (error) {
        if (error.status === 401) return null;
        throw error;
      }
    },
    staleTime: 5 * 60_000,
    retry: false,
  });

  // Memoised so consumers re-render only when the user (or loading state) actually changes.
  const value = useMemo(() => ({ user: user ?? null, isLoading: isPending, isAuthenticated: Boolean(user) }), [user, isPending]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
