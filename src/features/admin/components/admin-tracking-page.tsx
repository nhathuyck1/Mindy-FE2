'use client';

import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Pagination } from '@/features/courses/components/shared/pagination';
import { useAdminTracking, useAdminTrackingDetail } from '../api/admin-queries';
import { AdminQueryState } from './admin-query-state';
import {
  trackingSources,
  trackingSourceSchema,
  type AdminTrackingEvent,
} from '../schemas/admin-read-contracts';

const sourceLabels: Record<(typeof trackingSources)[number], string> = {
  material_audit_events: 'Tài liệu',
  teaching_assignment_audits: 'Phân công giảng dạy',
  session_lifecycle_audits: 'Trạng thái buổi học',
  session_schedule_audits: 'Lịch buổi học',
  attendance_audits: 'Điểm danh',
  guest_attendance_audits: 'Điểm danh học bù',
  makeup_placement_audits: 'Sắp xếp học bù',
  mentor_leave_audits: 'Nghỉ của giảng viên',
  teaching_note_audits: 'Ghi chú giảng dạy',
  class_unit_release_audit: 'Phát hành chương',
  session_meeting_audits: 'Phòng học trực tuyến',
  attendance_recovery_audits: 'Khôi phục điểm danh',
};
const actionLabels: Record<string, string> = {
  CREATE: 'Tạo mới',
  UPDATE: 'Cập nhật',
  DELETE: 'Xóa',
  APPROVE: 'Duyệt',
  REJECT: 'Từ chối',
  ASSIGN: 'Phân công',
  REASSIGN: 'Điều chỉnh phân công',
  START: 'Bắt đầu',
  COMPLETE: 'Hoàn thành',
  CANCEL: 'Hủy',
  MARK: 'Ghi nhận',
  RECOVER: 'Khôi phục',
};
const localDateToIso = (value: string) => (value ? `${value}:00+07:00` : undefined);
const formatUtc7 = (value: string) =>
  new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    dateStyle: 'short',
    timeStyle: 'medium',
  }).format(new Date(value));

function TrackingDetail(props: { event: AdminTrackingEvent; onClose: () => void }) {
  const query = useAdminTrackingDetail(props.event.source, props.event.id, true);
  return (
    <Modal title="Chi tiết hoạt động" onClose={props.onClose}>
      <div className="space-y-5 p-5 sm:p-6">
        <AdminQueryState
          loading={query.isPending}
          error={query.error}
          onRetry={() => void query.refetch()}
          columns={1}
          variant="modal"
        />
        {query.data && (
          <>
            <dl className="grid gap-4 border-b border-line pb-5 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted">Nhóm hoạt động</dt>
                <dd className="mt-1 break-words font-bold">
                  {sourceLabels[query.data.source] ?? query.data.source}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Hành động</dt>
                <dd className="mt-1 break-words font-bold">
                  {actionLabels[query.data.action] ?? query.data.action}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Người thực hiện</dt>
                <dd className="mt-1 break-words font-bold">
                  {query.data.actor?.displayName || query.data.actor?.id || 'Hệ thống'}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Thời gian (UTC+7)</dt>
                <dd className="mt-1 font-bold">{formatUtc7(query.data.occurredAt)}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-muted">Đối tượng</dt>
                <dd className="mt-1 break-all font-bold">
                  {query.data.entityType} · {query.data.entityId ?? 'Chưa xác định'}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-muted">Lý do</dt>
                <dd className="mt-1 break-words font-bold">{query.data.reason || 'Không có'}</dd>
              </div>
            </dl>
            <section>
              <h2 className="font-extrabold">Dữ liệu sự kiện</h2>
              <pre className="mt-2 max-h-80 overflow-auto rounded-xl border border-line bg-soft p-4 text-xs leading-5 whitespace-pre-wrap break-all">
                {JSON.stringify(query.data.data, null, 2) ?? 'Không có dữ liệu'}
              </pre>
            </section>
            <section>
              <h2 className="font-extrabold">Bằng chứng</h2>
              {query.data.evidenceItems.length ? (
                <pre className="mt-2 max-h-80 overflow-auto rounded-xl border border-line bg-soft p-4 text-xs leading-5 whitespace-pre-wrap break-all">
                  {JSON.stringify(query.data.evidenceItems, null, 2)}
                </pre>
              ) : (
                <p className="mt-2 rounded-xl bg-soft p-4 text-sm">Không có bằng chứng đính kèm.</p>
              )}
            </section>
          </>
        )}
      </div>
    </Modal>
  );
}

export function AdminTrackingPage() {
  const [sourceDraft, setSourceDraft] = useState('');
  const [fromDraft, setFromDraft] = useState('');
  const [toDraft, setToDraft] = useState('');
  const [source, setSource] = useState('');
  const [from, setFrom] = useState<string | undefined>();
  const [to, setTo] = useState<string | undefined>();
  const [rangeError, setRangeError] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selected, setSelected] = useState<AdminTrackingEvent | null>(null);
  const query = useAdminTracking({
    page,
    pageSize,
    ...(source ? { source: trackingSourceSchema.parse(source) } : {}),
    ...(from ? { from } : {}),
    ...(to ? { to } : {}),
  });

  const applyFilters = () => {
    const nextFrom = localDateToIso(fromDraft);
    const nextTo = localDateToIso(toDraft);
    if (nextFrom && nextTo && Date.parse(nextFrom) >= Date.parse(nextTo)) {
      setRangeError('Thời điểm bắt đầu phải trước thời điểm kết thúc.');
      return;
    }
    setRangeError('');
    setSource(sourceDraft);
    setFrom(nextFrom);
    setTo(nextTo);
    setPage(1);
  };
  const clearFilters = () => {
    setSourceDraft('');
    setFromDraft('');
    setToDraft('');
    setSource('');
    setFrom(undefined);
    setTo(undefined);
    setRangeError('');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <header className="admin-page-heading">
        <div>
          <p className="eyebrow text-muted">Mindy / Quản trị</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight">Lịch sử hoạt động</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Tra cứu lịch sử thay đổi do người dùng và hệ thống ghi nhận.
          </p>
        </div>
        <Button variant="outline" disabled={query.isFetching} onClick={() => void query.refetch()}>
          <RefreshCw aria-hidden="true" className="size-4" />
          Làm mới
        </Button>
      </header>

      <section className="admin-table-panel p-4 sm:p-5" aria-label="Bộ lọc lịch sử hoạt động">
        <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(180px,1fr)_minmax(180px,1fr)_minmax(180px,1fr)_auto_auto] xl:items-end">
          <label className="min-w-0 text-sm font-bold">
            Nhóm hoạt động
            <NativeSelect
              aria-label="Nhóm hoạt động"
              wrapperClassName="mt-2 w-full"
              className="h-12 w-full py-2 text-base leading-6"
              value={sourceDraft}
              onChange={(event) => setSourceDraft(event.target.value)}
            >
              <NativeSelectOption value="">Tất cả nhóm</NativeSelectOption>
              {trackingSources.map((item) => (
                <NativeSelectOption key={item} value={item}>
                  {sourceLabels[item]}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </label>
          <label className="min-w-0 text-sm font-bold">
            Từ thời điểm (UTC+7)
            <input
              aria-label="Từ thời điểm"
              type="datetime-local"
              value={fromDraft}
              onChange={(event) => setFromDraft(event.target.value)}
              className="mt-2 h-12 w-full min-w-0 rounded-lg border border-line bg-canvas px-3 text-sm"
            />
          </label>
          <label className="min-w-0 text-sm font-bold">
            Đến thời điểm (UTC+7)
            <input
              aria-label="Đến thời điểm"
              type="datetime-local"
              value={toDraft}
              onChange={(event) => setToDraft(event.target.value)}
              className="mt-2 h-12 w-full min-w-0 rounded-lg border border-line bg-canvas px-3 text-sm"
            />
          </label>
          <Button className="h-12" onClick={applyFilters}>
            Áp dụng
          </Button>
          <Button className="h-12" variant="outline" onClick={clearFilters}>
            Xóa lọc
          </Button>
        </div>
        {rangeError && (
          <p className="mt-3 text-sm font-semibold text-coral" role="alert">
            {rangeError}
          </p>
        )}
      </section>

      <section className="admin-table-panel" aria-label="Bảng lịch sử hoạt động">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4 sm:p-5">
          <div>
            <h2 className="font-extrabold">Sự kiện</h2>
            <p className="mt-1 text-sm text-muted">Thời gian hiển thị theo giờ Việt Nam (UTC+7).</p>
          </div>
          <label className="flex min-h-11 items-center gap-2 text-sm font-semibold">
            Số dòng
            <NativeSelect
              aria-label="Số dòng mỗi trang"
              className="h-11 py-2"
              value={String(pageSize)}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setPage(1);
              }}
            >
              {[10, 20, 50].map((size) => (
                <NativeSelectOption key={size} value={String(size)}>
                  {size}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </label>
        </div>
        {query.isPending || query.isError ? (
          <AdminQueryState
            loading={query.isPending}
            error={query.error}
            onRetry={() => void query.refetch()}
            columns={6}
          />
        ) : !query.data.items.length ? (
          <p
            className="grid min-h-56 place-items-center p-6 text-center text-sm text-muted"
            role="status"
          >
            Không có hoạt động phù hợp với bộ lọc.
          </p>
        ) : (
          <>
            <div
              role="region"
              aria-label="Bảng dữ liệu lịch sử"
              tabIndex={0}
              className="max-w-full overflow-x-auto"
            >
              <table className="admin-data-table min-w-[980px]">
                <caption className="sr-only">Lịch sử hoạt động của hệ thống</caption>
                <thead>
                  <tr>
                    <th scope="col">Thời gian</th>
                    <th scope="col">Nhóm hoạt động</th>
                    <th scope="col">Hành động</th>
                    <th scope="col">Người thực hiện</th>
                    <th scope="col">Đối tượng</th>
                    <th scope="col">Lý do</th>
                    <th scope="col">Chi tiết</th>
                  </tr>
                </thead>
                <tbody>
                  {query.data.items.map((item) => (
                    <tr key={`${item.source}:${item.id}`}>
                      <td>{formatUtc7(item.occurredAt)}</td>
                      <td className="whitespace-normal">
                        {sourceLabels[item.source] ?? item.source}
                      </td>
                      <td className="whitespace-normal">
                        {actionLabels[item.action] ?? item.action}
                      </td>
                      <td className="whitespace-normal">
                        {item.actor?.displayName || item.actor?.id || 'Hệ thống'}
                      </td>
                      <td className="whitespace-normal">
                        {item.entityType}
                        <span
                          className="block max-w-44 truncate text-xs text-muted"
                          title={item.entityId ?? ''}
                        >
                          {item.entityId ?? 'Chưa xác định'}
                        </span>
                      </td>
                      <td className="max-w-64 whitespace-normal">{item.reason || '—'}</td>
                      <td>
                        <Button variant="outline" onClick={() => setSelected(item)}>
                          Xem chi tiết
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-line px-4 pb-1 sm:px-5">
              <Pagination
                page={page}
                totalPages={Math.ceil(query.data.total / query.data.pageSize)}
                onChange={setPage}
                comfortable
              />
            </div>
          </>
        )}
      </section>
      {selected && <TrackingDetail event={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
