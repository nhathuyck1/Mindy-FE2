'use client';

import { type Query, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef } from 'react';
import type { z } from 'zod';
import { useSession } from '@/features/auth/api/auth-queries';
import { ApiError, apiRequest } from '@/lib/api/client';
import { codeErrorMessage } from '../lib/code-format';

type Role = 'MENTOR' | 'STUDENT';

export function useCodeQuery<T>(
  role: Role,
  path: string,
  schema: z.ZodType<T>,
  options: {
    enabled?: boolean;
    refetchInterval?: number | false | ((query: Query<T>) => number | false);
  } = {},
) {
  const session = useSession();
  return useQuery({
    queryKey: ['code', session.data?.id, path],
    queryFn: ({ signal }) => apiRequest({ path, schema, signal }),
    enabled:
      (options.enabled ?? true) && session.data?.role === role && session.data.status === 'ACTIVE',
    refetchInterval: options.refetchInterval,
    retry: false,
  });
}

/**
 * Mutations for CODE routes. Idempotent commands reuse the same key while the same request is
 * retried after an uncertain failure, so a lost response never creates a second submission.
 */
export function useCodeCommand<T>(schema: z.ZodType<T>) {
  const client = useQueryClient();
  const unresolved = useRef<{ fingerprint: string; key: string } | null>(null);
  return useMutation({
    retry: false,
    mutationFn: async (input: {
      path: string;
      method?: 'POST' | 'PUT' | 'DELETE';
      body?: unknown;
      idempotent?: boolean;
      timeoutMs?: number;
    }) => {
      const fingerprint = JSON.stringify([input.path, input.method ?? 'POST', input.body]);
      const key = input.idempotent
        ? unresolved.current?.fingerprint === fingerprint
          ? unresolved.current.key
          : crypto.randomUUID()
        : undefined;
      if (key) unresolved.current = { fingerprint, key };
      try {
        const result = await apiRequest({
          path: input.path,
          method: input.method ?? 'POST',
          body: input.body,
          idempotencyKey: key,
          timeoutMs: input.timeoutMs,
          schema,
        });
        unresolved.current = null;
        return result;
      } catch (error) {
        // Definitive 4xx answers end the attempt; network/5xx keep the key for a safe retry.
        if (error instanceof ApiError && error.status >= 400 && error.status < 500)
          unresolved.current = null;
        throw error;
      }
    },
    onSettled: () =>
      Promise.all([
        client.invalidateQueries({ queryKey: ['code'] }),
        client.invalidateQueries({ queryKey: ['assignments'] }),
      ]),
  });
}

export function codeError(error: unknown, fallback = 'Không thể hoàn tất thao tác.'): string {
  if (error instanceof ApiError) return codeErrorMessage(error.code, error.message || fallback);
  return fallback;
}
