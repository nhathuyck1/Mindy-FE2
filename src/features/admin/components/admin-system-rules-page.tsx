'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { useSession } from '@/features/auth/api/auth-queries';
import { apiRequest, ApiError } from '@/lib/api/client';
import { systemRuleSchema, systemRulesSchema } from '../schemas/system-rule-contracts';

export function AdminSystemRulesPage() {
  const actor = useSession();
  const client = useQueryClient();
  const [reason, setReason] = useState('');
  const [saved, setSaved] = useState(false);
  const queryKey = ['admin', 'system-rules', actor.data?.id];
  const rules = useQuery({
    queryKey,
    enabled: actor.data?.role === 'ADMIN' && actor.data.status === 'ACTIVE',
    retry: false,
    staleTime: 0,
    queryFn: ({ signal }) =>
      apiRequest({ path: 'admin/system-rules', schema: systemRulesSchema, signal }),
  });
  const update = useMutation({
    retry: false,
    mutationFn: (input: { value: boolean; expectedVersion: number; reason: string }) =>
      apiRequest({
        path: 'admin/system-rules/session_start_time_enforced',
        method: 'PATCH',
        body: input,
        schema: systemRuleSchema,
      }),
    onSuccess: async () => {
      setReason('');
      setSaved(true);
      await client.invalidateQueries({ queryKey: ['mentor'] });
    },
    onSettled: () => client.invalidateQueries({ queryKey }),
  });
  const rule = rules.data?.find((item) => item.key === 'session_start_time_enforced');
  const busy = rules.isFetching || update.isPending;
  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-4 sm:p-8">
      <div>
        <h1 className="text-2xl font-extrabold text-forest">Cấu hình hệ thống</h1>
        <p className="mt-2 text-muted">Quản lý các quy tắc áp dụng cho toàn hệ thống.</p>
      </div>
      {rules.isPending && <p role="status">Đang tải cấu hình…</p>}
      {rules.isError && (
        <div role="alert" className="space-y-3 rounded-xl bg-peach p-4">
          <p>Chưa tải được cấu hình. Hãy thử lại trước khi thay đổi.</p>
          <Button variant="outline" onClick={() => rules.refetch()}>
            Thử lại
          </Button>
        </div>
      )}
      {rule && !rules.isError && (
        <section
          aria-labelledby="start-rule-title"
          className="rounded-2xl border border-line bg-canvas p-5 sm:p-6"
        >
          <h2 id="start-rule-title" className="text-lg font-bold">
            Kiểm tra ngày/giờ bắt đầu buổi học
          </h2>
          <p className="mt-2 leading-7 text-muted">
            Khi tắt, giảng viên có thể bắt đầu buổi học ngoài lịch để demo. Lớp vẫn phải đủ điều
            kiện khai giảng, gồm tối thiểu 3 học viên đã thanh toán đang hoạt động.
          </p>
          <p role="status" className="mt-4 font-semibold text-forest">
            {rule.value
              ? 'Đang bật · Bắt đầu theo lịch học'
              : 'Đang tắt · Cho phép bắt đầu ngoài lịch'}
          </p>
          {!rule.value && (
            <p className="mt-3 rounded-xl bg-peach p-3">
              Chế độ demo đang áp dụng cho tất cả lớp học. Bật lại rule khi demo xong. Buổi đã bắt
              đầu vẫn được lưu như buổi học thật.
            </p>
          )}
          <form
            className="mt-5 space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (busy || !reason.trim()) return;
              setSaved(false);
              update.mutate({
                value: !rule.value,
                expectedVersion: rule.version,
                reason: reason.trim(),
              });
            }}
          >
            <label className="block space-y-2">
              <span className="font-semibold">Lý do thay đổi</span>
              <textarea
                required
                maxLength={1000}
                rows={2}
                value={reason}
                disabled={update.isPending}
                onChange={(event) => {
                  setReason(event.target.value);
                  setSaved(false);
                }}
                className="w-full rounded-xl border border-line bg-canvas p-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint"
              />
            </label>
            <Button type="submit" disabled={busy || !reason.trim()}>
              {update.isPending
                ? 'Đang lưu…'
                : rule.value
                  ? 'Tắt rule để demo'
                  : 'Bật lại rule theo lịch'}
            </Button>
          </form>
          <p className="mt-4 text-sm text-muted">
            Cập nhật:{' '}
            {new Intl.DateTimeFormat('vi-VN', {
              dateStyle: 'short',
              timeStyle: 'short',
              timeZone: 'Asia/Ho_Chi_Minh',
            }).format(new Date(rule.updatedAt))}
          </p>
        </section>
      )}
      {!rules.isPending && !rules.isError && !rule && <p>Chưa có quy tắc bắt đầu buổi học.</p>}
      {saved && (
        <p role="status" className="text-forest">
          Đã lưu cấu hình hệ thống.
        </p>
      )}
      {update.isError && (
        <p role="alert" className="rounded-xl bg-peach p-4">
          {update.error instanceof ApiError && update.error.status === 409
            ? 'Cấu hình đã được người khác thay đổi. Kiểm tra trạng thái mới rồi thử lại.'
            : 'Chưa xác nhận được thay đổi. Tải lại cấu hình để kiểm tra trước khi thử lại.'}
        </p>
      )}
      <Button
        variant="outline"
        disabled={busy}
        onClick={() => {
          setSaved(false);
          rules.refetch();
        }}
      >
        Tải lại cấu hình
      </Button>
    </div>
  );
}
