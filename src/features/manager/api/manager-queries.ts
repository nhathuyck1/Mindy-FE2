'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { useSession } from '@/features/auth/api/auth-queries';
import { ApiError, apiRequest } from '@/lib/api/client';

export function useManagerQuery<T>(path: string, schema: z.ZodType<T>, enabled = true) {
  const session = useSession();
  return useQuery({
    queryKey: ['manager', session.data?.id, path],
    queryFn: ({ signal }) => apiRequest({ path, schema, signal }),
    enabled: enabled && session.data?.role === 'MANAGER' && session.data.status === 'ACTIVE',
    retry: false,
    staleTime: 30_000,
  });
}
export function useManagerCommand<T>(schema: z.ZodType<T>) {
  const client = useQueryClient();
  return useMutation({
    retry: false,
    mutationFn: (input: { path: string; method?: 'POST' | 'PATCH' | 'DELETE'; body?: unknown }) =>
      apiRequest({ ...input, method: input.method ?? 'POST', schema }),
    onSettled: () => client.invalidateQueries({ queryKey: ['manager'] }),
  });
}
export function managerError(error: unknown) {
  if (error instanceof ApiError && error.status === 409)
    return 'Tài liệu đã thay đổi. Hãy đóng và mở lại để kiểm tra phiên bản mới trước khi tiếp tục.';
  if (error instanceof ApiError && error.status === 404)
    return 'Chưa tìm thấy tài liệu hoặc tính năng chưa được triển khai trên máy chủ.';
  if (error instanceof ApiError && [401, 403].includes(error.status))
    return 'Phiên đăng nhập hoặc quyền truy cập đã thay đổi. Vui lòng đăng nhập lại.';
  return error instanceof Error ? error.message : 'Chưa thể hoàn tất thao tác. Vui lòng thử lại.';
}
