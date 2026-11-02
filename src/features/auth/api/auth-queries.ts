'use client';

import { useIsMutating, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { z } from 'zod';
import { ApiError, apiRequest } from '@/lib/api/client';
import { authResponseSchema, loginSchema, userSchema } from '@/lib/api/contracts';
import { withAuthChange } from '@/lib/api/session-coordinator';

export const sessionKey = ['auth', 'session'] as const;
const logoutKey = ['auth', 'logout'] as const;
export const logoutNavigationKey = [...logoutKey, 'navigate-home'] as const;

export function useSession() {
  const loggingOut = useIsMutating({ mutationKey: logoutKey }) > 0;
  return useQuery({
    queryKey: sessionKey,
    enabled: !loggingOut,
    retry: false,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    queryFn: async ({ signal }) => {
      try {
        return await apiRequest({ path: 'auth/me', schema: userSchema, signal });
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          return null;
        }
        throw error;
      }
    },
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: z.infer<typeof loginSchema>) =>
      withAuthChange(
        () =>
          apiRequest({
            path: 'auth/login',
            method: 'POST',
            body: loginSchema.parse(input),
            schema: authResponseSchema,
          }),
        true,
      ),
    onSuccess: async (result) => {
      await queryClient.cancelQueries();
      queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== 'auth' });
      queryClient.setQueryData(sessionKey, result.user);
    },
  });
}

export function useLogout(options: { navigateHome?: boolean } = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: options.navigateHome ? logoutNavigationKey : logoutKey,
    // Revert query observers before changing the transport's session signal.
    // Intentional cancellation must never become a dashboard error.
    onMutate: () => queryClient.cancelQueries(),
    mutationFn: () =>
      withAuthChange(async () => {
        try {
          return await apiRequest({ path: 'auth/logout', method: 'POST', schema: z.null() });
        } catch (error) {
          if (error instanceof ApiError && error.status === 401) return null;
          throw error;
        }
      }, false),
    onSuccess: async () => {
      await queryClient.cancelQueries();
      queryClient.setQueryData(sessionKey, null);
      queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== 'auth' });
    },
    onError: async () => {
      if (options.navigateHome)
        toast.error('Chưa thể đăng xuất. Vui lòng thử lại.', { id: 'logout-failed' });
      await queryClient.invalidateQueries({ queryKey: sessionKey });
    },
  });
}
