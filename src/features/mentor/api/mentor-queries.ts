'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { ApiError, apiRequest } from '@/lib/api/client';
import { useSession } from '@/features/auth/api/auth-queries';
import { fetchMentorWeek } from './mentor-schedule';
import {
  uploadInputSchema,
  uploadIntentSchema,
  fileStatusSchema,
  type ContentUnit,
} from '../schemas/mentor-contracts';

export function useMentorQuery<T>(path: string, schema: z.ZodType<T>, enabled = true) {
  const session = useSession();
  return useQuery({
    queryKey: ['mentor', session.data?.id, path],
    queryFn: ({ signal }) => apiRequest({ path, schema, signal }),
    enabled: enabled && session.data?.role === 'MENTOR' && session.data.status === 'ACTIVE',
    retry: false,
  });
}

export function useMentorWeek(monday: string) {
  const session = useSession();
  return useQuery({
    queryKey: ['mentor', session.data?.id, 'schedule', monday],
    queryFn: ({ signal }) => fetchMentorWeek(monday, signal),
    enabled: session.data?.role === 'MENTOR' && session.data.status === 'ACTIVE',
    retry: false,
  });
}

export function useMentorCommand<T>(schema: z.ZodType<T>) {
  const client = useQueryClient();
  return useMutation({
    retry: false,
    mutationFn: (input: {
      path: string;
      method?: 'POST' | 'PATCH' | 'PUT' | 'DELETE';
      body?: unknown;
      idempotencyKey?: string;
    }) => apiRequest({ ...input, method: input.method ?? 'POST', schema }),
    onSettled: () => client.invalidateQueries({ queryKey: ['mentor'] }),
  });
}

export function mentorError(error: unknown) {
  if (error instanceof ApiError && error.status === 409)
    return 'Dữ liệu đã thay đổi. Hệ thống đang tải lại; hãy kiểm tra trước khi thao tác lại.';
  return error instanceof Error ? error.message : 'Không thể hoàn tất thao tác. Vui lòng thử lại.';
}

export async function uploadMentorFile(
  file: File,
  unit: ContentUnit,
  signal: AbortSignal,
  progress: (message: string) => void,
) {
  const body = uploadInputSchema.parse({
    courseUnitId: unit.courseUnitId,
    classId: unit.classId,
    classUnitId: unit.id,
    originalFilename: file.name,
    declaredMimeType: file.type || 'application/octet-stream',
    declaredSizeBytes: file.size,
  });
  progress('Đang tạo phiên upload…');
  const intent = await apiRequest({
    path: 'files/upload-intents',
    method: 'POST',
    body,
    schema: uploadIntentSchema,
    signal,
  });
  progress('Đang tải file…');
  const response = await fetch(intent.uploadUrl, {
    method: 'PUT',
    body: file,
    headers: intent.requiredHeaders,
    credentials: 'omit',
    redirect: 'error',
    signal: AbortSignal.any([signal, AbortSignal.timeout(180_000)]),
  });
  if (!response.ok) throw new Error('Upload chưa thành công. Vui lòng chọn lại file.');
  let status = await apiRequest({
    path: `files/${intent.fileId}/complete`,
    method: 'POST',
    body: {},
    schema: fileStatusSchema,
    signal,
  });
  const deadline = Date.now() + 120_000;
  while (status.status === 'PROCESSING' || status.status === 'PENDING_UPLOAD') {
    progress('Đang kiểm tra file…');
    if (Date.now() >= deadline)
      throw new Error('File vẫn đang được kiểm tra. Vui lòng thử lại sau.');
    await new Promise<void>((resolve, reject) => {
      const abort = () => {
        clearTimeout(timer);
        reject(new DOMException('Đã hủy upload', 'AbortError'));
      };
      const timer = setTimeout(() => {
        signal.removeEventListener('abort', abort);
        resolve();
      }, 2000);
      if (signal.aborted) abort();
      else signal.addEventListener('abort', abort, { once: true });
    });
    status = await apiRequest({ path: `files/${intent.fileId}`, schema: fileStatusSchema, signal });
  }
  if (
    status.status !== 'READY' ||
    status.id !== intent.fileId ||
    status.courseUnitId !== unit.courseUnitId
  )
    throw new Error(`File không thể sử dụng${status.errorCode ? ` (${status.errorCode})` : ''}.`);
  return status;
}
