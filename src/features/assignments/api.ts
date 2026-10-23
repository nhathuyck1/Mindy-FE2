'use client';
import { useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { apiRequest, type ApiRequestOptions } from '@/lib/api/client';
import { useSession } from '@/features/auth/api/auth-queries';
import { pageSchema } from './contracts';
export function useAssignments(path: string) {
  const actor = useSession();
  return useQuery({
    queryKey: ['assignments', actor.data?.id, path],
    enabled: !!actor.data,
    retry: false,
    queryFn: async ({ signal }) => {
      const read = (page: number) =>
        apiRequest({
          path: `${path}${path.includes('?') ? '&' : '?'}page=${page}&pageSize=100`,
          schema: pageSchema,
          signal,
        });
      const first = await read(1);
      const items = [...first.items];
      for (let page = 2; page <= Math.ceil(first.total / first.pageSize); page++)
        items.push(...(await read(page)).items);
      return items;
    },
  });
}
export function useAssignmentCommand<T>(schema: z.ZodType<T>) {
  const cache = useQueryClient();
  const pendingKey = useRef<{ fingerprint: string; key: string } | null>(null);
  return useMutation({
    retry: false,
    mutationFn: async (request: Omit<ApiRequestOptions<T>, 'schema'>) => {
      const fingerprint = JSON.stringify([request.path, request.method, request.body]);
      if (pendingKey.current?.fingerprint !== fingerprint)
        pendingKey.current = { fingerprint, key: crypto.randomUUID() };
      const result = await apiRequest({
        ...request,
        schema,
        idempotencyKey:
          request.path.startsWith('me/') && request.method !== 'GET'
            ? pendingKey.current.key
            : undefined,
      });
      pendingKey.current = null;
      return result;
    },
    onSuccess: () => {
      void cache.invalidateQueries({ queryKey: ['assignments'] });
    },
  });
}
