'use client';

import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { ApiError, apiRequest } from '@/lib/api/client';
import { authResponseSchema, loginSchema, userSchema, type User } from '@/lib/api/contracts';

export const sessionKey = ['auth', 'session'] as const;

export async function replaceSession(queryClient: QueryClient, user: User | null) {
  await queryClient.cancelQueries();
  // Preserve the observed session query so every mounted guard receives the change.
  queryClient.setQueryData(sessionKey, user);
  queryClient.removeQueries({
    predicate: (query) =>
      query.queryKey[0] !== sessionKey[0] || query.queryKey[1] !== sessionKey[1],
  });
  queryClient.getMutationCache().clear();
}

let authQueue: Promise<unknown> = Promise.resolve();

export function withAuthLock<T>(operation: () => Promise<T>): Promise<T> {
  const result = authQueue.then(async (): Promise<T> => {
    if (navigator.locks) return await navigator.locks.request('mindy-fe2-session', operation);
    return await operation();
  });
  authQueue = result.catch(() => undefined);
  return result;
}

export function useSession() {
  return useQuery({
    queryKey: sessionKey,
    retry: false,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    queryFn: ({ signal }) =>
      withAuthLock(async () => {
        try {
          return await apiRequest({ path: 'auth/me', schema: userSchema, signal });
        } catch (error) {
          if (error instanceof ApiError && error.status === 401) {
            try {
              return (
                await apiRequest({
                  path: 'auth/refresh',
                  method: 'POST',
                  schema: authResponseSchema,
                  signal,
                })
              ).user;
            } catch (refreshError) {
              if (refreshError instanceof ApiError && refreshError.status === 401) return null;
              throw refreshError;
            }
          }
          throw error;
        }
      }),
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: z.infer<typeof loginSchema>) =>
      withAuthLock(() =>
        apiRequest({
          path: 'auth/login',
          method: 'POST',
          body: loginSchema.parse(input),
          schema: authResponseSchema,
        }),
      ),
    onSuccess: (result) => replaceSession(queryClient, result.user),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      withAuthLock(async () => {
        try {
          return await apiRequest({ path: 'auth/logout', method: 'POST', schema: z.null() });
        } catch (error) {
          if (error instanceof ApiError && error.status === 401) return null;
          throw error;
        }
      }),
    onSuccess: () => replaceSession(queryClient, null),
  });
}
