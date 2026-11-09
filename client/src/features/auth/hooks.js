import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { queryKeys } from '@/lib/queryKeys';
import { useSessionStore } from '@/stores/sessionStore';
import { authApi } from './api';

function useEnterApp() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  return (user) => {
    queryClient.setQueryData(queryKeys.auth.me, user);
    navigate(location.state?.from ?? '/', { replace: true });
  };
}

export function useLogin() {
  const enterApp = useEnterApp();
  return useMutation({ mutationFn: authApi.login, onSuccess: enterApp });
}

export function useRegister() {
  const enterApp = useEnterApp();
  return useMutation({
    mutationFn: authApi.register,
    onSuccess: (user) => {
      toast.success(`Welcome, ${user.name.split(' ')[0]}`);
      enterApp(user);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      // "Not signed in" makes ProtectedRoute unmount every protected page. The previous user's cached data is
      // dropped afterwards, by PublicOnlyRoute, once nothing is mounted that could refetch it.
      queryClient.setQueryData(queryKeys.auth.me, null);
      useSessionStore.getState().reset();
      navigate('/login', { replace: true });
    },
  });
}
