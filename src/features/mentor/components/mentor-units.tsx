'use client';

import { useState } from 'react';
import { BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { useMentorCommand, useMentorQuery, mentorError } from '../api/mentor-queries';
import {
  unitsSchema,
  unitSchema,
  releaseSchema,
  type ContentUnit,
} from '../schemas/mentor-contracts';
import { MentorPagination, MentorQueryState, MentorStatus } from './mentor-shared';
import { MentorMaterials } from './mentor-materials';
import { minimumScheduleInput } from '../lib/schedule-time';

function UnitRelease(props: { unit: ContentUnit; onClose: () => void }) {
  const [mode, setMode] = useState('OPEN');
  const [date, setDate] = useState('');
  const [error, setError] = useState('');
  const [minimumTime, setMinimumTime] = useState(() => minimumScheduleInput(Date.now()));
  const refreshMinimumTime = () => setMinimumTime(minimumScheduleInput(Date.now()));
  const command = useMentorCommand(unitSchema);
  return (
    <Modal
      title={`Quyền truy cập · ${props.unit.title}`}
      onClose={() => {
        if (!command.isPending) props.onClose();
      }}
    >
      <form
        className="space-y-5 p-6"
        onSubmit={async (e) => {
          e.preventDefault();
          const result = releaseSchema.safeParse({
            status: mode === 'OPEN' ? 'OPEN' : 'LOCKED',
            unlockAt: mode === 'SCHEDULE' ? `${date}:00+07:00` : null,
          });
          if (!result.success) {
            setError('Chọn thời gian mở hợp lệ.');
            return;
          }
          if (
            mode === 'SCHEDULE' &&
            result.data.unlockAt &&
            Date.parse(result.data.unlockAt) < Date.now()
          ) {
            refreshMinimumTime();
            setError('Thời điểm mở không được ở trong quá khứ (UTC+7).');
            return;
          }
          setError('');
          try {
            await command.mutateAsync({
              path: `mentor/classes/${props.unit.classId}/units/${props.unit.id}/release`,
              method: 'PATCH',
              body: result.data,
            });
            props.onClose();
          } catch {
            /* Visible error below. */
          }
        }}
      >
        <p className="text-sm leading-6 text-muted">
          Mở ngay cho học viên, khóa lại hoặc đặt thời điểm mở theo giờ Việt Nam (UTC+7).
        </p>
        <fieldset disabled={command.isPending} className="space-y-3">
          <legend className="sr-only">Chế độ mở chương</legend>
          {[
            ['OPEN', 'Mở ngay'],
            ['LOCKED', 'Khóa chương'],
            ['SCHEDULE', 'Hẹn giờ mở'],
          ].map(([value, label]) => (
            <label
              key={value}
              className="flex cursor-pointer items-center gap-3 rounded-xl border border-line p-4"
            >
              <input
                type="radio"
                name="release"
                value={value}
                checked={mode === value}
                onChange={() => setMode(value)}
              />
              {label}
            </label>
          ))}
          {mode === 'SCHEDULE' && (
            <label className="block text-sm font-bold">
              Thời điểm mở (UTC+7)
              <Input
                className="mt-2"
                type="datetime-local"
                min={minimumTime}
                onFocus={refreshMinimumTime}
                onClick={refreshMinimumTime}
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </label>
          )}
        </fieldset>
        {(error || command.isError) && (
          <p role="alert" className="rounded-xl bg-peach p-4">
            {error || mentorError(command.error)}
          </p>
        )}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={command.isPending}
            onClick={props.onClose}
          >
            Quay lại
          </Button>
          <Button disabled={command.isPending}>
            {command.isPending ? 'Đang lưu…' : 'Lưu quyền truy cập'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
export function MentorUnits(props: { classId: string }) {
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [release, setRelease] = useState<ContentUnit | null>(null);
  const units = useMentorQuery(
    `mentor/classes/${props.classId}/units?page=${page}&pageSize=20`,
    unitsSchema,
  );
  const items = [...(units.data?.items ?? [])].sort((a, b) => a.position - b.position);
  const selected = items.find((unit) => unit.id === selectedId) ?? items[0];
  return (
    <>
      <MentorQueryState
        pending={units.isPending}
        error={units.error}
        retry={units.refetch}
        empty={units.data?.items.length === 0}
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
                {selected && <MentorStatus value={selected.status} />}
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
                      <span className="mt-2 block">
                        <MentorStatus value={unit.status} />
                      </span>
                    </span>
                  </button>
                ))}
              </nav>
              {units.data && units.data.total > 20 && (
                <div className="shrink-0 border-t border-line p-3">
                  <MentorPagination
                    page={page}
                    total={units.data.total}
                    onChange={(next) => {
                      setPage(next);
                      setSelectedId(null);
                    }}
                  />
                </div>
              )}
            </aside>
            {selected && (
              <MentorMaterials
                key={selected.id}
                unit={selected}
                onRelease={() => setRelease(selected)}
              />
            )}
          </div>
        </div>
      </MentorQueryState>
      {release && <UnitRelease unit={release} onClose={() => setRelease(null)} />}
    </>
  );
}
