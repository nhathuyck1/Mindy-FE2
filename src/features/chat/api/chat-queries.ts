'use client';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { useCallback } from 'react';
import { apiRequest, ApiError } from '@/lib/api/client';
import { useSession } from '@/features/auth/api/auth-queries';
import { chatPage } from '../schemas/chat-contracts';
export function denied(error: unknown) {
  return error instanceof ApiError && [401, 403, 404].includes(error.status);
}
export function useChatQuery<T>(path: string, schema: z.ZodType<T>, enabled = true, poll = false) {
  const session = useSession();
  return useQuery({
    queryKey: ['chat', session.data?.id, path],
    enabled: !!session.data && enabled,
    retry: false,
    queryFn: ({ signal }) => apiRequest({ path, schema, signal }),
    refetchInterval: (q) => (poll && !q.state.error ? 4000 : false),
  });
}
export function useChatPages<T>(path: string, item: z.ZodType<T>, poll = false) {
  const session = useSession();
  return useInfiniteQuery({
    queryKey: ['chat', session.data?.id, path],
    enabled: !!session.data,
    retry: false,
    initialPageParam: null as string | null,
    queryFn: ({ signal, pageParam }) =>
      apiRequest({
        path: `${path}?limit=50${pageParam ? '&cursor=' + encodeURIComponent(pageParam) : ''}`,
        schema: chatPage(item),
        signal,
      }),
    getNextPageParam: (last) => (last.meta.hasMore ? last.meta.nextCursor : undefined),
    refetchInterval: (q) => (poll && !q.state.error ? 4000 : false),
  });
}
export function useRefreshChat() {
  const client = useQueryClient();
  return useCallback(() => client.invalidateQueries({ queryKey: ['chat'] }), [client]);
}
export function chatError(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 503) return 'Chat chưa sẵn sàng. Vui lòng thử lại sau.';
    if (error.status === 429) return 'Bạn thao tác quá nhanh. Vui lòng chờ một chút rồi thử lại.';
    if (denied(error)) return 'Bạn không còn quyền truy cập cuộc trò chuyện này.';
    if (error.status === 409) return 'Tin nhắn đã thay đổi. Hãy tải lại trước khi thao tác tiếp.';
  }
  return 'Chưa thể kết nối. Bạn có thể thử lại.';
}
