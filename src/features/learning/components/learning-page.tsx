'use client';
import { AssignmentList } from '@/features/assignments/assignment-list';

import Link from 'next/link';
import { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CalendarDays,
  ChevronLeft,
  FileText,
  LockKeyhole,
  PlayCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/features/courses/lib/course-format';
import { useLearningClass, useUnitMaterials } from '../api/learning-queries';
import type { LearningClass, LearningUnit } from '../schemas/learning-contracts';
import { LearningState } from './learning-state';
import { MaterialViewer } from './material-viewer';

function UnitContent(props: { context: LearningClass; unit: LearningUnit; preview: boolean }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const unit = props.unit;
  const locked = unit.status === 'LOCKED';
  const query = useUnitMaterials(props.context.id, unit.id, !props.preview && !locked);
  const materials = query.data ?? [];
  const selected = materials.find((item) => item.id === selectedId) ?? materials[0];
  const index = selected ? materials.findIndex((item) => item.id === selected.id) : -1;
  return (
    <div className="min-w-0">
      <div className="border-b border-line px-5 py-5 sm:px-8">
        <p className="text-xs font-semibold text-mint">CHƯƠNG {unit.position}</p>
        <h2 className="mt-2 text-xl font-bold">{unit.title}</h2>
      </div>
      <div className="space-y-6 p-5 sm:p-8">
        {props.preview ? (
          <LearningState>
            Đây là chế độ xem trước. Tài liệu và video sẽ mở sau khi trung tâm xác nhận thanh toán
            tiền mặt.
          </LearningState>
        ) : locked ? (
          <LearningState>
            <LockKeyhole aria-hidden="true" className="mb-3 size-6 text-mint" />
            Chương chưa được mở.
            {unit.unlockAt
              ? ` Dự kiến: ${formatDate(unit.unlockAt)}.`
              : ' Vui lòng chờ mentor mở nội dung.'}
          </LearningState>
        ) : query.isPending ? (
          <LearningState>Đang tải danh sách tài liệu…</LearningState>
        ) : query.isError ? (
          <LearningState error={query.error} retry={() => void query.refetch()} />
        ) : !materials.length ? (
          <LearningState>
            Chưa có tài liệu được phát hành cho chương này. Nội dung sẽ xuất hiện khi được mở cho
            lớp.
          </LearningState>
        ) : (
          <>
            <nav aria-label="Tài liệu trong chương" className="space-y-2">
              {materials.map((item, position) => (
                <button
                  key={item.id}
                  type="button"
                  aria-current={selected?.id === item.id ? 'true' : undefined}
                  onClick={() => setSelectedId(item.id)}
                  className={
                    'flex min-h-14 w-full items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-colors ' +
                    (selected?.id === item.id
                      ? 'border-mint bg-mint/10 font-bold'
                      : 'border-line hover:bg-soft')
                  }
                >
                  {item.contentType === 'VIDEO' ? (
                    <PlayCircle aria-hidden="true" className="size-5 shrink-0 text-mint" />
                  ) : (
                    <FileText aria-hidden="true" className="size-5 shrink-0 text-mint" />
                  )}
                  <span className="min-w-0 flex-1 break-words">
                    {position + 1}. {item.title}
                  </span>
                  <span className="hidden shrink-0 text-xs text-muted sm:block">
                    {item.contentType === 'VIDEO'
                      ? 'Video'
                      : item.contentType === 'ARTICLE'
                        ? 'Bài đọc'
                        : 'Tệp'}
                  </span>
                </button>
              ))}
            </nav>
            {selected && (
              <div className="border-t border-line pt-7">
                <MaterialViewer
                  key={selected.id}
                  classId={props.context.id}
                  unitId={unit.id}
                  materialId={selected.id}
                />
              </div>
            )}
            <div className="flex flex-wrap justify-between gap-3 border-t border-line pt-5">
              <Button
                variant="outline"
                disabled={index <= 0}
                onClick={() => setSelectedId(materials[index - 1].id)}
              >
                <ArrowLeft aria-hidden="true" />
                Bài trước
              </Button>
              <Button
                variant="outline"
                disabled={index >= materials.length - 1}
                onClick={() => setSelectedId(materials[index + 1].id)}
              >
                Bài tiếp theo
                <ArrowRight aria-hidden="true" />
              </Button>
            </div>
          </>
        )}
        {!!unit.sessions.length && (
          <section className="border-t border-line pt-6" aria-label="Buổi học của chương">
            <h3 className="flex items-center gap-2 font-bold">
              <CalendarDays aria-hidden="true" className="size-5 text-mint" />
              Buổi học
            </h3>
            <ul className="mt-4 divide-y divide-line">
              {unit.sessions.map((session) => (
                <li key={session.id} className="py-4 text-sm">
                  <p className="font-semibold">
                    {session.title}
                    {session.status === 'CANCELLED' ? ' · Đã hủy' : ''}
                  </p>
                  <p className="mt-2 text-muted">
                    {new Intl.DateTimeFormat('vi-VN', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                      timeZone: 'Asia/Ho_Chi_Minh',
                    }).format(new Date(session.startsAt))}
                  </p>
                  {session.roomName && <p className="mt-2">Phòng: {session.roomName}</p>}
                  {!props.preview && !locked && session.status !== 'CANCELLED' && (
                    <div className="mt-4">
                      <AssignmentList classId={props.context.id} sessionId={session.id} />
                    </div>
                  )}
                  {!props.preview && session.status !== 'CANCELLED' && session.meetingUrl && (
                    <a
                      href={session.meetingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      referrerPolicy="no-referrer"
                      className="text-link font-semibold"
                    >
                      Tham gia buổi học
                      <ArrowRight aria-hidden="true" className="size-4" />
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}

function LearningWorkspace(props: { context: LearningClass }) {
  const [unitId, setUnitId] = useState<string | null>(null);
  const units = [...props.context.units].sort((a, b) => a.position - b.position);
  const selected = units.find((unit) => unit.id === unitId) ?? units[0];
  const preview = props.context.accessMode === 'CASH_PREVIEW';
  return (
    <>
      <Link href="/user/materials" className="text-link font-semibold mb-5">
        <ChevronLeft aria-hidden="true" className="size-4" />
        Tất cả tài liệu học tập
      </Link>
      <div className="mb-7">
        <p className="eyebrow font-bold text-mint">
          {props.context.code} · {preview ? 'Xem trước lớp học' : 'Không gian học tập'}
        </p>
        <h1 className="mt-3 text-2xl font-bold sm:text-3xl">{props.context.name}</h1>
        <p className="mt-3 text-sm text-muted">
          {units.length} chương · Mentor: {props.context.mentor.displayName || 'Chưa cập nhật'}
        </p>
      </div>
      <div className="grid min-w-0 overflow-hidden rounded-2xl border border-line bg-canvas xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside
          className="border-b border-line bg-soft/30 xl:border-r xl:border-b-0"
          aria-label="Nội dung khóa học"
        >
          <h2 className="flex items-center gap-3 border-b border-line px-5 py-6 font-bold">
            <BookOpen aria-hidden="true" className="size-5 text-mint" />
            Nội dung khóa học
          </h2>
          <nav
            aria-label="Chương"
            className="flex max-h-80 flex-col overflow-y-auto p-3 xl:max-h-[75vh]"
          >
            {units.map((unit) => (
              <button
                key={unit.id}
                aria-current={unit.id === selected?.id ? 'step' : undefined}
                onClick={() => setUnitId(unit.id)}
                className={
                  'flex min-h-19 items-start gap-3 rounded-lg px-3 py-4 text-left ' +
                  (unit.id === selected?.id ? 'bg-mint/10 text-forest' : 'hover:bg-soft')
                }
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-line bg-canvas text-xs font-bold">
                  {unit.status === 'LOCKED' ? (
                    <LockKeyhole aria-hidden="true" className="size-3.5" />
                  ) : (
                    unit.position
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block break-words text-sm font-bold">{unit.title}</span>
                  <span className="mt-1 block text-xs text-muted">
                    {unit.status === 'LOCKED' ? 'Chưa mở' : `${unit.sessions.length} buổi học`}
                  </span>
                </span>
              </button>
            ))}
          </nav>
        </aside>
        {selected ? (
          <UnitContent
            key={selected.id}
            context={props.context}
            unit={selected}
            preview={preview}
          />
        ) : (
          <div className="p-6">
            <LearningState>Lớp chưa có chương.</LearningState>
          </div>
        )}
      </div>
    </>
  );
}

export function LearningPage(props: { classId: string; preview: boolean }) {
  const query = useLearningClass(props.classId, props.preview);
  if (query.isPending)
    return (
      <>
        <h1 className="mb-5 text-2xl font-bold">Tài liệu học tập</h1>
        <LearningState>Đang tải lớp học…</LearningState>
      </>
    );
  if (query.isError)
    return (
      <>
        <h1 className="mb-5 text-2xl font-bold">Tài liệu học tập</h1>
        <LearningState error={query.error} retry={() => void query.refetch()} />
        <Link href="/user/materials" className="text-link font-semibold mt-5">
          Quay lại tài liệu học tập
        </Link>
      </>
    );
  if (query.data.id !== props.classId) return <LearningState>Lớp học không phù hợp.</LearningState>;
  return <LearningWorkspace context={query.data} />;
}
