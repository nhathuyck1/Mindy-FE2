'use client';

import Link from 'next/link';
import { useState } from 'react';
import { BookOpen, ChevronLeft, FolderOpen, LockKeyhole } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { useLearningClass } from '../api/learning-queries';
import type { LearningClass } from '../schemas/learning-contracts';
import { LearningState } from './learning-state';
import { LearningUnitContent } from './learning-unit-content';

function LearningWorkspace(props: { context: LearningClass }) {
  const [unitId, setUnitId] = useState<string | null>(null);
  const [general, setGeneral] = useState(false);
  const units = [...props.context.units].sort((a, b) => a.position - b.position);
  const selected = units.find((unit) => unit.id === unitId) ?? units[0];
  const preview = props.context.accessMode === 'CASH_PREVIEW';
  return (
    <>
      <Link
        href="/user/materials"
        className="text-link mb-3 inline-flex min-h-11 items-center font-semibold"
      >
        <ChevronLeft aria-hidden="true" className="size-4" />
        Tất cả tài liệu học tập
      </Link>
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold text-mint">
            {props.context.code} · {preview ? 'Xem trước lớp học' : 'Không gian học tập'}
          </p>
          <h1 className="mt-2 text-3xl font-extrabold break-words sm:text-4xl">
            {props.context.name}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {units.length} chương · Mentor: {props.context.mentor.displayName || 'Chưa cập nhật'}
          </p>
        </div>
      </header>
      {!preview && (
        <div
          className="mb-7 flex gap-1 overflow-x-auto border-b border-line"
          role="group"
          aria-label="Nội dung lớp học"
        >
          {[
            { general: false, title: 'Chương', icon: BookOpen },
            { general: true, title: 'Tài liệu chung', icon: FolderOpen },
          ].map((tab) => (
            <Button
              key={tab.title}
              aria-pressed={general === tab.general}
              variant="unstyled"
              size="unstyled"
              onClick={() => setGeneral(tab.general)}
              className={`min-h-12 shrink-0 gap-2 rounded-none border-b-2 px-3 text-sm font-bold sm:px-5 ${general === tab.general ? 'border-mint bg-mint/5 text-mint' : 'border-transparent text-muted hover:bg-soft hover:text-forest'}`}
            >
              <tab.icon aria-hidden="true" className="hidden size-4 min-[400px]:block" />
              {tab.title}
            </Button>
          ))}
          <Link
            href={`/user/classes/${props.context.id}/assignments`}
            className="inline-flex min-h-12 shrink-0 items-center gap-2 border-b-2 border-transparent px-3 text-sm font-bold text-muted hover:bg-soft hover:text-forest sm:px-5"
          >
            <BookOpen aria-hidden="true" className="hidden size-4 min-[400px]:block" />
            Bài tập
          </Link>
        </div>
      )}
      <div className="@container/learning-course min-w-0">
        <div className="grid min-w-0 overflow-hidden rounded-2xl border border-line bg-canvas @3xl/learning-course:h-[min(800px,calc(100dvh-16rem))] @3xl/learning-course:min-h-96 @3xl/learning-course:grid-cols-[248px_minmax(0,1fr)]">
          <aside
            className="flex min-h-0 min-w-0 flex-col border-b border-line bg-soft/30 @3xl/learning-course:border-r @3xl/learning-course:border-b-0"
            aria-label="Nội dung khóa học"
          >
            <h2 className="flex shrink-0 items-center gap-3 border-b border-line px-5 py-4 font-bold">
              <BookOpen aria-hidden="true" className="size-5 text-mint" />
              Nội dung khóa học
            </h2>
            <label className="grid gap-2 p-4 text-sm font-semibold @3xl/learning-course:hidden">
              Chương đang xem
              <NativeSelect
                wrapperClassName="w-full min-w-0"
                className="h-12 w-full truncate bg-canvas"
                value={selected?.id ?? ''}
                onChange={(event) => setUnitId(event.target.value)}
              >
                {units.map((unit) => (
                  <NativeSelectOption key={unit.id} value={unit.id}>
                    {unit.position}. {unit.title}
                    {unit.status === 'LOCKED' ? ' · Chưa mở' : ''}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </label>
            <nav
              aria-label="Chương"
              tabIndex={0}
              className="hidden min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain p-3 focus-visible:outline-2 focus-visible:outline-mint focus-visible:-outline-offset-2 @3xl/learning-course:flex"
            >
              {units.map((unit) => (
                <button
                  key={unit.id}
                  aria-current={unit.id === selected?.id ? 'step' : undefined}
                  onClick={() => setUnitId(unit.id)}
                  className={
                    'flex min-h-19 shrink-0 items-start gap-3 rounded-lg px-3 py-4 text-left focus-visible:outline-2 focus-visible:outline-mint ' +
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
            <LearningUnitContent
              key={`${selected.id}-${general}`}
              context={props.context}
              unit={selected}
              preview={preview}
              general={general}
            />
          ) : (
            <div className="p-6">
              <LearningState>Lớp chưa có chương.</LearningState>
            </div>
          )}
        </div>
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
