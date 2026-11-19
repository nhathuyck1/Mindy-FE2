'use client';

import { useRef, useState } from 'react';
import { UserRoundCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { useTeachingClass } from '../api/teaching-assignment-queries';
import { SessionMentorForm, teachingTime } from './session-mentor-form';

const statusLabels = {
  SCHEDULED: 'Đã xếp lịch',
  IN_PROGRESS: 'Đang học',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
};

export function ClassTeachingAssignments(props: {
  classId: string;
  onEditingChange?: (editing: boolean) => void;
}) {
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState('');
  const [notice, setNotice] = useState('');
  const select = useRef<HTMLSelectElement>(null);
  const query = useTeachingClass(props.classId, page);
  const session = query.data?.sessions.items.find((item) => item.sessionId === selected);
  const classEditable =
    query.data && ['DRAFT', 'OPEN', 'IN_PROGRESS'].includes(query.data.class.status);
  const editable =
    classEditable && session && ['SCHEDULED', 'IN_PROGRESS'].includes(session.status);
  function close() {
    setSelected('');
    props.onEditingChange?.(false);
    window.setTimeout(() => select.current?.focus({ preventScroll: true }), 0);
  }
  return (
    <section
      aria-label="Phân công dạy thay"
      className="min-w-0 rounded-xl border border-line bg-canvas p-4 sm:p-5"
    >
      <header className="mb-5 space-y-2">
        <h2 className="flex items-center gap-2 text-lg font-extrabold">
          <UserRoundCheck aria-hidden className="size-5 shrink-0 text-mint" />
          Phân công dạy thay
        </h2>
        <p className="text-sm leading-6 text-muted">
          Chọn buổi học, sau đó chọn giảng viên dạy thay. Giờ học được giữ nguyên.
        </p>
      </header>
      {notice && (
        <p role="status" className="mb-4 rounded-lg bg-soft px-4 py-3 text-sm leading-6">
          {notice}
        </p>
      )}
      {query.isPending ? (
        <div role="status" className="space-y-3">
          <p className="text-sm text-muted">Đang tải buổi học…</p>
          <div aria-hidden className="h-11 rounded-lg bg-soft motion-safe:animate-pulse" />
        </div>
      ) : query.isError && (!query.data || !selected) ? (
        <div role="alert" className="space-y-3">
          <p className="text-sm">Không tải được lịch phân công.</p>
          <Button type="button" variant="outline" onClick={() => query.refetch()}>
            Tải lại lịch
          </Button>
        </div>
      ) : (
        query.data && (
          <>
            {!query.data.sessions.items.length ? (
              <p className="text-sm text-muted">
                Chưa có buổi học trên trang này. Hãy xếp lịch cho lớp trước khi phân công.
              </p>
            ) : (
              <label className="grid min-w-0 gap-2 text-sm font-semibold">
                Buổi cần dạy thay
                <NativeSelect
                  ref={select}
                  wrapperClassName="w-full"
                  value={selected}
                  disabled={selected !== ''}
                  onChange={(event) => {
                    setSelected(event.target.value);
                    props.onEditingChange?.(Boolean(event.target.value));
                    setNotice('');
                  }}
                >
                  <NativeSelectOption value="">Chọn buổi học</NativeSelectOption>
                  {query.data.sessions.items.map((item) => (
                    <NativeSelectOption
                      key={item.sessionId}
                      value={item.sessionId}
                      disabled={
                        !classEditable || !['SCHEDULED', 'IN_PROGRESS'].includes(item.status)
                      }
                    >
                      {teachingTime(item.startsAt)} · {item.title} · {statusLabels[item.status]}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </label>
            )}
            {query.data.sessions.total > 20 && (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="text-muted">
                  {query.data.sessions.total} buổi · Trang {page}/
                  {Math.ceil(query.data.sessions.total / 20)}
                </span>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={page <= 1 || selected !== ''}
                    onClick={() => setPage(page - 1)}
                  >
                    Trước
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={page * 20 >= query.data.sessions.total || selected !== ''}
                    onClick={() => setPage(page + 1)}
                  >
                    Sau
                  </Button>
                </div>
              </div>
            )}
            {session && (
              <div className="mt-4">
                {query.isError && (
                  <p role="alert" className="mb-3 text-sm leading-6">
                    Chưa tải lại được lịch buổi học.{' '}
                    <Button type="button" variant="link" onClick={() => query.refetch()}>
                      Tải lại lịch
                    </Button>
                  </p>
                )}
                <div className="space-y-1.5 border-t border-line pt-4 text-sm leading-6">
                  <p className="font-bold break-words">{session.title}</p>
                  <p className="text-muted">
                    {teachingTime(session.startsAt)} – {teachingTime(session.endsAt)} (UTC+7)
                  </p>
                  <p>
                    {session.assignmentType === 'SUBSTITUTE' ? 'Đang dạy thay' : 'Mentor chính'}:{' '}
                    <strong className="font-semibold">
                      {session.effectiveMentor?.displayName || 'Chưa có mentor'}
                    </strong>
                  </p>
                  {session.assignmentType === 'SUBSTITUTE' && (
                    <p className="text-muted">
                      Mentor chính: {session.primaryMentor.displayName || 'Chưa cập nhật tên'}
                    </p>
                  )}
                  <p className="text-muted">{statusLabels[session.status]}</p>
                </div>
                <SessionMentorForm
                  key={session.sessionId}
                  session={session}
                  editable={Boolean(editable && !query.isError)}
                  refresh={() => query.refetch()}
                  onClose={close}
                  onSaved={(message) => {
                    setNotice(message);
                    close();
                  }}
                />
              </div>
            )}
          </>
        )
      )}
    </section>
  );
}
