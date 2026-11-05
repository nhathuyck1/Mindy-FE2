'use client';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from '@/features/auth/api/auth-queries';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { apiRequest } from '@/lib/api/client';
import {
  bulkDeleteInputSchema,
  bulkDeleteResultSchema,
  cleanupStatsSchema,
  retentionMaterialsSchema,
  type retentionMaterialSchema,
} from '../schemas/operation-contracts';
import type { z } from 'zod';
type Item = z.infer<typeof retentionMaterialSchema>;
const bytes = (n: string) =>
  (Number(n) / 1048576).toLocaleString('vi-VN', { maximumFractionDigits: 2 }) + ' MiB';
export function MaterialRetentionPanel() {
  const session = useSession(),
    cache = useQueryClient();
  const [page, setPage] = useState(1),
    [unseen, setUnseen] = useState(true),
    [selected, setSelected] = useState<Item[]>([]),
    [confirm, setConfirm] = useState(false);
  const query = useQuery({
    queryKey: ['material-retention', session.data?.id, page, unseen],
    enabled: session.data?.role === 'MANAGER',
    retry: false,
    queryFn: ({ signal }) =>
      apiRequest({
        path: `manager/materials?page=${page}&pageSize=20${unseen ? '&unseen=true' : ''}`,
        schema: retentionMaterialsSchema,
        signal,
      }),
  });
  const stats = useQuery({
    queryKey: ['material-retention-stats', session.data?.id],
    enabled: session.data?.role === 'MANAGER',
    retry: false,
    queryFn: ({ signal }) =>
      apiRequest({ path: 'manager/materials/storage-cleanup', schema: cleanupStatsSchema, signal }),
  });
  const command = useMutation({
    mutationFn: () =>
      apiRequest({
        path: 'manager/materials/bulk-delete',
        method: 'POST',
        body: bulkDeleteInputSchema.parse({
          items: selected.map((m) => ({
            materialId: m.id,
            expectedRevision: m.revision,
            lastSeenAt: m.lastSeenAt,
            trackingStartedAt: m.trackingStartedAt,
          })),
        }),
        schema: bulkDeleteResultSchema,
      }),
    onSuccess: () => {
      setConfirm(false);
      setSelected([]);
      void cache.invalidateQueries({ queryKey: ['material-retention'] });
      void cache.invalidateQueries({ queryKey: ['material-retention-stats'] });
      void cache.invalidateQueries({ queryKey: ['manager'] });
    },
  });
  return (
    <section className="space-y-4 rounded-2xl border border-line bg-canvas p-4">
      <h2 className="text-xl font-bold">Tài liệu ít được mở</h2>
      <p className="text-sm text-muted">
        UNSEEN: chưa được học viên hoặc mentor mở trong 30 ngày. Chọn tài liệu để kiểm tra và xác
        nhận xóa.
      </p>
      {stats.data && (
        <p className="text-sm">
          Có thể thu hồi: {bytes(stats.data.reclaimableBytes)} · Đã thu hồi:{' '}
          {bytes(stats.data.reclaimedBytes)} · {stats.data.pendingFiles} tệp đang chờ ·{' '}
          {stats.data.failedFiles} tệp cần kiểm tra
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={unseen}
            onChange={(e) => {
              setUnseen(e.target.checked);
              setPage(1);
              setSelected([]);
            }}
          />
          Chỉ hiện UNSEEN
        </label>
        <Button
          variant="outline"
          disabled={query.isFetching}
          onClick={() => {
            setSelected([]);
            void query.refetch();
            void stats.refetch();
          }}
        >
          Tải lại
        </Button>
        <Button
          disabled={!selected.length || command.isPending}
          onClick={() => {
            command.reset();
            setConfirm(true);
          }}
        >
          Xóa {selected.length} tài liệu đã chọn
        </Button>
      </div>
      {query.isPending ? (
        <p role="status">Đang tải tài liệu…</p>
      ) : query.isError ? (
        <p role="alert">Chưa tải được kho tài liệu.</p>
      ) : !query.data?.items.length ? (
        <p>Không có tài liệu phù hợp.</p>
      ) : (
        <ul className="divide-y divide-line">
          {query.data.items.map((m) => (
            <li key={m.id} className="flex items-start gap-3 py-3">
              <input
                aria-label={`Chọn ${m.title}`}
                type="checkbox"
                className="mt-1"
                checked={selected.some((s) => s.id === m.id)}
                disabled={command.isPending}
                onChange={(e) =>
                  setSelected(
                    e.target.checked ? [...selected, m] : selected.filter((s) => s.id !== m.id),
                  )
                }
              />
              <div className="min-w-0">
                <p className="break-words font-bold">
                  {m.title}
                  {m.isUnseen ? ' · UNSEEN' : ''}
                </p>
                <p className="text-xs text-muted">
                  {m.lastSeenAt
                    ? `Mở gần nhất: ${new Date(m.lastSeenAt).toLocaleString('vi-VN')}`
                    : 'Chưa ghi nhận lượt mở'}{' '}
                  · {bytes(m.relatedSizeBytes)} · Phiên bản {m.revision}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          disabled={page === 1}
          onClick={() => {
            setPage((p) => p - 1);
            setSelected([]);
          }}
        >
          Trước
        </Button>
        <span>Trang {page}</span>
        <Button
          variant="outline"
          disabled={!query.data || page * 20 >= query.data.total}
          onClick={() => {
            setPage((p) => p + 1);
            setSelected([]);
          }}
        >
          Sau
        </Button>
      </div>
      {command.data && (
        <p role="status">
          {command.data.items.filter((m) => m.status === 'DELETED').length} tài liệu đã xóa;{' '}
          {command.data.items.filter((m) => m.status === 'STALE').length} tài liệu vừa thay đổi, cần
          kiểm tra lại.
        </p>
      )}
      {confirm && (
        <Modal
          title="Xác nhận xóa tài liệu"
          onClose={() => {
            if (!command.isPending) setConfirm(false);
          }}
        >
          <div className="space-y-4 p-5">
            <p>
              Xóa {selected.length} tài liệu sau đây? Tệp dùng chung còn được giữ; dung lượng chỉ
              được thu hồi sau khi worker dọn thành công.
            </p>
            <ul className="max-h-60 overflow-auto">
              {selected.map((m) => (
                <li key={m.id} className="break-words">
                  {m.title} · v{m.revision}
                </li>
              ))}
            </ul>
            {command.error && (
              <p role="alert">Xóa chưa hoàn tất. Tải lại danh sách trước khi thao tác tiếp.</p>
            )}
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={command.isPending}
                onClick={() => setConfirm(false)}
              >
                Hủy
              </Button>
              <Button disabled={command.isPending} onClick={() => command.mutate()}>
                {command.isPending ? 'Đang xóa…' : 'Xác nhận xóa'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </section>
  );
}
