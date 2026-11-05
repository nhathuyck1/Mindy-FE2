'use client';
import { useState } from 'react';
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
    <details className="rounded-2xl border border-line bg-canvas p-4">
      <summary className="cursor-pointer text-xl font-bold">Lịch tuần và dời khai giảng</summary>
      <div className="mt-4 space-y-4">
        <label className="block text-sm font-bold">
          Trạng thái lớp
          <NativeSelect
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
        <label className="block text-sm font-bold">
          Lớp đang mở đăng ký
          <NativeSelect value={id} onChange={(e) => setId(e.target.value)}>
            <NativeSelectOption value="">Chọn lớp</NativeSelectOption>
            {query.data?.items.map((c) => (
              <NativeSelectOption key={c.id} value={c.id}>
                {c.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </label>
        {query.isPending ? (
          <p>Đang tải lớp…</p>
        ) : query.isError ? (
          <p role="alert">
            Chưa tải được lớp.{' '}
            <Button variant="link" onClick={() => void query.refetch()}>
              Thử lại
            </Button>
          </p>
        ) : query.data?.total === 0 ? (
          <p>Không có lớp đang mở đăng ký.</p>
        ) : (
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
      </div>
    </details>
  );
}
export function WeeklySchedulePanel(props: {
  classroom: z.infer<typeof scheduleConfigurationSchema>['class'];
  savedSlots?: { weekday: number; slotId: number }[];
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
    <section className="min-w-0 space-y-4 rounded-xl border border-line p-4">
      <h3 className="font-bold">Xếp lịch theo tuần</h3>
      {c.activeStudentCount !== undefined && (
        <p className="text-sm">
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
          <fieldset disabled={busy || !!pending} className="min-w-0 space-y-4">
            <label className="block space-y-2 text-sm font-bold">
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
              <div className="overflow-x-auto">
                <table className="text-sm">
                  <thead>
                    <tr>
                      <th>Slot</th>
                      {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                        <th key={d} className="min-w-12">
                          {d === 7 ? 'CN' : `T${d + 1}`}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {slots.data?.map((s) => (
                      <tr key={s.id}>
                        <th className="whitespace-nowrap py-2 text-left">
                          Slot {s.id} · {s.startsAt}–{s.endsAt}
                        </th>
                        {[1, 2, 3, 4, 5, 6, 7].map((weekday) => (
                          <td key={weekday} className="text-center">
                            <input
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
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <ol className="space-y-2">
              {sessions.map((s, index) => (
                <li key={s.sessionId ?? `${s.classUnitId}:${index}`}>
                  <label className="flex items-center gap-2 text-sm">
                    <span>{index + 1}.</span>
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
                </li>
              ))}
            </ol>
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
          <div className="flex flex-wrap gap-2">
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
            <div className="max-h-80 overflow-auto">
              <p className="font-bold">
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
                  <li key={s.sessionId ?? i} className="py-1 text-sm">
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
