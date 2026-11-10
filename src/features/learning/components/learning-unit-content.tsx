'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowUpRight, CalendarDays, ChevronDown, LockKeyhole } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/features/courses/lib/course-format';
import { useUnitMaterials } from '../api/learning-queries';
import type { LearningClass, LearningUnit } from '../schemas/learning-contracts';
import { LearningState } from './learning-state';
import { LearningMaterialList } from './learning-material-list';
import { studentMeetingUrl } from '../lib/student-meeting';

function sessionDate(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'Asia/Ho_Chi_Minh',
  }).format(new Date(value));
}

const sessionStatusLabels = {
  SCHEDULED: 'Chưa bắt đầu',
  IN_PROGRESS: 'Đang học',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
};

export function LearningUnitContent(props: {
  context: LearningClass;
  unit: LearningUnit;
  preview: boolean;
  general: boolean;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [sessionPanel, setSessionPanel] = useState<{ id: string; open: boolean } | null>(null);
  const { unit } = props;
  const locked = unit.status === 'LOCKED';
  const restricted = props.preview || locked;
  const sessions = [...unit.sessions].sort((a, b) => a.sessionNumber - b.sessionNumber);
  const showChapterLoadState = props.general || sessions.length === 0;
  const query = useUnitMaterials(
    props.context.id,
    unit.id,
    !restricted && (showChapterLoadState || sessionPanel !== null),
  );
  const materials = query.data ?? [];
  const known = new Set(sessions.map((session) => session.id));
  const shared = materials.filter((item) => !item.sessionId);
  const unresolved = materials.filter((item) => item.sessionId && !known.has(item.sessionId));
  const listProps = {
    classId: props.context.id,
    unitId: unit.id,
    openId,
    onToggle: (id: string) => setOpenId((current) => (current === id ? null : id)),
  };
  const readable = !restricted && query.isSuccess;
  const renderSession = (session: LearningUnit['sessions'][number]) => {
    const expanded = sessionPanel?.id === session.id && sessionPanel.open;
    const items = expanded ? materials.filter((item) => item.sessionId === session.id) : [];
    const panelId = `session-materials-${session.id}`;
    const meeting = studentMeetingUrl(props.context, session);
    return (
      <section
        key={session.id}
        aria-label={`Nội dung buổi ${session.sessionNumber}`}
        className="min-w-0 overflow-hidden rounded-xl border border-line"
      >
        <header className="space-y-4 bg-soft/50 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-mint/20 bg-canvas text-mint">
              <CalendarDays aria-hidden="true" className="size-5" />
            </span>
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-bold text-mint">Buổi {session.sessionNumber}</span>
                <span className="rounded-full border border-mint/20 bg-canvas px-2 text-xs">
                  {sessionStatusLabels[session.status]}
                </span>
              </div>
              <h3 className="text-lg leading-7 font-bold break-words">{session.title}</h3>
              <p className="text-sm leading-6 text-muted">
                {sessionDate(session.startsAt)} – {sessionDate(session.endsAt)}
                {session.roomName ? ` · Phòng: ${session.roomName}` : ''}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-semibold text-mint">
            {session.status !== 'CANCELLED' && (
              <>
                <Link
                  href={`/whiteboards/${session.id}`}
                  className="inline-flex min-h-11 items-center gap-1 rounded focus-visible:outline-2 focus-visible:outline-mint"
                >
                  Mở bảng vẽ <ArrowUpRight aria-hidden="true" className="size-3.5" />
                </Link>
                {meeting && (
                  <a
                    href={meeting}
                    target="_blank"
                    rel="noopener noreferrer"
                    referrerPolicy="no-referrer"
                    className="inline-flex min-h-11 items-center gap-1 rounded focus-visible:outline-2 focus-visible:outline-mint"
                  >
                    Tham gia buổi học <ArrowUpRight aria-hidden="true" className="size-3.5" />
                  </a>
                )}
                <Link
                  href={`/user/classes/${props.context.id}/assignments?sessionId=${session.id}`}
                  className="inline-flex min-h-11 items-center gap-1"
                >
                  Bài tập của buổi <ArrowUpRight aria-hidden="true" className="size-3.5" />
                </Link>
              </>
            )}
            <Button
              variant="outline"
              className="sm:ml-auto"
              aria-expanded={expanded}
              aria-controls={panelId}
              onClick={() => {
                setSessionPanel({ id: session.id, open: !expanded });
                setOpenId(null);
              }}
            >
              Tài liệu buổi học
              <ChevronDown
                aria-hidden="true"
                className={`size-4 ${expanded ? 'rotate-180' : ''}`}
              />
            </Button>
          </div>
        </header>
        <div id={panelId} hidden={!expanded} className="border-t border-line">
          {expanded &&
            (query.isPending ? (
              <p role="status" className="px-4 py-3 text-sm text-muted">
                Đang tải tài liệu buổi học…
              </p>
            ) : query.isError ? (
              <div className="p-4">
                <LearningState error={query.error} retry={() => void query.refetch()} />
              </div>
            ) : items.length ? (
              <LearningMaterialList {...listProps} items={items} />
            ) : (
              <p className="px-4 py-3 text-sm text-muted">
                Chưa có nội dung được phát hành cho buổi học này.
              </p>
            ))}
        </div>
      </section>
    );
  };
  return (
    <section
      aria-label={`Chương ${unit.position}: ${unit.title}`}
      className="flex min-h-0 min-w-0 flex-col"
    >
      <header className="shrink-0 border-b border-line p-5 sm:p-6">
        <div className="min-w-0 flex-[1_1_12rem]">
          <p className="mb-2 text-sm font-bold text-mint">Chương {unit.position}</p>
          <h2 className="text-xl font-bold break-words">{unit.title}</h2>
        </div>
      </header>
      <div className="min-h-0 space-y-5 p-5 @3xl/learning-course:overflow-y-auto @3xl/learning-course:overscroll-y-contain sm:p-6">
        {props.preview ? (
          <LearningState>
            Đây là chế độ xem trước. Tài liệu và video sẽ mở sau khi trung tâm xác nhận thanh toán
            tiền mặt.
          </LearningState>
        ) : locked ? (
          <LearningState>
            <LockKeyhole aria-hidden="true" className="mb-2 size-5 text-mint" />
            Chương chưa được mở.
            {unit.unlockAt
              ? ` Dự kiến: ${formatDate(unit.unlockAt)}.`
              : ' Vui lòng chờ mentor mở nội dung.'}
          </LearningState>
        ) : showChapterLoadState && query.isPending ? (
          <LearningState>Đang tải danh sách tài liệu…</LearningState>
        ) : showChapterLoadState && query.isError ? (
          <LearningState error={query.error} retry={() => void query.refetch()} />
        ) : null}
        {readable && props.general && (
          <>
            <h3 className="text-lg font-bold">Tài liệu chung của chương</h3>
            {shared.length ? (
              <section
                aria-label="Nội dung chung của chương"
                className="min-w-0 overflow-hidden rounded-xl border border-line"
              >
                <LearningMaterialList {...listProps} items={shared} />
              </section>
            ) : (
              <LearningState>Chưa có tài liệu chung được phát hành cho chương này.</LearningState>
            )}
          </>
        )}
        {!restricted && !props.general && (
          <>
            <h3 className="text-lg font-bold">Nội dung theo buổi học</h3>
            {!sessions.length && readable && !unresolved.length && (
              <LearningState>Chương này chưa có buổi học được mở cho lớp.</LearningState>
            )}
            {sessions.map(renderSession)}
            {readable && unresolved.length > 0 && (
              <section
                aria-label="Buổi học chưa xác định"
                className="min-w-0 overflow-hidden rounded-xl border border-line"
              >
                <h3 className="bg-soft/50 px-3 py-3 text-sm font-bold sm:px-4">
                  Buổi học chưa xác định
                </h3>
                <LearningMaterialList {...listProps} items={unresolved} />
              </section>
            )}
          </>
        )}
      </div>
    </section>
  );
}
