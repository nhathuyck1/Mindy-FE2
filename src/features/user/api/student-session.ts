'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from '@/features/auth/api/auth-queries';
import {
  studentClassSchema,
  safeResourceUrl,
} from '@/features/learning/schemas/learning-contracts';
import { sessionContextSchema } from '@/features/mentor/schemas/mentor-contracts';
import { studentMeetingUrl } from '@/features/learning/lib/student-meeting';
import { apiRequest } from '@/lib/api/client';
import type { ScheduleEvent } from '../schemas/user-contracts';

const makeupContextSchema = sessionContextSchema.extend({
  meetingUrl: safeResourceUrl.nullable(),
});

export function useStudentSessionResources(event: ScheduleEvent) {
  const session = useSession();
  return useQuery({
    queryKey: [
      'student-session',
      session.data?.id,
      event.classId,
      event.sessionId,
      event.accessMode,
    ],
    enabled:
      session.data?.role === 'STUDENT' &&
      session.data.status === 'ACTIVE' &&
      event.accessMode !== 'CASH_PREVIEW' &&
      event.sessionStatus !== 'CANCELLED',
    retry: false,
    queryFn: async ({ signal }) => {
      if (event.accessMode === 'SESSION_MAKEUP') {
        const context = await apiRequest({
          path: `class-sessions/${event.sessionId}/context`,
          schema: makeupContextSchema,
          signal,
        });
        return {
          status: context.session.status,
          meetingUrl: context.meetingUrl,
          canViewAssignments: false,
          cancelled: context.session.status === 'CANCELLED',
        };
      }
      const context = await apiRequest({
        path: `me/classes/${event.classId}`,
        schema: studentClassSchema,
        signal,
      });
      const lesson = context.units
        .flatMap((unit) => unit.sessions)
        .find((s) => s.id === event.sessionId);
      if (!lesson) throw new Error('Không tìm thấy buổi học trong lớp.');
      const cancelled = lesson.status === 'CANCELLED' || context.classStatus === 'CANCELLED';
      return {
        status: lesson.status,
        meetingUrl: studentMeetingUrl(context, lesson),
        canViewAssignments: !cancelled,
        cancelled,
      };
    },
  });
}
