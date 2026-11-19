import { vietnamDate } from '@/lib/weekly-timetable';
import type { ScheduleEvent } from '../schemas/user-contracts';

export function studentSessionHref(
  event: Pick<ScheduleEvent, 'sessionId' | 'startsAt' | 'enrollmentId'> &
    Partial<Pick<ScheduleEvent, 'makeupPlacementId'>>,
) {
  const query = new URLSearchParams({
    date: vietnamDate(event.startsAt),
    enrollmentId: event.enrollmentId,
  });
  if (event.makeupPlacementId) query.set('makeupPlacementId', event.makeupPlacementId);
  return `/user/sessions/${event.sessionId}?${query}`;
}
