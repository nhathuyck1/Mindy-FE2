'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef } from 'react';
import { z } from 'zod';
import { ApiError, apiRequest } from '@/lib/api/client';
import { useSession } from '@/features/auth/api/auth-queries';
import { fetchMentorWeek } from './mentor-schedule';
import { fetchMentorUnitSessions } from './mentor-unit-sessions';
import {
  uploadInputSchema,
  uploadIntentSchema,
  fileStatusSchema,
  type ContentUnit,
  materialsSchema,
  unitsSchema,
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

export function useMentorUnitMaterials(unit: ContentUnit, reviewStatus: string) {
  const session = useSession();
  const path = `mentor/classes/${unit.classId}/units/${unit.id}/materials`;
  return useQuery({
    queryKey: ['mentor', session.data?.id, path, 'by-session', reviewStatus],
    enabled: session.data?.role === 'MENTOR' && session.data.status === 'ACTIVE',
    retry: false,
    queryFn: async ({ signal }) => {
      const read = (page: number) =>
        apiRequest({
          path: `${path}?page=${page}&pageSize=100${reviewStatus ? `&reviewStatus=${reviewStatus}` : ''}`,
          schema: materialsSchema,
          signal,
        });
      const first = await read(1);
      const items = [...first.items];
      // Group the entire chapter, including content beyond the first API page.
      for (let page = 2; page <= Math.ceil(first.total / first.pageSize); page++) {
        const next = await read(page);
        items.push(...next.items);
      }
      return [...new Map(items.map((item) => [item.id, item])).values()].sort(
        (a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title, 'vi'),
      );
    },
  });
}

export function useMentorUnitSessions(unit: ContentUnit) {
  const session = useSession();
  return useQuery({
    queryKey: ['mentor', session.data?.id, 'unit-sessions', unit.classId, unit.id],
    queryFn: ({ signal }) => fetchMentorUnitSessions(unit, signal),
    enabled: session.data?.role === 'MENTOR' && session.data.status === 'ACTIVE',
    retry: false,
  });
}

export function useMentorUnitIndex(classId: string) {
  const session = useSession();
  return useQuery({
    queryKey: ['mentor', session.data?.id, 'unit-index', classId],
    enabled: session.data?.role === 'MENTOR' && session.data.status === 'ACTIVE',
    retry: false,
    queryFn: async ({ signal }) => {
      const read = (page: number) =>
        apiRequest({
          path: `mentor/classes/${classId}/units?page=${page}&pageSize=100`,
          schema: unitsSchema,
          signal,
        });
      const first = await read(1);
      const items = [...first.items];
      for (let page = 2; page <= Math.ceil(first.total / first.pageSize); page++) {
        const next = await read(page);
        if (next.total !== first.total || next.page !== page || next.pageSize !== first.pageSize)
          throw new Error('Danh sách chương đã thay đổi. Hãy tải lại.');
        items.push(...next.items);
      }
      if (
        items.length !== first.total ||
        new Set(items.map((item) => item.id)).size !== items.length
      )
        throw new Error('Chưa tải đủ danh sách chương. Hãy tải lại.');
      return items.sort((a, b) => a.position - b.position);
    },
  });
}

export function useMentorCommand<T>(schema: z.ZodType<T>) {
  const client = useQueryClient();
  const unresolved = useRef<{ fingerprint: string; key: string } | null>(null);
  return useMutation({
    retry: false,
    mutationFn: async (input: {
      path: string;
      method?: 'POST' | 'PATCH' | 'PUT' | 'DELETE';
      body?: unknown;
      idempotencyKey?: string;
      idempotent?: boolean;
    }) => {
      const fingerprint = JSON.stringify([input.path, input.method ?? 'POST', input.body]);
      const key =
        input.idempotencyKey ??
        (input.idempotent
          ? unresolved.current?.fingerprint === fingerprint
            ? unresolved.current.key
            : crypto.randomUUID()
          : undefined);
      if (key) unresolved.current = { fingerprint, key };
      try {
        const result = await apiRequest({
          ...input,
          idempotencyKey: key,
          method: input.method ?? 'POST',
          schema,
        });
        unresolved.current = null;
        return result;
      } catch (error) {
        if (error instanceof ApiError && error.status < 500) unresolved.current = null;
        throw error;
      }
    },
    onSettled: () => client.invalidateQueries({ queryKey: ['mentor'] }),
  });
}

export function mentorError(error: unknown) {
  if (error instanceof ApiError) {
    const messages: Record<string, string> = {
      MENTOR_SCOPE_REQUIRED: 'Phân công giảng dạy đã thay đổi. Hãy tải lại quyền của lớp.',
      TEACHING_VERSION_CONFLICT:
        'Ghi chú đã thay đổi. Hãy đối chiếu nội dung mới với bản nháp trước khi lưu.',
      TEACHING_NOTE_WINDOW_CLOSED:
        'Đã hết thời hạn sửa ghi chú. Bản nháp vẫn được giữ để bạn sao chép.',
      TEACHING_NOTE_STATE_CONFLICT: 'Trạng thái buổi học hiện không cho phép lưu ghi chú.',
      SESSION_VERSION_CONFLICT:
        'Buổi học đã thay đổi. Hãy kiểm tra dữ liệu mới trước khi thao tác lại.',
      SESSION_STATE_CONFLICT: 'Trạng thái buổi học hoặc lớp không còn cho phép thao tác này.',
      LEAVE_REQUEST_STALE:
        'Lịch nguồn đã thay đổi. Hãy xem trước lại; với đơn đã gửi, cần rút đơn chờ và tạo đơn mới.',
      LEAVE_VERSION_CONFLICT: 'Đơn đã thay đổi. Hãy mở lại chi tiết và kiểm tra trạng thái mới.',
      LEAVE_REQUEST_EXPIRED: 'Đơn đã hết hạn, không thể tiếp tục thao tác.',
      LEAVE_TARGET_CONFLICT: 'Lịch dạy bù bị trùng. Hãy chọn khung giờ khác.',
      LEAVE_STUDENT_CONFLICT: 'Lịch dạy bù bị trùng lịch học viên. Hãy chọn khung giờ khác.',
      LEAVE_NOTICE_TOO_SHORT: 'Khoảng nghỉ cần được báo trước ít nhất hai ngày lịch.',
      IDEMPOTENCY_KEY_REUSED:
        'Mã thao tác đã được dùng cho yêu cầu khác. Hãy kiểm tra lại kết quả trước khi gửi tiếp.',
    };
    if (messages[error.code]) return messages[error.code];
  }
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
