import Link from 'next/link';
import { CalendarDays, ChevronRight, FileText, FolderOpen, Paperclip, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ContentSession, Material } from '../schemas/mentor-contracts';
import { MentorStatus, mentorDate, mentorLabels } from './mentor-shared';

function ContentRows(props: {
  items: Material[];
  filtered: boolean;
  onSelect: (id: string) => void;
}) {
  if (!props.items.length)
    return (
      <p className="px-5 py-6 text-sm leading-6 text-muted">
        {props.filtered
          ? 'Không có nội dung khớp trạng thái đang lọc.'
          : 'Chưa có nội dung. Thêm bài viết, tài liệu hoặc video để chuẩn bị cho buổi học.'}
      </p>
    );
  return (
    <ul className="divide-y divide-line">
      {props.items.map((item) => {
        const Icon =
          item.contentType === 'VIDEO' ? Video : item.contentType === 'FILE' ? Paperclip : FileText;
        return (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => props.onSelect(item.id)}
              className="group flex min-h-20 w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-mint/5 focus-visible:outline-2 focus-visible:outline-mint focus-visible:-outline-offset-2 sm:gap-4 sm:px-5"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-line bg-soft/60 text-mint">
                <Icon aria-hidden="true" className="size-5" />
              </span>
              <span className="min-w-0 flex-1 space-y-1.5">
                <span className="block text-base leading-6 font-semibold [overflow-wrap:anywhere]">
                  {item.title}
                </span>
                <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
                  <span>{mentorLabels[item.contentType]}</span>
                  <MentorStatus value={item.reviewStatus} />
                </span>
              </span>
              <ChevronRight
                aria-hidden="true"
                className="size-5 shrink-0 text-muted group-hover:text-mint"
              />
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function MentorSessionMaterials(props: {
  sessions: ContentSession[];
  items: Material[];
  filtered: boolean;
  onSelect: (id: string) => void;
}) {
  const sessions = [...props.sessions].sort((a, b) => a.sessionNumber - b.sessionNumber);
  const known = new Set(sessions.map((session) => session.id));
  const unassigned = props.items.filter((item) => !item.sessionId);
  const unresolved = props.items.filter((item) => item.sessionId && !known.has(item.sessionId));
  return (
    <div className="space-y-5">
      {!sessions.length && (
        <p className="rounded-xl border border-dashed border-line bg-soft/40 p-5 text-sm leading-6 text-muted">
          Chương này chưa có buổi học. Bạn có thể chuẩn bị nội dung chung bên dưới và gắn vào buổi
          học sau.
        </p>
      )}
      {sessions.map((session) => {
        const items = props.items.filter((item) => item.sessionId === session.id);
        return (
          <section
            key={session.id}
            aria-label={`Nội dung buổi ${session.sessionNumber}`}
            className="min-w-0 overflow-hidden rounded-xl border border-line bg-canvas"
          >
            <div className="space-y-4 border-b border-line bg-soft/50 p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <span
                  aria-hidden="true"
                  className="grid size-10 shrink-0 place-items-center rounded-lg border border-mint/20 bg-canvas text-mint"
                >
                  <CalendarDays className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="mb-1.5 flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-bold text-mint">Buổi {session.sessionNumber}</span>
                    <MentorStatus value={session.status} />
                  </div>
                  <h3 className="text-lg leading-7 font-bold [overflow-wrap:anywhere]">
                    {session.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-muted">
                    {mentorDate(session.startsAt)} – {mentorDate(session.endsAt)}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-muted">
                  {items.length} nội dung{props.filtered ? ' khớp bộ lọc' : ''}
                </p>
                {session.canReadContext && (
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" asChild>
                      <Link href={`/mentor/sessions/${session.id}#assignments`}>
                        Bài tập / BTVN
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      className="border-line bg-canvas text-forest shadow-none"
                      asChild
                    >
                      <Link href={`/mentor/sessions/${session.id}`}>
                        Điểm danh
                        <ChevronRight aria-hidden="true" className="size-4" />
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>
            <ContentRows items={items} filtered={props.filtered} onSelect={props.onSelect} />
          </section>
        );
      })}
      <section
        aria-label="Nội dung chưa gắn buổi học"
        className="min-w-0 overflow-hidden rounded-xl border border-dashed border-line bg-canvas"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-soft/30 p-4 sm:p-5">
          <div className="min-w-0 space-y-1">
            <h3 className="flex items-center gap-2 text-base font-bold">
              <FolderOpen aria-hidden="true" className="size-5 text-mint" />
              Chưa gắn buổi học
            </h3>
            <p className="text-sm leading-6 text-muted">
              {unassigned.length} nội dung{props.filtered ? ' khớp bộ lọc' : ''} · Nội dung dùng
              chung hoặc đang chờ phân buổi.
            </p>
          </div>
        </div>
        <ContentRows items={unassigned} filtered={props.filtered} onSelect={props.onSelect} />
      </section>
      {unresolved.length > 0 && (
        <section
          aria-label="Nội dung có buổi học chưa xác định"
          className="overflow-hidden rounded-xl border border-line"
        >
          <div className="space-y-1 border-b border-line bg-soft/40 p-5">
            <h3 className="font-bold">Buổi học chưa xác định</h3>
            <p className="text-sm leading-6 text-muted">
              Buổi đã gắn không nằm trong chương này. Mở nội dung để kiểm tra lại.
            </p>
          </div>
          <ContentRows items={unresolved} filtered={props.filtered} onSelect={props.onSelect} />
        </section>
      )}
    </div>
  );
}
