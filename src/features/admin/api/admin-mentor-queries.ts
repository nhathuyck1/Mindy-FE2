'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from '@/features/auth/api/auth-queries';
import { apiRequest } from '@/lib/api/client';
import {
  assignClassMentorInputSchema,
  classMentorAssignmentSchema,
  classMentorCandidatesSchema,
  type ClassMentorIntent,
} from '../schemas/admin-mentor-contracts';

export function useClassMentorCandidates(
  classId: string,
  page: number,
  search: string,
  enabled: boolean,
) {
  const session = useSession();
  const params = new URLSearchParams({ page: String(page), pageSize: '10' });
  if (search) params.set('search', search);
  return useQuery({
    queryKey: ['class-mentor-candidates', session.data?.id, classId, page, search],
    enabled:
      enabled &&
      session.data?.status === 'ACTIVE' &&
      ['ADMIN', 'MANAGER'].includes(session.data.role),
    retry: false,
    queryFn: ({ signal }) =>
      apiRequest({
        path: `management/classes/${classId}/available-mentors?${params}`,
        schema: classMentorCandidatesSchema.refine((data) => data.classId === classId),
        signal,
      }),
  });
}

export function useChangeClassMentor(classId: string) {
  const client = useQueryClient();
  return useMutation({
    retry: false,
    gcTime: 0,
    mutationFn: (intent: ClassMentorIntent) =>
      apiRequest({
        path: `management/classes/${classId}/mentor`,
        method: 'PATCH',
        body: assignClassMentorInputSchema.parse(intent.body),
        idempotencyKey: intent.key,
        schema: classMentorAssignmentSchema.refine(
          (data) =>
            data.classId === classId &&
            data.primaryMentor.id === intent.body.mentorId &&
            data.assignmentVersion > intent.body.expectedVersion,
        ),
      }),
    onSuccess: () =>
      Promise.all(
        [
          'admin',
          'mentor',
          'dashboard',
          'my-classes',
          'my-schedule',
          'learning',
          'schedule-classes',
          'schedule-config',
          'class-mentor-candidates',
          'chat',
        ].map((key) => client.invalidateQueries({ queryKey: [key] })),
      ),
  });
}
