'use client';

import { Video } from 'lucide-react';
import { useLearningClass } from '@/features/learning/api/learning-queries';
import { LearningState } from '@/features/learning/components/learning-state';
import type { ScheduleEvent } from '../schemas/user-contracts';

export function UserScheduleMeeting(props: { event: ScheduleEvent }) {
  const query = useLearningClass(props.event.classId, false);
  if (query.isPending) return <p className="text-sm text-muted">Đang tải link học trực tuyến…</p>;
  if (query.isError)
    return <LearningState error={query.error} retry={() => void query.refetch()} />;
  if (query.data.accessMode !== 'FULL') return null;
  const session = query.data.units
    .flatMap((unit) => unit.sessions)
    .find((item) => item.id === props.event.sessionId);
  const meetingUrl =
    session && session.status !== 'CANCELLED'
      ? (session.meetingUrl ?? query.data.meetingUrl)
      : null;
  if (!meetingUrl)
    return <p className="text-sm text-muted">Chưa có link học trực tuyến cho buổi học này.</p>;
  return (
    <a
      href={meetingUrl}
      target="_blank"
      rel="noopener noreferrer"
      referrerPolicy="no-referrer"
      className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-mint px-4 py-3 text-sm font-bold text-canvas hover:bg-forest"
    >
      <Video aria-hidden="true" className="size-4" />
      Tham gia buổi học online
    </a>
  );
}
