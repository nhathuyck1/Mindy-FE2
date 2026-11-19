'use client';

import { useState } from 'react';
import { Check, RefreshCw } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useSession } from '@/features/auth/api/auth-queries';
import { apiRequest, ApiError } from '@/lib/api/client';
import { systemRuleSchema, systemRulesSchema } from '../schemas/system-rule-contracts';

export function AdminSystemRulesPage() {
  const actor = useSession();
  const client = useQueryClient();
  const [reason, setReason] = useState('');
  const [draftDemo, setDraftDemo] = useState<boolean | null>(null);
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
    onSuccess: async (updated) => {
      client.setQueryData(queryKey, (previous: typeof rules.data) =>
        previous?.map((item) => (item.key === updated.key ? updated : item)),
      );
      setReason('');
      setDraftDemo(null);
      setSaved(true);
      await client.invalidateQueries({ queryKey: ['mentor'] });
    },
    onSettled: () => client.invalidateQueries({ queryKey }),
  });
  const rule = rules.data?.find((item) => item.key === 'session_start_time_enforced');
  const busy = rules.isFetching || update.isPending;
  const demo = draftDemo ?? (rule ? !rule.value : false);
  const changed = rule !== undefined && demo === rule.value;

  function cancelEdit() {
    setDraftDemo(null);
    setReason('');
    update.reset();
  }

  return (
    <div className="w-full max-w-4xl space-y-6">
      <header className="admin-page-heading">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-[28px]">Cấu hình hệ thống</h1>
        <Button
          variant="unstyled"
          size="unstyled"
          className="admin-button"
          disabled={busy}
          onClick={() => {
            setSaved(false);
            void rules.refetch();
          }}
        >
          <RefreshCw
            aria-hidden="true"
            className={`size-4 ${rules.isFetching ? 'motion-safe:animate-spin' : ''}`}
          />
          Làm mới
        </Button>
      </header>
      {rules.isPending && (
        <div
          role="status"
          aria-label="Đang tải cấu hình"
          className="admin-table-panel space-y-4 p-6"
        >
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      )}
      {rules.isError && (
        <div role="alert" className="space-y-3 rounded-xl bg-peach p-5">
          <p>Chưa tải được cấu hình. Hãy thử lại trước khi thay đổi.</p>
          <Button variant="outline" onClick={() => rules.refetch()}>
            Thử lại
          </Button>
        </div>
      )}
      {rule && !rules.isError && (
        <section aria-labelledby="start-rule-title" className="admin-table-panel">
          <div className="border-b border-line px-5 py-4 sm:px-6">
            <h2 id="start-rule-title" className="text-base">
              Bắt đầu buổi học
            </h2>
          </div>
          <div className="p-5 sm:p-6">
            <div className="flex items-start justify-between gap-5">
              <div className="min-w-0">
                <h3 id="demo-label" className="text-base">
                  Chế độ demo
                </h3>
                <p id="demo-description" className="mt-1.5 max-w-lg text-sm leading-6 text-muted">
                  Cho phép giảng viên bắt đầu buổi học ngoài lịch.
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span
                  aria-hidden="true"
                  className="hidden text-sm font-medium text-muted sm:inline"
                >
                  {demo ? 'Bật' : 'Tắt'}
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={demo}
                  aria-labelledby="demo-label"
                  aria-describedby="demo-description"
                  aria-controls={changed ? 'demo-change-form' : undefined}
                  disabled={busy}
                  onClick={() => {
                    setDraftDemo(!demo);
                    setSaved(false);
                    update.reset();
                  }}
                  className="group flex min-h-11 w-12 shrink-0 cursor-pointer items-center disabled:cursor-wait disabled:opacity-50"
                >
                  <span
                    className={`flex h-7 w-12 items-center rounded-full px-1 transition-colors ${demo ? 'bg-mint group-hover:bg-forest' : 'bg-ink-gray group-hover:bg-ink-gray/90'}`}
                  >
                    <span
                      className={`size-5 rounded-full bg-canvas shadow-sm motion-safe:transition-transform ${demo ? 'translate-x-5' : ''}`}
                    />
                  </span>
                </button>
              </div>
            </div>
            <p
              role="status"
              className={`mt-4 text-sm ${!rule.value ? 'font-medium text-forest' : 'text-muted'}`}
            >
              {changed
                ? 'Thay đổi chưa được lưu.'
                : rule.value
                  ? 'Buổi học hiện bắt đầu theo lịch.'
                  : 'Demo đang bật cho tất cả lớp học.'}
            </p>
            <details className="mt-4 text-sm text-muted">
              <summary className="w-fit cursor-pointer rounded-sm font-medium underline-offset-4 hover:text-forest hover:underline">
                Điều kiện và lưu ý
              </summary>
              <ul className="mt-3 max-w-xl list-disc space-y-2 pl-5 leading-6">
                <li>Lớp vẫn cần ít nhất 3 học viên đã thanh toán và đang hoạt động.</li>
                <li>Buổi bắt đầu trong chế độ demo vẫn được ghi nhận như buổi học thật.</li>
                <li>Tắt chế độ demo sau khi hoàn tất để áp dụng lại lịch học.</li>
              </ul>
            </details>
          </div>
          {changed && (
            <form
              id="demo-change-form"
              className="space-y-4 border-t border-line bg-soft/50 p-5 sm:p-6"
              onSubmit={(event) => {
                event.preventDefault();
                if (busy || !reason.trim()) return;
                setSaved(false);
                update.mutate({
                  value: !demo,
                  expectedVersion: rule.version,
                  reason: reason.trim(),
                });
              }}
            >
              <p className="text-sm font-semibold">
                {demo ? 'Bật chế độ demo' : 'Tắt chế độ demo'}
              </p>
              {demo && (
                <p className="max-w-xl text-sm leading-6 text-forest">
                  Thay đổi áp dụng cho tất cả lớp. Buổi bắt đầu vẫn được ghi nhận như buổi học thật.
                </p>
              )}
              <label className="block max-w-xl space-y-2">
                <span className="text-sm font-medium">Lý do thay đổi</span>
                <textarea
                  required
                  maxLength={1000}
                  rows={2}
                  value={reason}
                  disabled={update.isPending}
                  placeholder="Nhập lý do để lưu vào lịch sử hoạt động"
                  onChange={(event) => {
                    setReason(event.target.value);
                    setSaved(false);
                  }}
                  className="block w-full resize-y rounded-lg border border-line bg-canvas p-3 text-sm leading-6 placeholder:text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint"
                />
              </label>
              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={busy || !reason.trim()} className="rounded-lg">
                  {update.isPending ? 'Đang lưu…' : 'Lưu thay đổi'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={update.isPending}
                  onClick={cancelEdit}
                >
                  Hủy
                </Button>
              </div>
            </form>
          )}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-5 py-3 text-xs text-muted sm:px-6">
            <p>
              Cập nhật{' '}
              {new Intl.DateTimeFormat('vi-VN', {
                dateStyle: 'short',
                timeStyle: 'short',
                timeZone: 'Asia/Ho_Chi_Minh',
              }).format(new Date(rule.updatedAt))}
            </p>
            {saved && (
              <p role="status" className="flex items-center gap-1.5 font-medium text-forest">
                <Check aria-hidden="true" className="size-3.5" />
                Đã lưu thay đổi
              </p>
            )}
          </div>
        </section>
      )}
      {!rules.isPending && !rules.isError && !rule && <p>Chưa có quy tắc bắt đầu buổi học.</p>}
      {update.isError && (
        <p role="alert" className="rounded-xl bg-peach p-4 text-sm leading-6">
          {update.error instanceof ApiError && update.error.status === 409
            ? 'Cấu hình đã được người khác thay đổi. Kiểm tra trạng thái mới rồi thử lại.'
            : 'Chưa xác nhận được thay đổi. Tải lại cấu hình để kiểm tra trước khi thử lại.'}
        </p>
      )}
    </div>
  );
}
