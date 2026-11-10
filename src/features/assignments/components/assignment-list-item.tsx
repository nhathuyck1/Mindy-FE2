import Link from 'next/link';
import { ClipboardList, ArrowUpRight } from 'lucide-react';
import type { AssignmentSession } from '../api/assignment-queries';
import type { Assignment } from '../schemas/assignment-contracts';
import { assignmentDeadline } from '../lib/assignment-deadline';
import { Status, dateLabel } from './assignment-ui';

export function AssignmentListItem(props: {
  item: Assignment;
  session?: AssignmentSession;
  sessionsPending: boolean;
  classId?: string;
  mentor?: boolean;
  now: number;
}) {
  const { item, session } = props;
  const deadline = assignmentDeadline(item.dueAt, props.now);
  return (
    <li>
      <Link
        href={`/${props.mentor ? 'mentor' : 'user'}/assignments/${item.id}${!props.mentor && props.classId ? `?classId=${props.classId}` : ''}`}
        className="group grid min-w-0 gap-4 p-4 transition-colors hover:bg-soft/60 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-mint sm:p-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_7rem] lg:items-center lg:gap-5"
      >
        <div className="flex min-w-0 items-start gap-3">
          <span className="hidden size-11 shrink-0 items-center justify-center rounded-xl bg-mint/10 text-mint sm:flex">
            <ClipboardList size={22} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-muted">
                {
                  {
                    QUIZ: 'Trắc nghiệm',
                    ZIP: 'Bài nộp ZIP',
                    CODE: 'Bài tập lập trình',
                  }[item.type]
                }{' '}
                · {item.purpose === 'TEST' ? 'Kiểm tra' : 'Bài về nhà'}
              </span>
            </div>
            <h3 className="mt-1 text-lg font-extrabold break-words group-hover:text-mint">
              {item.title}
            </h3>
            {props.mentor && (
              <div className="mt-2">
                <Status value={item.status} />
              </div>
            )}
          </div>
        </div>
        <div className="min-w-0 border-t border-line pt-3 lg:border-0 lg:pt-0">
          <div className="min-w-0 text-sm">
            <p className="mb-1 text-xs text-muted lg:hidden">Buổi học</p>
            <p className="font-bold break-words">
              {session ? (
                <>
                  {session.sessionNumber &&
                  !/^buổi\s+\d+(?:\s|[:.·–-]|$)/iu.test(session.title.trim())
                    ? `Buổi ${session.sessionNumber} · `
                    : ''}
                  {session.title}
                </>
              ) : props.sessionsPending ? (
                'Đang tải buổi học…'
              ) : (
                'Chưa có thông tin buổi học'
              )}
            </p>
            {session?.unitTitle && (
              <p className="mt-1 break-words text-muted">{session.unitTitle}</p>
            )}
            {session && (
              <p className="mt-1 text-muted">
                <time dateTime={session.startsAt}>{dateLabel(session.startsAt)}</time>
              </p>
            )}
          </div>
        </div>
        <div className="min-w-0 lg:text-center">
          <div className="min-w-0 text-sm">
            <p className="mb-1 text-xs text-muted lg:hidden">Hạn nộp</p>
            {item.dueAt ? (
              <time dateTime={item.dueAt} className="block font-extrabold">
                {new Intl.DateTimeFormat('vi-VN', {
                  hour: '2-digit',
                  minute: '2-digit',
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  timeZone: 'Asia/Ho_Chi_Minh',
                }).format(new Date(item.dueAt))}
              </time>
            ) : (
              <p className="font-bold">Không giới hạn</p>
            )}
            {item.status === 'PUBLISHED' && item.dueAt && (
              <span
                className={`mt-2 inline-flex rounded-md px-2 py-1 text-xs font-bold ${deadline.urgent ? 'bg-coral/15 text-ink' : 'bg-mint/10 text-forest'}`}
              >
                {deadline.label}
              </span>
            )}
            {item.status === 'ARCHIVED' && !props.mentor && (
              <div className="mt-2">
                <Status value={item.status} />
              </div>
            )}
          </div>
        </div>
        <span className="flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-line px-3 text-sm font-bold whitespace-nowrap text-mint group-hover:border-mint group-hover:bg-mint/10">
          Xem bài <ArrowUpRight className="size-4 shrink-0" aria-hidden="true" />
        </span>
      </Link>
    </li>
  );
}
