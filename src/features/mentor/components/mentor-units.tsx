'use client';

import { useState } from 'react';
import { LockKeyhole, BookOpen, CalendarClock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { useMentorCommand, useMentorQuery, mentorError } from '../api/mentor-queries';
import {
  unitsSchema,
  unitSchema,
  releaseSchema,
  type ContentUnit,
} from '../schemas/mentor-contracts';
import { MentorPagination, MentorQueryState, MentorStatus, mentorDate } from './mentor-shared';
import { MentorMaterials } from './mentor-materials';

function UnitRelease(props: { unit: ContentUnit; onClose: () => void }) {
  const [mode, setMode] = useState('OPEN');
  const [date, setDate] = useState('');
  const [error, setError] = useState('');
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
  const [selected, setSelected] = useState<ContentUnit | null>(null);
  const [release, setRelease] = useState<ContentUnit | null>(null);
  const units = useMentorQuery(
    `mentor/classes/${props.classId}/units?page=${page}&pageSize=20`,
    unitsSchema,
  );
  if (selected)
    return (
      <>
        <Button variant="outline" className="mb-5" onClick={() => setSelected(null)}>
          ← Danh sách chương
        </Button>
        <MentorMaterials unit={selected} />
      </>
    );
  return (
    <>
      <MentorQueryState
        pending={units.isPending}
        error={units.error}
        retry={units.refetch}
        empty={units.data?.items.length === 0}
      >
        <div className="space-y-4">
          {units.data?.items.map((unit) => (
            <section
              key={unit.id}
              className="flex flex-wrap items-center justify-between gap-5 rounded-2xl border border-line bg-canvas p-6"
            >
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-3">
                  <span className="text-sm font-bold text-mint">Chương {unit.position}</span>
                  <MentorStatus value={unit.status} />
                </div>
                <h2 className="text-xl font-bold break-words">{unit.title}</h2>
                {unit.unlockAt && (
                  <p className="mt-3 flex items-center gap-2 text-sm text-muted">
                    <CalendarClock className="size-4" />
                    Thời điểm mở: {mentorDate(unit.unlockAt)}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => setSelected(unit)}>
                  <BookOpen className="size-4" />
                  Học liệu
                </Button>
                <Button
                  variant="outline"
                  disabled={unit.status === 'COMPLETED'}
                  onClick={() => setRelease(unit)}
                >
                  <LockKeyhole className="size-4" />
                  Quyền truy cập
                </Button>
              </div>
            </section>
          ))}
        </div>
      </MentorQueryState>
      {units.data && <MentorPagination page={page} total={units.data.total} onChange={setPage} />}
      {release && <UnitRelease unit={release} onClose={() => setRelease(null)} />}
    </>
  );
}
