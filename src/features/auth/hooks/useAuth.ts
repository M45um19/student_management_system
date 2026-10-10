'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import authService from '../services/auth-service';
import { LoginCredentials, AuthResponse, SessionResponse } from '../types';

export const AUTH_KEYS = {
  session: ['auth', 'session'] as const,
};

/**
 * Custom Hook for managing authentication state and queries with TanStack Query
 */
export function useAuth() {
  const queryClient = useQueryClient();
  const router = useRouter();

  // 1. Session Query (reads /api/auth/me)
  const sessionQuery = useQuery<SessionResponse>({
    queryKey: AUTH_KEYS.session,
    queryFn: () => authService.getSession(),
    staleTime: 1000 * 60 * 5, // 5 minutes cache
    retry: false,
  });

  // 2. Login Mutation
  const loginMutation = useMutation<AuthResponse, Error, LoginCredentials>({
    mutationFn: (credentials) => authService.login(credentials),
    onSuccess: (data) => {
      const user = data.data ?? null;
      // Optimistically update session cache
      queryClient.setQueryData<SessionResponse>(AUTH_KEYS.session, {
        success: true,
        message: 'Active session',
        data: user,
        meta: { authenticated: true },
      });

      // Role-based routing
      if (user?.role === 'STAFF') {
        router.push('/staff/dashboard');
      } else {
        router.push('/student/dashboard');
      }
      router.refresh();
    },
  });

  // 3. Logout Mutation
  const logoutMutation = useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      queryClient.setQueryData<SessionResponse>(AUTH_KEYS.session, {
        success: false,
        message: 'Logged out',
        data: null,
        meta: { authenticated: false },
      });
      queryClient.clear(); // Clear all cached queries
      router.push('/login');
      router.refresh();
    },
  });

  return {
    user: sessionQuery.data?.data ?? null,
    isAuthenticated: Boolean(sessionQuery.data?.meta?.authenticated),
    isLoadingSession: sessionQuery.isLoading,
    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error?.message ?? null,
    logout: logoutMutation.mutateAsync,
    isLoggingOut: logoutMutation.isPending,
    refetchSession: sessionQuery.refetch,
  };
}

export default useAuth;
