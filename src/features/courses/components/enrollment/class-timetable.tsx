import { Icon } from '@/components/ui/icon';
import { useClassDetail } from '../../api/course-queries';
import { deliveryLabel, formatDate, formatTime, formatWeekday } from '../../lib/course-format';
import { QueryState } from '../shared/query-state';
import { ClassRegistration } from './class-registration';

const sessionLabels = {
  SCHEDULED: 'Đã lên lịch',
  IN_PROGRESS: 'Đang diễn ra',
  COMPLETED: 'Đã hoàn thành',
  CANCELLED: 'Đã hủy',
} as const;

export function ClassTimetable(props: { classId: string; courseId: string }) {
  const detail = useClassDetail(props.classId, props.courseId);
  if (detail.isPending) return <QueryState loading title="Đang tải lịch học…" />;
  if (detail.isError)
    return (
      <QueryState
        title="Chưa thể xem lịch lớp này"
        description="Lớp có thể đã ngừng nhận đăng ký hoặc lịch học tạm thời chưa tải được. Vui lòng thử lại hoặc chọn lớp khác."
        retry={() => void detail.refetch()}
      />
    );
  const data = detail.data;
  const sessions = data.units
    .flatMap((unit) => unit.sessions.map((session) => ({ ...session, unitTitle: unit.title })))
    .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
  return (
    <section aria-labelledby="timetable-title" className="min-w-0">
      <div className="rounded-xl bg-soft p-5">
        <p className="text-[10px] font-extrabold tracking-wider text-mint uppercase">
          Lịch học của bạn
        </p>
        <h3 id="timetable-title" className="mt-2 text-lg font-extrabold">
          {data.name}
        </h3>
        <p className="mt-2 flex items-center gap-2 text-xs text-muted">
          <Icon name="user" className="size-4 shrink-0" />
          {data.mentor.displayName ?? 'Mentor đang được cập nhật'}
        </p>
        <p className="mt-2 text-xs text-muted">
          {deliveryLabel(data.deliveryMode)} · {formatDate(data.startDate)} –{' '}
          {formatDate(data.endDate)}
        </p>
        <p
          className={`mt-3 text-xs font-extrabold ${data.availableSeats > 0 ? 'text-mint' : 'text-headsup'}`}
        >
          {data.availableSeats > 0
            ? `Còn ${data.availableSeats}/${data.maxStudents} chỗ`
            : 'Lớp đã hết chỗ'}
        </p>
      </div>
      <ClassRegistration detail={data} />
      <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-sm font-extrabold">Lịch chi tiết · {sessions.length} buổi</h4>
        <p className="text-[11px] text-muted">Giờ Việt Nam (UTC+7)</p>
      </div>
      {sessions.length === 0 ? (
        <p className="mt-4 rounded-lg border border-dashed border-line p-5 text-sm text-muted">
          Lịch học chi tiết đang được cập nhật. Bạn có thể xem khoảng thời gian học ở trên.
        </p>
      ) : (
        <ol className="mt-4 space-y-3">
          {sessions.map((session, index) => (
            <li
              key={session.id}
              className={`flex gap-3 rounded-lg border border-line p-4 ${session.status === 'CANCELLED' ? 'bg-peach/40' : 'bg-canvas'}`}
            >
              <span
                aria-hidden="true"
                className="grid size-8 shrink-0 place-items-center rounded-lg bg-soft text-xs font-extrabold text-mint"
              >
                {String(index + 1).padStart(2, '0')}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold text-mint">
                  {formatWeekday(session.startsAt)}, {formatDate(session.startsAt)}
                </p>
                <p
                  className={`mt-1 text-sm font-bold ${session.status === 'CANCELLED' ? 'line-through' : ''}`}
                >
                  {session.title}
                </p>
                <p className="mt-1 text-[11px] text-muted">{session.unitTitle}</p>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
                  <span className="flex items-center gap-1.5">
                    <Icon name="clock" className="size-3.5" />
                    {formatTime(session.startsAt)} – {formatTime(session.endsAt)}
                    {session.startsAt.slice(0, 10) !== session.endsAt.slice(0, 10) &&
                      ` (${formatDate(session.endsAt)})`}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Icon
                      name={data.deliveryMode === 'ONLINE' ? 'monitor' : 'location'}
                      className="size-3.5"
                    />
                    {session.roomName ??
                      (data.deliveryMode === 'ONLINE'
                        ? 'Học trực tuyến'
                        : 'Phòng học sẽ được cập nhật')}
                  </span>
                </div>
                <p
                  className={`mt-2 text-[10px] font-bold ${session.status === 'CANCELLED' ? 'text-headsup' : 'text-muted'}`}
                >
                  {sessionLabels[session.status]}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
