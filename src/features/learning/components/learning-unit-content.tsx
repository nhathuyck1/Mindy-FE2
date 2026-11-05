'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowUpRight, ChevronDown, FileText, LockKeyhole } from 'lucide-react';
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

export function LearningUnitContent(props: {
  context: LearningClass;
  unit: LearningUnit;
  preview: boolean;
}) {
  const [selectedId, setSelectedId] = useState<string | null | undefined>(undefined);
  const [showSessions, setShowSessions] = useState(false);
  const { unit } = props;
  const locked = unit.status === 'LOCKED';
  const query = useUnitMaterials(props.context.id, unit.id, !props.preview && !locked);
  const materials = query.data ?? [];
  const sessions = [...unit.sessions].sort((a, b) => a.sessionNumber - b.sessionNumber);
  const known = new Set(sessions.map((session) => session.id));
  const shared = materials.filter((item) => !item.sessionId);
  const unresolved = materials.filter((item) => item.sessionId && !known.has(item.sessionId));
  const ordered = [
    ...shared,
    ...(showSessions
      ? sessions.flatMap((session) => materials.filter((item) => item.sessionId === session.id))
      : []),
    ...(showSessions ? unresolved : []),
  ];
  const openId = selectedId === undefined ? (ordered[0]?.id ?? null) : selectedId;
  const listProps = {
    classId: props.context.id,
    unitId: unit.id,
    openId,
    onToggle: (id: string) => setSelectedId(openId === id ? null : id),
  };
  const restricted = props.preview || locked;
  const readable = !restricted && !query.isPending && !query.isError;
  const renderSession = (session: LearningUnit['sessions'][number]) => {
    const items = materials.filter((item) => item.sessionId === session.id);
    return (
      <section
        key={session.id}
        aria-label={`Nội dung buổi ${session.sessionNumber}`}
        className="min-w-0 overflow-hidden rounded-xl border border-line"
      >
        <header className="grid gap-2 bg-soft/50 px-3 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start sm:gap-4 sm:px-4">
          <div className="min-w-0 space-y-1.5">
            <h3 className="text-sm leading-5 font-bold break-words">
              {!/^buổi\s+\d+(?:\s|[:.·–-]|$)/iu.test(session.title.trim()) &&
                `Buổi ${session.sessionNumber} · `}
              {session.title}
              {session.status === 'CANCELLED' ? ' · Đã hủy' : ''}
            </h3>
            <p className="text-xs leading-5 text-muted">
              {sessionDate(session.startsAt)}
              {session.roomName ? ` · Phòng: ${session.roomName}` : ''}
            </p>
          </div>
          {!restricted && session.status !== 'CANCELLED' && (
            <div className="flex flex-wrap justify-end gap-x-4 text-xs font-semibold text-mint sm:max-w-64">
              <Link
                href={`/whiteboards/${session.id}`}
                className="inline-flex min-h-11 items-center gap-1 rounded focus-visible:outline-2 focus-visible:outline-mint"
              >
                Mở bảng vẽ <ArrowUpRight aria-hidden="true" className="size-3.5" />
              </Link>
              {studentMeetingUrl(props.context, session) && (
                <a
                  href={studentMeetingUrl(props.context, session) ?? undefined}
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
            </div>
          )}
        </header>
        {readable &&
          (items.length ? (
            <LearningMaterialList {...listProps} items={items} />
          ) : (
            <p className="border-t border-line px-4 py-3 text-sm text-muted">
              Chưa có nội dung được phát hành cho buổi học này.
            </p>
          ))}
      </section>
    );
  };
  return (
    <section
      aria-label={`Chương ${unit.position}: ${unit.title}`}
      className="flex min-h-0 min-w-0 flex-col"
    >
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
        <div className="min-w-0 flex-[1_1_12rem]">
          <p className="text-xs font-bold text-mint">CHƯƠNG {unit.position}</p>
          <h2 className="mt-1 text-base leading-6 font-bold break-words">{unit.title}</h2>
        </div>
        {!restricted && (
          <Button
            variant="outline"
            aria-expanded={showSessions}
            aria-controls={`session-materials-${unit.id}`}
            onClick={() => setShowSessions((value) => !value)}
          >
            <FileText aria-hidden="true" className="size-4" />
            Tài liệu buổi học
            <ChevronDown
              aria-hidden="true"
              className={`size-4 ${showSessions ? 'rotate-180' : ''}`}
            />
          </Button>
        )}
      </header>
      <div className="min-h-0 space-y-4 p-3 @3xl/learning-course:overflow-y-auto @3xl/learning-course:overscroll-y-contain sm:p-4">
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
        ) : query.isPending ? (
          <LearningState>Đang tải danh sách tài liệu…</LearningState>
        ) : query.isError ? (
          <LearningState error={query.error} retry={() => void query.refetch()} />
        ) : !materials.length && !sessions.length ? (
          <LearningState>
            Chưa có tài liệu được phát hành cho chương này. Nội dung sẽ xuất hiện khi được mở cho
            lớp.
          </LearningState>
        ) : null}
        {readable &&
          !showSessions &&
          !shared.length &&
          (sessions.length > 0 || unresolved.length > 0) && (
            <p className="text-sm text-muted">
              Chọn Tài liệu buổi học để xem nội dung theo từng buổi.
            </p>
          )}
        {readable && shared.length > 0 && (
          <section
            aria-label="Nội dung chung của chương"
            className="min-w-0 overflow-hidden rounded-xl border border-line"
          >
            <h3 className="bg-soft/50 px-3 py-3 text-sm font-bold sm:px-4">
              Nội dung chung của chương
            </h3>
            <LearningMaterialList {...listProps} items={shared} />
          </section>
        )}
        <div id={`session-materials-${unit.id}`} hidden={!showSessions} className="space-y-4">
          {showSessions &&
            sessions
              .filter((session) => materials.some((item) => item.sessionId === session.id))
              .map(renderSession)}
          {showSessions && readable && unresolved.length > 0 && (
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
          {showSessions &&
            sessions
              .filter((session) => !materials.some((item) => item.sessionId === session.id))
              .map(renderSession)}
        </div>
      </div>
    </section>
  );
}
