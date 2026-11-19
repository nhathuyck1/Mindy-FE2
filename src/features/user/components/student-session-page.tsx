'use client';

import { useMySchedule } from '../api/user-queries';
import { scheduleWeek } from '../lib/schedule-week';
import { StudentSessionResources } from './student-session-resources';
import { UserDataState } from './user-data-state';
import { StudentSessionBackLink, StudentSessionOverview } from './student-session-ui';

export function StudentSessionPage(props: {
  sessionId: string;
  date: string;
  enrollmentId: string;
  makeupPlacementId?: string;
}) {
  const { from, to } = scheduleWeek(props.date);
  const query = useMySchedule(from, to);
  const event = query.data?.items.find(
    (event) =>
      event.sessionId === props.sessionId &&
      event.enrollmentId === props.enrollmentId &&
      (event.makeupPlacementId ?? undefined) === props.makeupPlacementId,
  );
  return (
    <div className="min-w-0 space-y-5 rounded-3xl bg-soft/60 p-3 sm:p-5">
      {(query.isPending || query.isError || !event) && <StudentSessionBackLink />}
      {query.isPending ? (
        <UserDataState loading />
      ) : query.isError ? (
        <UserDataState error={query.error} retry={() => void query.refetch()} />
      ) : !event ? (
        <UserDataState empty="Không tìm thấy buổi học trong lịch của bạn. Lịch có thể đã thay đổi, hãy quay lại lịch học." />
      ) : (
        <>
          <StudentSessionOverview event={event} />
          <StudentSessionResources key={event.sessionId + event.enrollmentId} event={event} />
        </>
      )}
    </div>
  );
}
