import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Splash } from '@/components/common/Splash';
import { useAuth } from './AuthContext';

// A layout route: renders its child routes only for signed-in users, otherwise redirects to /login and
// remembers where the user was headed so login can send them back.
export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) return <Splash />;
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  return <Outlet />;
}

// The mirror image: sign-in and register are pointless once you are signed in.
export function PublicOnlyRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();

  // Reaching a public page means nobody is signed in: drop whatever the previous user's session cached,
  // so the next person on this browser can never see it.
  useEffect(() => {
    if (!isLoading && !isAuthenticated) queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== 'auth' });
  }, [isLoading, isAuthenticated, queryClient]);

  if (isLoading) return <Splash />;
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <Outlet />;
}
