'use client';
import { ApiError } from '@/lib/api/client';
const time = (s: string) =>
  new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'Asia/Ho_Chi_Minh',
  }).format(new Date(s));
export function ScheduleConflicts(props: { error: unknown }) {
  if (!(props.error instanceof ApiError) || !props.error.conflicts.length) return null;
  return (
    <ul className="space-y-2 text-sm text-headsup" aria-label="Buổi và thời gian xung đột">
      {props.error.conflicts.map((c, i) => (
        <li key={i} className="break-words">
          Buổi {c.sessionId ?? c.sourceSessionId} · {time(c.startsAt)} – {time(c.endsAt)}
          {c.conflictingSessionId ? ` · Trùng buổi ${c.conflictingSessionId}` : ''}
        </li>
      ))}
    </ul>
  );
}
