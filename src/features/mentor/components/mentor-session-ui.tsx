import Link from 'next/link';
import {
  ArrowLeft,
  Clock3,
  GraduationCap,
  MapPin,
  NotebookPen,
  Presentation,
  Link2,
  ClipboardList,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { TeachingSession } from '../schemas/mentor-contracts';
import { MentorStatus, mentorDate } from './mentor-shared';

export function MentorSessionOverview(props: {
  session?: TeachingSession;
  status?: TeachingSession['status'];
  classTitle?: string;
  roomName?: string | null;
  online: boolean;
}) {
  return (
    <header className="relative mb-6 overflow-hidden rounded-3xl border border-mint/20 bg-linear-to-br from-mint/15 via-soft to-mint/5 p-5 sm:p-6">
      <Link
        href="/mentor"
        className="mb-3 inline-flex min-h-9 items-center gap-2 text-sm font-bold text-forest hover:underline"
      >
        <ArrowLeft aria-hidden="true" className="size-4" /> Lịch dạy
      </Link>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="rounded-md bg-mint px-2.5 py-1 text-[11px] font-bold tracking-wider text-canvas uppercase">
          Buổi học
        </span>
        {props.session && <MentorStatus value={props.status ?? props.session.status} />}
        <span className="text-xs font-medium text-forest">
          {props.session?.assignmentType === 'SUBSTITUTE'
            ? 'Phân công dạy thay'
            : 'Phân công chính'}
        </span>
      </div>
      <h1 className="max-w-4xl text-2xl leading-tight font-extrabold tracking-tight sm:text-3xl">
        {props.session?.title ?? 'Thông tin buổi học'}
      </h1>
      {props.classTitle && (
        <p className="mt-3 flex items-start gap-2 text-sm text-forest">
          <GraduationCap aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span>{props.classTitle}</span>
        </p>
      )}
      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-3 border-t border-mint/15 pt-4 text-sm">
        <p className="flex min-w-0 items-start gap-2">
          <Clock3 aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-mint" />
          <span>
            {mentorDate(props.session?.startsAt ?? null)} –{' '}
            {mentorDate(props.session?.endsAt ?? null)}
          </span>
        </p>
        <p className="flex min-w-0 items-start gap-2">
          <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-mint" />
          <span>
            {props.roomName
              ? 'Phòng: ' + props.roomName
              : props.online
                ? 'Lớp học trực tuyến'
                : 'Chưa có phòng học'}
          </span>
        </p>
        <span className="text-xs leading-6 text-muted">Giờ Việt Nam (UTC+7)</span>
      </div>
    </header>
  );
}

export function MentorSessionTools(props: {
  sessionId: string;
  cancelled: boolean;
  meetingAllowed: boolean;
  meetingUrl?: string | null;
  onEditMeeting: () => void;
  notesOpen: boolean;
  onToggleNotes: () => void;
  assignmentsAvailable: boolean;
  assignmentsOpen: boolean;
  onToggleAssignments: () => void;
}) {
  return (
    <aside
      aria-label="Công cụ buổi học"
      className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-1"
    >
      <section className="min-w-0 rounded-2xl bg-forest p-5 text-canvas shadow-xs">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="grid size-9 place-items-center rounded-xl bg-canvas/15"
          >
            <Presentation className="size-5" />
          </span>
          <h2 className="text-sm font-extrabold">Không gian giảng dạy</h2>
        </div>
        <p className="mt-2 text-xs leading-6 text-canvas/75">Bảng vẽ và phòng học của buổi này.</p>
        <div className="mt-5 grid gap-2.5">
          {!props.cancelled && (
            <Button
              asChild
              variant="secondary"
              className="justify-start rounded-xl bg-canvas text-forest hover:bg-soft"
            >
              <Link href={'/whiteboards/' + props.sessionId + '?audience=mentor'}>
                <Presentation aria-hidden="true" className="size-4" />
                Mở bảng vẽ
              </Link>
            </Button>
          )}
          {props.meetingUrl && (
            <Button
              variant="unstyled"
              asChild
              className="justify-start rounded-xl border border-canvas/25 bg-canvas/10 text-canvas hover:bg-canvas/20"
            >
              <a href={props.meetingUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink aria-hidden="true" className="size-4" />
                Vào phòng học
              </a>
            </Button>
          )}
          {props.meetingAllowed && (
            <Button
              variant="unstyled"
              className="justify-start rounded-xl text-canvas/85 hover:bg-canvas/10"
              onClick={props.onEditMeeting}
            >
              <Link2 aria-hidden="true" className="size-4" />
              Sửa link buổi học
            </Button>
          )}
        </div>
      </section>
      <section className="min-w-0 rounded-2xl border border-coral/20 bg-peach/70 p-5">
        <NotebookPen aria-hidden="true" className="mb-3 size-5 text-forest" />
        <h2 className="text-base font-extrabold">Nhật ký buổi học</h2>
        <p className="mt-2 text-xs leading-6 text-muted">
          Lưu nội dung đã dạy và chuẩn bị cho buổi tiếp theo.
        </p>
        <Button
          variant="outline"
          className="mt-4 w-full justify-between rounded-xl border-coral/20 bg-canvas/80"
          aria-expanded={props.notesOpen}
          onClick={props.onToggleNotes}
        >
          Ghi chú giảng dạy <span aria-hidden="true">{props.notesOpen ? '−' : '+'}</span>
        </Button>
      </section>
      {props.assignmentsAvailable && (
        <section className="min-w-0 rounded-2xl border border-line bg-soft p-5 sm:col-span-2 xl:col-span-1">
          <ClipboardList aria-hidden="true" className="mb-3 size-5 text-mint" />
          <h2 className="text-base font-extrabold">Bài tập</h2>
          <p className="mt-2 text-xs leading-6 text-muted">Đề bài và bài nộp của học viên.</p>
          <Button
            variant="outline"
            className="mt-4 w-full justify-between rounded-xl"
            aria-expanded={props.assignmentsOpen}
            onClick={props.onToggleAssignments}
          >
            Bài tập của buổi <span aria-hidden="true">{props.assignmentsOpen ? '−' : '+'}</span>
          </Button>
        </section>
      )}
    </aside>
  );
}
