'use client';
import { useState } from 'react';
import { CalendarDays, Check, ListOrdered } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { z } from 'zod';
import { useSession } from '@/features/auth/api/auth-queries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { apiRequest } from '@/lib/api/client';
import {
  scheduleClassesSchema,
  scheduleConfigurationSchema,
  schedulePreviewSchema,
  teachingSlotsSchema,
  weeklyScheduleInputSchema,
} from '../schemas/operation-contracts';

const time = (s: string) =>
  new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'Asia/Ho_Chi_Minh',
  }).format(new Date(s));
export function ManagerWeeklySchedule() {
  const session = useSession();
  const [status, setStatus] = useState('OPEN');
  const [page, setPage] = useState(1),
    [id, setId] = useState('');
  const query = useQuery({
    queryKey: ['schedule-classes', session.data?.id, page, status],
    enabled: session.data?.role === 'MANAGER',
    retry: false,
    queryFn: ({ signal }) =>
      apiRequest({
        path: `management/classes?page=${page}&pageSize=20&status=${status}`,
        schema: scheduleClassesSchema,
        signal,
      }),
  });
  const config = useQuery({
    queryKey: ['schedule-config', session.data?.id, id],
    enabled: !!id,
    retry: false,
    queryFn: ({ signal }) =>
      apiRequest({
        path: `management/classes/${id}/weekly-schedule`,
        schema: scheduleConfigurationSchema,
        signal,
      }),
  });
  return (
    <section aria-label="Lịch tuần và dời khai giảng" className="space-y-6">
      <div className="rounded-2xl border border-line bg-canvas p-5 sm:p-6">
        <div className="mb-5 flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-mint text-sm font-bold text-white">
            1
          </span>
          <div>
            <h2 className="text-lg font-extrabold">Chọn lớp cần xếp lịch</h2>
            <p className="mt-1 text-sm text-muted">
              Thiết lập lịch mới hoặc dời khai giảng cho lớp bản nháp, đang mở đăng ký.
            </p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          <label className="block space-y-2 text-sm font-semibold">
            Trạng thái lớp
            <NativeSelect
              wrapperClassName="w-full"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
                setId('');
              }}
            >
              <NativeSelectOption value="OPEN">Đang mở đăng ký</NativeSelectOption>
              <NativeSelectOption value="DRAFT">Bản nháp</NativeSelectOption>
            </NativeSelect>
          </label>
          <label className="block min-w-0 space-y-2 text-sm font-semibold">
            {status === 'DRAFT' ? 'Lớp bản nháp' : 'Lớp đang mở đăng ký'}
            <NativeSelect
              wrapperClassName="w-full"
              value={id}
              onChange={(e) => setId(e.target.value)}
            >
              <NativeSelectOption value="">Chọn lớp</NativeSelectOption>
              {query.data?.items.map((c) => (
                <NativeSelectOption key={c.id} value={c.id}>
                  {c.name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </label>
        </div>
        {query.isPending ? (
          <p role="status" className="mt-4 text-sm text-muted">
            Đang tải lớp…
          </p>
        ) : query.isError ? (
          <p role="alert" className="mt-4 text-sm">
            Chưa tải được lớp.{' '}
            <Button variant="link" onClick={() => void query.refetch()}>
              Thử lại
            </Button>
          </p>
        ) : query.data?.total === 0 ? (
          <p className="mt-4 text-sm text-muted">Không có lớp phù hợp với trạng thái đã chọn.</p>
        ) : (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
            <span className="text-sm text-muted">
              {query.data?.total} lớp · Trang {page}/
              {Math.max(1, Math.ceil((query.data?.total ?? 0) / 20))}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                Trước
              </Button>
              <Button
                variant="outline"
                disabled={!query.data || page * 20 >= query.data.total}
                onClick={() => setPage((p) => p + 1)}
              >
                Sau
              </Button>
            </div>
          </div>
        )}
      </div>
      {!id && !query.isPending && !query.isError && (
        <div className="grid place-items-center rounded-2xl border border-dashed border-mint/30 bg-canvas px-5 py-14 text-center">
          <CalendarDays aria-hidden="true" className="mb-4 size-10 text-mint" />
          <h2 className="font-bold">Bắt đầu từ một lớp học</h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-muted">
            Chọn lớp phía trên để xem lịch hiện tại, chọn ca học và kiểm tra lịch dự kiến.
          </p>
        </div>
      )}
      {id &&
        (config.isPending ? (
          <p>Đang tải lịch…</p>
        ) : config.isError ? (
          <p role="alert">
            Chưa tải được lịch.{' '}
            <Button variant="link" onClick={() => void config.refetch()}>
              Thử lại
            </Button>
          </p>
        ) : (
          config.data && (
            <WeeklySchedulePanel
              key={`${id}:${config.data.class.assignmentVersion}`}
              classroom={config.data.class}
              savedSlots={config.data.weeklySlots}
            />
          )
        ))}
    </section>
  );
}
export function WeeklySchedulePanel(props: {
  classroom: z.infer<typeof scheduleConfigurationSchema>['class'];
  savedSlots?: { weekday: number; slotId: number }[];
  standalone?: boolean;
}) {
  const c = props.classroom,
    session = useSession(),
    cache = useQueryClient();
  const [startDate, setStartDate] = useState(c.startDate),
    [reason, setReason] = useState(''),
    [selected, setSelected] = useState(props.savedSlots ?? []);
  const [sessions, setSessions] = useState<z.infer<typeof weeklyScheduleInputSchema>['sessions']>(
    () =>
      [...c.units]
        .sort((a, b) => a.position - b.position)
        .flatMap((u) =>
          u.sessions.length
            ? [...u.sessions]
                .sort((a, b) => a.sessionNumber - b.sessionNumber)
                .map((s) => ({ sessionId: s.id, classUnitId: u.id, title: s.title }))
            : c.units.some((unit) => unit.sessions.length)
              ? []
              : [{ classUnitId: u.id, title: u.title }],
        ),
  );
  const [preview, setPreview] = useState<z.infer<typeof schedulePreviewSchema> | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [saved, setSaved] = useState(false);
  const [pending, setPending] = useState<{
    body: z.infer<typeof weeklyScheduleInputSchema>;
    key: string;
  } | null>(null);
  const slots = useQuery({
    queryKey: ['teaching-slots', session.data?.id],
    queryFn: ({ signal }) =>
      apiRequest({ path: 'teaching-slots', schema: teachingSlotsSchema, signal }),
    retry: false,
  });
  const editable =
    ['DRAFT', 'OPEN'].includes(c.status) &&
    c.units.every((u) => u.sessions.every((s) => s.status === 'SCHEDULED'));
  function changed() {
    setPreview(null);
    setSaved(false);
    setPending(null);
  }
  async function run(apply = false) {
    const body = weeklyScheduleInputSchema.safeParse({
      startDate,
      reason,
      weeklySlots: selected,
      sessions,
      expectedVersion: c.assignmentVersion,
    });
    if (!body.success) {
      setError('Chọn ngày, slot tuần, tên buổi và lý do đầy đủ.');
      return;
    }
    setBusy(true);
    setError('');
    const intent = apply ? (pending ?? { body: body.data, key: crypto.randomUUID() }) : null;
    if (intent) setPending(intent);
    try {
      const result = await apiRequest({
        path: `management/classes/${c.id}/weekly-schedule${apply ? '' : '/preview'}`,
        method: 'POST',
        body: intent?.body ?? body.data,
        idempotencyKey: intent?.key,
        schema: schedulePreviewSchema,
      });
      setPreview(result);
      if (apply) {
        setSaved(true);
        setPending(null);
        void cache.invalidateQueries({ queryKey: ['schedule-config'] });
        void cache.invalidateQueries({ queryKey: ['admin'] });
        void cache.invalidateQueries({ queryKey: ['dashboard'] });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Chưa lưu được lịch.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <section
      className={
        props.standalone
          ? 'min-w-0 space-y-5'
          : 'min-w-0 space-y-5 rounded-2xl border border-line bg-canvas p-4 sm:p-6'
      }
    >
      <div className="flex items-start gap-3">
        {!props.standalone && (
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-mint text-sm font-bold text-white">
            2
          </span>
        )}
        <div className="min-w-0">
          <h2 className="text-lg font-extrabold">Xếp lịch theo tuần</h2>
          <p className="mt-1 text-sm text-muted break-words">{c.name}</p>
        </div>
      </div>
      {c.activeStudentCount !== undefined && (
        <p className="rounded-xl bg-soft px-4 py-3 text-sm leading-6 text-forest">
          Đã thanh toán: {c.activeStudentCount}/{c.minStudents ?? 3} học viên tối thiểu.{' '}
          {c.startIneligibilityReason === 'RESCHEDULE_REQUIRED'
            ? 'Lớp cần dời sang mốc khai giảng mới.'
            : ''}
        </p>
      )}
      {!editable ? (
        <p>Lớp đã bắt đầu hoặc có buổi đã học; không thể dời toàn bộ lịch.</p>
      ) : (
        <>
          <fieldset disabled={busy || !!pending} className="min-w-0 space-y-6">
            <label className="block max-w-sm space-y-2 text-sm font-semibold">
              Ngày bắt đầu
              <Input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  changed();
                }}
              />
            </label>
            {slots.isError ? (
              <p role="alert">
                Chưa tải được danh mục slot.{' '}
                <Button variant="link" onClick={() => void slots.refetch()}>
                  Thử lại
                </Button>
              </p>
            ) : (
              <div>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="flex items-center gap-2 font-bold">
                    <CalendarDays aria-hidden="true" className="size-4 text-mint" />
                    Ca học hằng tuần
                  </h3>
                  <span className="rounded-full bg-soft px-3 py-1 text-xs font-semibold text-forest">
                    {selected.length} ca đã chọn
                  </span>
                </div>
                <p className="mb-4 text-sm text-muted">
                  Chọn các ô tương ứng với ngày và ca học. Lịch dự kiến sẽ kiểm tra xung đột trước
                  khi lưu.
                </p>
                <p className="mb-2 text-xs text-muted sm:hidden">
                  Vuốt ngang để xem đủ các ngày trong tuần.
                </p>
                <div className="overflow-x-auto rounded-xl border border-line">
                  <table className="w-full min-w-160 border-collapse text-sm">
                    <thead>
                      <tr>
                        <th scope="col" className="sticky left-0 z-10 bg-soft p-3 text-left">
                          Ca học
                        </th>
                        {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                          <th scope="col" key={d} className="min-w-14 bg-soft p-3">
                            {d === 7 ? 'CN' : `T${d + 1}`}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {slots.data?.map((s) => (
                        <tr key={s.id} className="border-t border-line">
                          <th
                            scope="row"
                            className="sticky left-0 z-10 whitespace-nowrap bg-canvas px-3 py-2 text-left"
                          >
                            <span className="block text-xs text-muted">Ca {s.id}</span>
                            <span className="font-semibold">
                              {s.startsAt}–{s.endsAt}
                            </span>
                          </th>
                          {[1, 2, 3, 4, 5, 6, 7].map((weekday) => (
                            <td key={weekday} className="p-1 text-center">
                              <label className="relative flex min-h-11 cursor-pointer items-center justify-center rounded-lg border border-transparent text-muted transition-colors hover:border-mint/40 hover:bg-soft has-checked:border-mint/40 has-checked:bg-mint/10 has-checked:text-mint has-focus-visible:outline-2 has-focus-visible:outline-mint has-disabled:cursor-default">
                                <input
                                  className="peer absolute inset-0 size-full cursor-pointer opacity-0 disabled:cursor-default"
                                  type="checkbox"
                                  aria-label={`Thứ ${weekday === 7 ? 'Chủ nhật' : weekday + 1}, slot ${s.id}`}
                                  checked={selected.some(
                                    (v) => v.weekday === weekday && v.slotId === s.id,
                                  )}
                                  onChange={(e) => {
                                    setSelected(
                                      e.target.checked
                                        ? [...selected, { weekday, slotId: s.id }]
                                        : selected.filter(
                                            (v) => v.weekday !== weekday || v.slotId !== s.id,
                                          ),
                                    );
                                    changed();
                                  }}
                                />
                                <Check
                                  aria-hidden="true"
                                  className="pointer-events-none size-5 opacity-0 peer-checked:opacity-100"
                                />
                                <span
                                  aria-hidden="true"
                                  className="pointer-events-none absolute size-2 rounded-full bg-line peer-checked:hidden"
                                />
                              </label>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            <div className="border-t border-line pt-5">
              <h3 className="mb-4 flex items-center gap-2 font-bold">
                <ListOrdered aria-hidden="true" className="size-4 text-mint" />
                Nội dung buổi học{' '}
                <span className="ml-auto text-xs font-normal text-muted">
                  {sessions.length} buổi
                </span>
              </h3>
              <ol className="grid max-h-96 gap-2 overflow-y-auto lg:grid-cols-2">
                {sessions.map((s, index) => (
                  <li key={s.sessionId ?? `${s.classUnitId}:${index}`}>
                    {s.sessionId ? (
                      <div className="flex h-full items-start gap-3 rounded-lg bg-soft/60 p-3 text-sm">
                        <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-canvas text-xs font-bold text-mint">
                          {index + 1}
                        </span>
                        <span className="py-1 leading-5 break-words">{s.title}</span>
                      </div>
                    ) : (
                      <label className="flex items-center gap-2 text-sm">
                        <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-soft text-xs font-bold text-mint">
                          {index + 1}
                        </span>
                        <Input
                          aria-label={`Tên buổi ${index + 1}`}
                          value={s.title}
                          disabled={!!s.sessionId}
                          onChange={(e) => {
                            setSessions((current) =>
                              current.map((v, i) =>
                                i === index ? { ...v, title: e.target.value } : v,
                              ),
                            );
                            changed();
                          }}
                        />
                      </label>
                    )}
                  </li>
                ))}
              </ol>
            </div>
            {!c.units.some((u) => u.sessions.length) && (
              <div className="flex flex-wrap gap-2">
                {c.units.map((u) => (
                  <Button
                    key={u.id}
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setSessions((v) => {
                        const next = [...v];
                        const index = next.findLastIndex((s) => s.classUnitId === u.id);
                        next.splice(index + 1, 0, { classUnitId: u.id, title: u.title });
                        return next;
                      });
                      changed();
                    }}
                  >
                    Thêm buổi · {u.title}
                  </Button>
                ))}
              </div>
            )}
            <label className="block space-y-2 text-sm font-bold">
              Lý do
              <Input
                maxLength={1000}
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  changed();
                }}
              />
            </label>
          </fieldset>
          <div className="flex flex-wrap items-center gap-3 border-t border-line pt-5">
            <Button
              variant="outline"
              disabled={busy || !!pending || !slots.data}
              onClick={() => void run()}
            >
              Xem trước lịch
            </Button>
            {preview && !preview.conflicts.length && !saved && (
              <Button disabled={busy} onClick={() => void run(true)}>
                {pending ? 'Thử lưu lại cùng yêu cầu' : 'Lưu toàn bộ lịch'}
              </Button>
            )}
            {pending && (
              <Button
                variant="outline"
                disabled={busy}
                onClick={() => {
                  setPending(null);
                  setPreview(null);
                  void cache.invalidateQueries({ queryKey: ['schedule-config'] });
                }}
              >
                Tải lại trước khi sửa
              </Button>
            )}
          </div>
          {error && <p role="alert">{error}</p>}
          {saved && <p role="status">Đã lưu lịch tuần.</p>}
          {preview && (
            <div className="max-h-96 space-y-3 overflow-auto rounded-xl border border-line bg-soft/40 p-4 sm:p-5">
              <p className="flex items-center gap-2 font-bold">
                <CalendarDays aria-hidden="true" className="size-5 text-mint" />
                {preview.conflicts.length
                  ? `${preview.conflicts.length} xung đột; chưa thể lưu.`
                  : 'Lịch dự kiến'}
              </p>
              {preview.conflicts.map((x, i) => (
                <p key={i} className="text-sm text-headsup">
                  {x.kind} · {time(x.startsAt)}–{time(x.endsAt)}
                </p>
              ))}
              <ol>
                {preview.sessions.map((s, i) => (
                  <li
                    key={s.sessionId ?? i}
                    className="border-b border-line py-3 text-sm leading-6 last:border-0"
                  >
                    {i + 1}. {s.title} · {time(s.startsAt)}–{time(s.endsAt)}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </>
      )}
    </section>
  );
}
