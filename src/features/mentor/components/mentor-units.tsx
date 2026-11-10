'use client';

import { useState } from 'react';
import { BookOpen } from 'lucide-react';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { useMentorQuery, useMentorUnitIndex } from '../api/mentor-queries';
import { unitsSchema } from '../schemas/mentor-contracts';
import { MentorPagination, MentorQueryState } from './mentor-shared';
import { MentorMaterials } from './mentor-materials';

const pageSize = 20;

export function MentorUnits(props: {
  classId: string;
  canAuthor: boolean;
  general?: boolean;
  initialUnitId?: string;
}) {
  const [selectedPage, setSelectedPage] = useState<number>();
  const [selectedId, setSelectedId] = useState(props.initialUnitId);
  const hasInitialUnit = Boolean(props.initialUnitId);
  const index = useMentorUnitIndex(props.classId, hasInitialUnit);
  const initialIndex = index.data?.findIndex((unit) => unit.id === props.initialUnitId) ?? -1;
  const page = selectedPage ?? Math.floor(Math.max(0, initialIndex) / pageSize) + 1;
  const units = useMentorQuery(
    `mentor/classes/${props.classId}/units?page=${page}&pageSize=${pageSize}`,
    unitsSchema,
    !hasInitialUnit,
  );
  const query = hasInitialUnit ? index : units;
  const total = hasInitialUnit ? index.data?.length : units.data?.total;
  const items = hasInitialUnit
    ? (index.data?.slice((page - 1) * pageSize, page * pageSize) ?? [])
    : [...(units.data?.items ?? [])].sort((a, b) => a.position - b.position);
  const selected = items.find((unit) => unit.id === selectedId) ?? items[0];
  return (
    <>
      <MentorQueryState
        pending={query.isPending}
        error={query.error}
        retry={query.refetch}
        empty={items.length === 0}
      >
        <div className="@container/mentor-course min-w-0">
          <div className="grid min-w-0 overflow-hidden rounded-2xl border border-line bg-canvas @3xl/mentor-course:h-[min(800px,calc(100dvh-2rem))] @3xl/mentor-course:grid-cols-[248px_minmax(0,1fr)]">
            <aside
              className="flex min-h-0 min-w-0 flex-col border-b border-line bg-soft/30 @3xl/mentor-course:border-r @3xl/mentor-course:border-b-0"
              aria-label="Nội dung khóa học"
            >
              <h2 className="flex shrink-0 items-center gap-3 border-b border-line px-5 py-4 font-bold">
                <BookOpen aria-hidden="true" className="size-5 shrink-0 text-mint" />
                Nội dung khóa học
              </h2>
              <div className="space-y-3 p-4 @3xl/mentor-course:hidden">
                <label className="block space-y-2 text-sm font-semibold">
                  <span>Chương đang xem</span>
                  <NativeSelect
                    wrapperClassName="w-full min-w-0"
                    className="h-12 w-full truncate bg-canvas"
                    value={selected?.id ?? ''}
                    onChange={(event) => setSelectedId(event.target.value)}
                  >
                    {items.map((unit) => (
                      <NativeSelectOption key={unit.id} value={unit.id}>
                        {unit.position}. {unit.title}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </label>
              </div>
              <nav
                aria-label="Chương"
                tabIndex={0}
                className="hidden min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain p-3 focus-visible:outline-2 focus-visible:outline-mint focus-visible:-outline-offset-2 @3xl/mentor-course:flex"
              >
                {items.map((unit) => (
                  <button
                    key={unit.id}
                    aria-current={unit.id === selected?.id ? 'step' : undefined}
                    onClick={() => setSelectedId(unit.id)}
                    className={
                      'flex min-h-19 shrink-0 items-start gap-3 rounded-lg px-3 py-4 text-left focus-visible:outline-2 focus-visible:outline-mint ' +
                      (unit.id === selected?.id ? 'bg-mint/10 text-forest' : 'hover:bg-soft')
                    }
                  >
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-line bg-canvas text-xs font-bold">
                      {unit.position}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-bold [overflow-wrap:anywhere]">
                        {unit.title}
                      </span>
                    </span>
                  </button>
                ))}
              </nav>
              {total !== undefined && total > pageSize && (
                <div className="shrink-0 border-t border-line p-3">
                  <MentorPagination
                    page={page}
                    total={total}
                    pageSize={pageSize}
                    onChange={(next) => {
                      setSelectedPage(next);
                      setSelectedId(undefined);
                    }}
                  />
                </div>
              )}
            </aside>
            {selected && (
              <MentorMaterials
                key={selected.id}
                unit={selected}
                canAuthor={props.canAuthor}
                general={props.general}
              />
            )}
          </div>
        </div>
      </MentorQueryState>
    </>
  );
}
