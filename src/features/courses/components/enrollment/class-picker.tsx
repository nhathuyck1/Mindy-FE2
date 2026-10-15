'use client';

import { useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/ui/icon';
import { useOpenClasses } from '../../api/course-queries';
import { deliveryLabel, formatDate, formatPrice } from '../../lib/course-format';
import type { CourseDetail } from '../../schemas/course-contracts';
import { Pagination } from '../shared/pagination';
import { QueryState } from '../shared/query-state';
import { ClassTimetable } from './class-timetable';
import { LoadingOverlay } from '@/components/ui/spinner';

export function ClassPicker(props: {
  course: CourseDetail;
  initialClassId?: string;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [deliveryMode, setDeliveryMode] = useState('');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | undefined>(props.initialClassId);
  const classes = useOpenClasses(props.course.id, deliveryMode, page);
  const items = classes.data?.items ?? [];
  const selected = selectedId;

  useEffect(() => {
    const element = dialog.current;
    const previousOverflow = document.body.style.overflow;
    const trigger = document.activeElement;
    element?.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      element?.close();
      document.body.style.overflow = previousOverflow;
      if (trigger instanceof HTMLElement) trigger.focus();
    };
  }, []);

  return (
    <dialog
      ref={dialog}
      aria-labelledby="class-picker-title"
      aria-describedby="class-picker-description"
      onCancel={(event) => {
        event.preventDefault();
        props.onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          const bounds = event.currentTarget.getBoundingClientRect();
          if (
            event.clientX < bounds.left ||
            event.clientX > bounds.right ||
            event.clientY < bounds.top ||
            event.clientY > bounds.bottom
          )
            props.onClose();
        }
      }}
      className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-1.5rem)] max-w-5xl overflow-y-auto overscroll-contain rounded-2xl border border-line bg-canvas p-0 text-forest shadow-2xl backdrop:bg-forest/55"
    >
      <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-line bg-canvas px-5 py-5 sm:px-7">
        <div>
          <p className="eyebrow mb-1 text-[10px] text-mint">Bắt đầu hành trình</p>
          <h2 id="class-picker-title" className="text-xl font-extrabold sm:text-2xl">
            Chọn lớp phù hợp với bạn
          </h2>
          <p id="class-picker-description" className="mt-1 text-xs text-muted">
            {props.course.title} · Chọn một lớp để xem toàn bộ lịch học.
          </p>
        </div>
        <button
          type="button"
          onClick={props.onClose}
          aria-label="Đóng chọn lớp"
          className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-lg border border-line hover:bg-soft"
        >
          <Icon name="close" className="size-5" />
        </button>
      </div>
      <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className={`min-w-0 ${selected ? 'hidden lg:block' : ''}`}>
          <label htmlFor="class-delivery" className="mb-2 block text-xs font-bold">
            Hình thức học
          </label>
          <select
            id="class-delivery"
            value={deliveryMode}
            onChange={(event) => {
              setDeliveryMode(event.target.value);
              setPage(1);
              setSelectedId(undefined);
            }}
            className="mb-4 min-h-11 w-full cursor-pointer rounded-lg border border-line bg-soft px-3 text-sm"
          >
            <option value="">Tất cả hình thức</option>
            <option value="ONLINE">Trực tuyến</option>
            <option value="OFFLINE">Tại trung tâm</option>
          </select>
          {classes.isPending ? (
            <LoadingOverlay scope="modal" label="Đang tìm lớp đang mở…" />
          ) : classes.isError ? (
            <QueryState title="Chưa thể tải danh sách lớp" retry={() => void classes.refetch()} />
          ) : items.length === 0 ? (
            <QueryState
              title="Chưa có lớp đang mở"
              description="Bạn có thể đổi hình thức học hoặc quay lại sau để xem lịch khai giảng mới."
            />
          ) : (
            <>
              <p role="status" className="mb-3 text-xs text-muted">
                {classes.data.total} lớp đang mở · Số chỗ cập nhật khi tải
              </p>
              <div className="space-y-3">
                {items.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    data-class-id={item.id}
                    aria-pressed={selected === item.id}
                    aria-label={`Xem lịch ${item.name}`}
                    onClick={() => {
                      setSelectedId(item.id);
                      if (window.matchMedia('(max-width: 1023px)').matches)
                        requestAnimationFrame(() => {
                          dialog.current?.scrollTo({ top: 0, behavior: 'instant' });
                          dialog.current
                            ?.querySelector<HTMLButtonElement>('[data-back-to-classes]')
                            ?.focus();
                        });
                    }}
                    className={`w-full cursor-pointer rounded-xl border p-4 text-left transition-colors ${selected === item.id ? 'border-mint bg-soft ring-1 ring-mint' : 'border-line bg-canvas hover:border-mint'}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-md bg-mint/10 px-2 py-1 text-[10px] font-extrabold text-mint">
                        {deliveryLabel(item.deliveryMode)}
                      </span>
                      <span
                        className={`text-[11px] font-extrabold ${item.availableSeats > 0 ? 'text-mint' : 'text-headsup'}`}
                      >
                        {item.availableSeats > 0 ? `Còn ${item.availableSeats} chỗ` : 'Hết chỗ'}
                      </span>
                    </div>
                    <span className="mt-3 block text-sm font-extrabold">{item.name}</span>
                    <span className="mt-1 block text-[10px] text-muted">{item.code}</span>
                    <span className="mt-3 flex items-center gap-2 text-xs">
                      <Icon name="calendar" className="size-4 shrink-0 text-mint" />
                      {formatDate(item.startDate)} – {formatDate(item.endDate)}
                    </span>
                    <span className="mt-2 flex items-center gap-2 text-xs">
                      <Icon name="user" className="size-4 shrink-0 text-mint" />
                      {item.mentor.displayName ?? 'Mentor đang được cập nhật'}
                    </span>
                    <span className="mt-4 flex items-center justify-between border-t border-line pt-3 text-xs font-extrabold">
                      <span>{formatPrice(props.course.priceAmount)}</span>
                      <span className="flex items-center gap-1 text-mint">
                        Xem lịch học <Icon name="arrow" className="size-3.5" />
                      </span>
                    </span>
                  </button>
                ))}
              </div>
              <Pagination
                page={page}
                totalPages={Math.ceil(classes.data.total / classes.data.pageSize)}
                onChange={(value) => {
                  setPage(value);
                  setSelectedId(undefined);
                }}
              />
            </>
          )}
        </div>
        <div className="min-w-0 rounded-xl border border-line p-4 sm:p-5">
          {selected && (
            <button
              data-back-to-classes
              type="button"
              onClick={() => {
                setSelectedId(undefined);
                requestAnimationFrame(() =>
                  dialog.current
                    ?.querySelector<HTMLButtonElement>(`button[data-class-id="${selected}"]`)
                    ?.focus(),
                );
              }}
              className="mb-4 min-h-11 cursor-pointer text-xs font-extrabold text-mint lg:hidden"
            >
              ← Quay lại danh sách lớp
            </button>
          )}
          {selected ? (
            <ClassTimetable key={selected} classId={selected} courseId={props.course.id} />
          ) : (
            <div className="flex min-h-64 flex-col items-center justify-center text-center">
              <span className="mb-4 grid size-16 place-items-center rounded-2xl bg-soft text-mint">
                <Icon name="calendar" className="size-7" />
              </span>
              <h3 className="text-base font-extrabold">Một lịch học vừa vặn với bạn</h3>
              <p className="mt-2 max-w-64 text-xs leading-relaxed text-muted">
                Chọn “Xem lịch học” ở một lớp để xem ngày, giờ và địa điểm của từng buổi.
              </p>
            </div>
          )}
        </div>
      </div>
    </dialog>
  );
}
