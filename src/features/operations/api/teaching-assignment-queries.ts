'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from '@/features/auth/api/auth-queries';
import { apiRequest } from '@/lib/api/client';
import { teachingSessionSchema } from '@/features/mentor/schemas/mentor-contracts';
import {
  assignSessionMentorInputSchema,
  sessionMentorCandidatesSchema,
  teachingClassDetailSchema,
  type SessionMentorIntent,
} from '../schemas/teaching-assignment-contracts';

function useTeachingAccess() {
  const session = useSession();
  return {
    userId: session.data?.id,
    enabled: session.data?.status === 'ACTIVE' && ['ADMIN', 'MANAGER'].includes(session.data.role),
  };
}
export function useTeachingClass(classId: string, page: number) {
  const access = useTeachingAccess();
  return useQuery({
    queryKey: ['teaching-class', access.userId, classId, page],
    enabled: access.enabled,
    retry: false,
    queryFn: ({ signal }) =>
      apiRequest({
        path: `management/classes/${classId}?page=${page}&pageSize=20`,
        schema: teachingClassDetailSchema.refine(
          (data) =>
            data.class.id === classId &&
            data.sessions.items.every((item) => item.classId === classId),
        ),
        signal,
      }),
  });
}
export function useSessionMentorCandidates(
  sessionId: string,
  page: number,
  search: string,
  enabled: boolean,
) {
  const access = useTeachingAccess();
  const params = new URLSearchParams({ page: String(page), pageSize: '10' });
  if (search) params.set('search', search);
  return useQuery({
    queryKey: ['session-mentor-candidates', access.userId, sessionId, page, search],
    enabled: access.enabled && enabled,
    retry: false,
    queryFn: ({ signal }) =>
      apiRequest({
        path: `management/class-sessions/${sessionId}/available-mentors?${params}`,
        schema: sessionMentorCandidatesSchema.refine((data) => data.sessionId === sessionId),
        signal,
      }),
  });
}
export function useAssignSessionMentor(sessionId: string, classId: string) {
  const cache = useQueryClient();
  return useMutation({
    retry: false,
    gcTime: 0,
    mutationFn: (intent: SessionMentorIntent) =>
      apiRequest({
        path: `management/class-sessions/${sessionId}/mentor`,
        method: 'PATCH',
        body: assignSessionMentorInputSchema.parse(intent.body),
        idempotencyKey: intent.key,
        schema: teachingSessionSchema.refine(
          (data) =>
            data.sessionId === sessionId &&
            data.classId === classId &&
            data.version > intent.body.expectedVersion &&
            (intent.body.mentorId === null
              ? data.assignmentType === 'PRIMARY' &&
                data.effectiveMentor?.id === data.primaryMentor.id
              : data.assignmentType === 'SUBSTITUTE' &&
                data.effectiveMentor?.id === intent.body.mentorId),
        ),
      }),
    onSuccess: () =>
      Promise.all(
        [
          'teaching-class',
          'session-mentor-candidates',
          'class-mentor-candidates',
          'admin',
          'manager',
          'mentor',
          'dashboard',
          'my-classes',
          'my-schedule',
          'learning',
          'schedule-config',
          'schedule-classes',
          'chat',
        ].map((key) => cache.invalidateQueries({ queryKey: [key] })),
      ),
  });
}
