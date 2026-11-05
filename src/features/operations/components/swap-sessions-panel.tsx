'use client';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { useSession } from '@/features/auth/api/auth-queries';
import { apiRequest, ApiError } from '@/lib/api/client';
import { schedulePreviewSchema, swapInputSchema } from '../schemas/operation-contracts';

export function SwapSessionsPanel(props: {
  classId: string;
  sessions: {
    sessionId: string;
    title: string;
    status: string;
    version: number;
    startsAt: string;
    endsAt: string;
    effectiveMentor: { id: string } | null;
  }[];
}) {
  const session = useSession(),
    cache = useQueryClient();
  const [asOf] = useState(() => Date.now());
  const [first, setFirst] = useState(''),
    [second, setSecond] = useState(''),
    [reason, setReason] = useState(''),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState('');
  const [pending, setPending] = useState<{
    key: string;
    body: ReturnType<typeof swapInputSchema.parse>;
  } | null>(null);
  const candidates = props.sessions.filter(
    (s) =>
      s.status === 'SCHEDULED' &&
      s.effectiveMentor?.id === session.data?.id &&
      Date.parse(s.startsAt) > asOf,
  );
  async function swap() {
    const a = candidates.find((s) => s.sessionId === first),
      b = candidates.find((s) => s.sessionId === second);
    if (!a || !b) return;
    if (
      Date.parse(a.endsAt) - Date.parse(a.startsAt) !==
      Date.parse(b.endsAt) - Date.parse(b.startsAt)
    ) {
      setMessage('Hai buổi cần có cùng thời lượng.');
      return;
    }
    const parsed = swapInputSchema.safeParse({
      firstSessionId: first,
      secondSessionId: second,
      firstVersion: a.version,
      secondVersion: b.version,
      reason,
    });
    if (!parsed.success) {
      setMessage('Chọn hai buổi khác nhau và điền lý do.');
      return;
    }
    const intent = pending ?? { key: crypto.randomUUID(), body: parsed.data };
    setPending(intent);
    setBusy(true);
    setMessage('');
    try {
      await apiRequest({
        path: `mentor/classes/${props.classId}/sessions/swap`,
        method: 'POST',
        body: intent.body,
        idempotencyKey: intent.key,
        schema: schedulePreviewSchema,
      });
      setMessage('Đã hoán đổi thời gian hai buổi.');
      setPending(null);
      setFirst('');
      setSecond('');
      void cache.invalidateQueries({ queryKey: ['mentor'] });
      void cache.invalidateQueries({ queryKey: ['dashboard'] });
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Chưa hoán đổi được lịch.');
      if (e instanceof ApiError && e.status < 500) {
        setPending(null);
        void cache.invalidateQueries({ queryKey: ['mentor'] });
      }
    } finally {
      setBusy(false);
    }
  }
  if (candidates.length < 2 && !pending) return null;
  return (
    <details className="mb-4 rounded-xl border border-line bg-canvas p-4">
      <summary className="cursor-pointer font-bold">Hoán đổi hai buổi trong trang lịch này</summary>
      <div className="mt-3 space-y-3">
        <p className="text-sm text-muted">
          Giữ nội dung và tài liệu của từng buổi, đổi ngày giờ cho nhau. Không cần quản lý duyệt.
        </p>
        <fieldset disabled={busy || !!pending} className="grid gap-3 sm:grid-cols-2">
          {[
            { value: first, set: setFirst, label: 'Buổi thứ nhất' },
            { value: second, set: setSecond, label: 'Buổi thứ hai' },
          ].map((p) => (
            <label key={p.label} className="space-y-2 text-sm">
              {p.label}
              <NativeSelect value={p.value} onChange={(e) => p.set(e.target.value)}>
                <NativeSelectOption value="">Chọn buổi</NativeSelectOption>
                {candidates.map((s) => (
                  <NativeSelectOption key={s.sessionId} value={s.sessionId}>
                    {s.title} · {new Date(s.startsAt).toLocaleString('vi-VN')}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </label>
          ))}
          <label className="space-y-2 text-sm sm:col-span-2">
            Lý do
            <Input maxLength={1000} value={reason} onChange={(e) => setReason(e.target.value)} />
          </label>
        </fieldset>
        <Button disabled={busy || !first || !second || !reason.trim()} onClick={() => void swap()}>
          {busy ? 'Đang đổi…' : pending ? 'Thử lại cùng yêu cầu' : 'Xác nhận hoán đổi'}
        </Button>
        {message && (
          <p role="status" className="text-sm">
            {message}
          </p>
        )}
      </div>
    </details>
  );
}
