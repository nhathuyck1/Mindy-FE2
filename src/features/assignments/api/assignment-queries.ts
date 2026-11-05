'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { z } from 'zod';
import { useSession } from '@/features/auth/api/auth-queries';
import { apiRequest, ApiError } from '@/lib/api/client';
import { sessionSignal } from '@/lib/api/session-coordinator';
import * as dto from '../schemas/assignment-contracts';
import { workspaceSessionsSchema } from '@/features/mentor/schemas/workspace-contracts';
import { studentClassSchema } from '@/features/learning/schemas/learning-contracts';

export type AssignmentSession = {
  id: string;
  title: string;
  sessionNumber: number | null;
  startsAt: string;
  unitTitle: string | null;
};

export function useAssignmentSessions(classId: string | undefined, mentor: boolean) {
  const session = useSession();
  return useQuery<AssignmentSession[]>({
    queryKey: [
      'assignments',
      session.data?.id,
      mentor ? 'MENTOR' : 'STUDENT',
      'session-filter',
      classId,
    ],
    enabled:
      !!classId &&
      dto.uuid.safeParse(classId).success &&
      session.data?.role === (mentor ? 'MENTOR' : 'STUDENT') &&
      session.data.status === 'ACTIVE',
    retry: false,
    queryFn: async ({ signal }) => {
      if (!mentor) {
        const context = await apiRequest({
          path: `me/classes/${classId}`,
          schema: studentClassSchema,
          signal,
        });
        return context.units.flatMap((u) =>
          u.sessions.map((s) => ({
            id: s.id,
            title: s.title,
            sessionNumber: s.sessionNumber,
            startsAt: s.startsAt,
            unitTitle: u.title,
          })),
        );
      }
      const read = (page: number) =>
        apiRequest({
          path: `mentor/classes/${classId}/sessions?page=${page}&pageSize=100`,
          schema: workspaceSessionsSchema,
          signal,
        });
      const first = await read(1);
      const items = [...first.items];
      for (let page = 2; page <= Math.ceil(first.total / first.pageSize); page++) {
        const next = await read(page);
        if (next.total !== first.total) throw new Error('Danh sách buổi đã thay đổi.');
        items.push(...next.items);
      }
      return items.map((s) => ({
        id: s.sessionId,
        title: s.title,
        sessionNumber: null,
        startsAt: s.startsAt,
        unitTitle: null,
      }));
    },
  });
}

export function useAssignmentQuery<T>(
  path: string,
  schema: z.ZodType<T>,
  enabled = true,
  role: 'MENTOR' | 'STUDENT' = 'STUDENT',
) {
  const session = useSession();
  return useQuery({
    queryKey: ['assignments', session.data?.id, role, path],
    queryFn: ({ signal }) => apiRequest({ path, schema, signal }),
    enabled: enabled && session.data?.role === role && session.data.status === 'ACTIVE',
    retry: false,
  });
}

export function useAssignmentPeople(assignmentId: string, enabled: boolean) {
  const session = useSession();
  return useQuery({
    queryKey: ['assignments', session.data?.id, 'MENTOR', 'people', assignmentId],
    enabled: enabled && session.data?.role === 'MENTOR' && session.data.status === 'ACTIVE',
    retry: false,
    queryFn: async ({ signal }) => {
      const read = (page: number) =>
        apiRequest({
          path: `mentor/assignments/${assignmentId}/roster?page=${page}&pageSize=100`,
          schema: dto.rosterSchema,
          signal,
        });
      const first = await read(1);
      const items = [...first.items];
      for (let page = 2; page <= Math.ceil(first.total / first.pageSize); page++) {
        const next = await read(page);
        if (next.total !== first.total) throw new Error('Danh sách học viên đã thay đổi.');
        items.push(...next.items);
      }
      return items;
    },
  });
}
export function isUncertain(error: unknown) {
  return !(error instanceof ApiError) || error.status >= 500;
}
export function assignmentError(error: unknown) {
  if (error instanceof z.ZodError) {
    return error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .slice(0, 6)
      .join(' · ');
  }
  if (error instanceof ApiError) {
    if (error.status === 409) return 'Dữ liệu đã thay đổi. Tải lại để kiểm tra trước khi tiếp tục.';
    if (error.status === 503) return 'Chưa thể thực hiện. Hãy tải lại để kiểm tra trạng thái.';
    return error.fields.length
      ? `Kiểm tra: ${error.fields.map((f) => f.path.replace(/questions\.(\d+)/g, (_, n: string) => `Câu ${Number(n) + 1}`)).join(', ')}`
      : error.message;
  }
  return 'Chưa xác định được kết quả. Tải lại để kiểm tra trước khi thử lại.';
}
type Command = {
  path: string;
  method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body: unknown;
  receipt?: boolean;
};
export function useAssignmentCommand<T>(schema: z.ZodType<T>) {
  const client = useQueryClient();
  const unresolved = useRef<{ fingerprint: string; key: string; input: Command } | null>(null);
  const [hasUnresolved, setHasUnresolved] = useState(false);
  const lock = useRef(false);
  const mutation = useMutation({
    retry: false,
    mutationFn: async (input: Command) => {
      if (lock.current) throw new Error('Đang gửi.');
      lock.current = true;
      const fingerprint = JSON.stringify(input);
      if (input.receipt && unresolved.current && unresolved.current.fingerprint !== fingerprint) {
        lock.current = false;
        throw new Error('Cần kiểm tra thao tác trước.');
      }
      const intent = unresolved.current ?? { fingerprint, key: crypto.randomUUID(), input };
      if (input.receipt) unresolved.current = intent;
      try {
        const result = await apiRequest({
          path: input.path,
          method: input.method ?? 'POST',
          body: input.body,
          schema,
          idempotencyKey: input.receipt ? intent.key : undefined,
        });
        unresolved.current = null;
        setHasUnresolved(false);
        await Promise.all(
          ['assignments', 'mentor', 'learning', 'user'].map((key) =>
            client.invalidateQueries({
              queryKey: [key],
              predicate: (query) =>
                !query.queryKey.some(
                  (part) =>
                    typeof part === 'string' && part.startsWith('me/assignment-submissions/'),
                ),
            }),
          ),
        );
        return result;
      } catch (error) {
        if (!isUncertain(error)) unresolved.current = null;
        setHasUnresolved(unresolved.current !== null);
        throw error;
      } finally {
        lock.current = false;
      }
    },
  });
  return {
    ...mutation,
    hasUnresolved,
    retryUnresolved: () => {
      if (!unresolved.current) throw new Error('Không có thao tác chờ.');
      return mutation.mutateAsync(unresolved.current.input);
    },
    reconcile: () => {
      unresolved.current = null;
      setHasUnresolved(false);
    },
  };
}

// Signed URLs stay on this stack, never in Query/Mutation cache or storage.
export async function uploadAssignmentFile(props: {
  file: File;
  path: string;
  body: Record<string, unknown>;
  signal: AbortSignal;
  onFile: (id: string) => void;
  onUploaded: (completion: { id: string; version: number; key: string }) => void;
  onStatus: (status: string) => void;
}) {
  const signal = AbortSignal.any([sessionSignal(), props.signal]);
  props.onStatus('Đang chuẩn bị…');
  const intent = await apiRequest({
    path: props.path,
    method: 'POST',
    body: props.body,
    schema: dto.uploadSchema,
    idempotencyKey: crypto.randomUUID(),
    signal,
  });
  props.onFile(intent.fileId);
  props.onStatus('Đang tải lên…');
  const upload = await fetch(intent.uploadUrl, {
    method: 'PUT',
    body: props.file,
    headers: intent.requiredHeaders,
    credentials: 'omit',
    signal,
  });
  if (!upload.ok) throw new Error('Tải tệp thất bại.');
  const completionKey = crypto.randomUUID();
  props.onUploaded({ id: intent.fileId, version: intent.version, key: completionKey });
  props.onStatus('Đang kiểm tra tệp…');
  let file = await apiRequest({
    path: `assignment-files/${intent.fileId}/complete`,
    method: 'POST',
    body: { expectedVersion: intent.version },
    schema: dto.fileStatusSchema,
    idempotencyKey: completionKey,
    signal,
  });
  const started = performance.now();
  while (file.status === 'PROCESSING' && performance.now() - started < 60_000) {
    await new Promise<void>((resolve, reject) => {
      const abort = () => {
        clearTimeout(timer);
        reject(signal.reason);
      };
      const timer = setTimeout(() => {
        signal.removeEventListener('abort', abort);
        resolve();
      }, 2000);
      signal.addEventListener('abort', abort, { once: true });
      if (signal.aborted) abort();
    });
    file = await apiRequest({
      path: `assignment-files/${intent.fileId}`,
      schema: dto.fileStatusSchema,
      signal,
    });
  }
  signal.throwIfAborted();
  return file;
}
