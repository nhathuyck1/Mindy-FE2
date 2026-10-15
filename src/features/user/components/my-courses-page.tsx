'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { MyClass } from '../schemas/user-contracts';
import { UserDetailsDialog } from './user-details-dialog';
import { Pagination } from '@/features/courses/components/shared/pagination';
import { deliveryLabel, formatDate } from '@/features/courses/lib/course-format';
import { useMyCourses } from '../api/user-queries';
import { UserDataState } from './user-data-state';
const views = [
  { value: 'current', label: 'Hiện tại' },
  { value: 'history', label: 'Lịch sử' },
  { value: 'all', label: 'Tất cả' },
] as const;
const reasons = {
  ACTIVE_ENROLLMENT: 'Đang học',
  PENDING_CASH: 'Chờ xác nhận tiền mặt',
  PENDING_PAYOS: 'Chờ thanh toán',
  HOLD_EXPIRED: 'Đã hết thời gian giữ chỗ',
  ENROLLMENT_CANCELLED: 'Đã hủy đăng ký',
  ENROLLMENT_COMPLETED: 'Đã hoàn thành',
  CLASS_CANCELLED: 'Lớp đã hủy',
  STATE_MISMATCH: 'Cần kiểm tra đăng ký',
};
export function MyCoursesPage() {
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<MyClass | null>(null);
  const [view, setView] = useState<'current' | 'history' | 'all'>('current');
  const query = useMyCourses(page, view);
  return (
    <>
      <h1 className="text-2xl font-extrabold sm:text-3xl">Khóa học của tôi</h1>
      <p className="mt-2 text-sm sm:text-base">Các lớp bạn đã đăng ký và tình trạng học tập.</p>
      <div role="group" aria-label="Lọc khóa học của tôi" className="my-6 flex flex-wrap gap-2">
        {views.map((item) => (
          <Button
            key={item.value}
            variant={view === item.value ? 'default' : 'outline'}
            aria-pressed={view === item.value}
            onClick={() => {
              setView(item.value);
              setPage(1);
              setSelected(null);
            }}
          >
            {item.label}
          </Button>
        ))}
      </div>
      {query.isPending ? (
        <UserDataState loading />
      ) : query.isError ? (
        <UserDataState error={query.error} retry={() => void query.refetch()} />
      ) : !query.data.items.length ? (
        <UserDataState empty="Chưa có khóa học trong danh sách này." />
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl border border-line bg-canvas">
            <div
              role="region"
              aria-label="Bảng khóa học của tôi"
              tabIndex={0}
              className="max-w-full overflow-x-auto"
            >
              <table className="w-full min-w-[1000px] border-collapse text-left text-sm">
                <caption className="sr-only">Danh sách khóa học đã đăng ký</caption>
                <thead className="border-b border-line bg-soft">
                  <tr>
                    {[
                      'Khóa học',
                      'Lớp học',
                      'Hình thức',
                      'Thời gian',
                      'Trạng thái',
                      'Thao tác',
                    ].map((label) => (
                      <th
                        key={label}
                        scope="col"
                        className="px-5 py-4 font-extrabold whitespace-nowrap"
                      >
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {query.data.items.map((item) => (
                    <tr key={item.enrollmentId} className="hover:bg-soft/50">
                      <th scope="row" className="max-w-64 px-5 py-3 font-normal">
                        <p className="text-xs font-bold text-mint">{item.courseCode}</p>
                        <p className="mt-1 line-clamp-2 font-bold">{item.courseTitle}</p>
                      </th>
                      <td className="max-w-64 px-5 py-3">
                        <p className="line-clamp-2">{item.className}</p>
                        <p className="mt-1 text-xs text-muted">{item.classCode}</p>
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        {deliveryLabel(item.deliveryMode)}
                      </td>
                      <td className="px-5 py-3 text-xs whitespace-nowrap">
                        <p>{formatDate(item.startDate)}</p>
                        <p className="mt-1">– {formatDate(item.endDate)}</p>
                      </td>
                      <td className="px-5 py-3">
                        <span className="inline-flex rounded-lg bg-soft px-3 py-2 text-xs font-bold">
                          {reasons[item.accessReason]}
                        </span>
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        <Button variant="outline" onClick={() => setSelected(item)}>
                          Xem chi tiết
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <Pagination
            page={page}
            totalPages={Math.ceil(query.data.total / query.data.pageSize)}
            onChange={(page) => {
              setPage(page);
              setSelected(null);
            }}
            comfortable
          />
        </>
      )}
      {selected && (
        <UserDetailsDialog title="Chi tiết khóa học của tôi" onClose={() => setSelected(null)}>
          <div>
            <p className="text-sm font-bold text-mint">{selected.courseCode}</p>
            <h3 className="mt-2 text-xl font-extrabold">{selected.courseTitle}</h3>
            <p className="mt-3 inline-flex rounded-lg bg-soft px-3 py-2 text-xs font-bold">
              {reasons[selected.accessReason]}
            </p>
          </div>
          <dl className="grid gap-5 border-t border-line pt-5 text-sm sm:grid-cols-2">
            {[
              ['Lớp học', selected.className],
              ['Mã lớp', selected.classCode],
              ['Hình thức', deliveryLabel(selected.deliveryMode)],
              ['Mentor', selected.mentor.displayName || 'Chưa cập nhật mentor'],
              ['Ngày bắt đầu', formatDate(selected.startDate)],
              ['Ngày kết thúc', formatDate(selected.endDate)],
              ['Ngày đăng ký', formatDate(selected.createdAt)],
              [
                'Ngày kích hoạt',
                selected.enrolledAt ? formatDate(selected.enrolledAt) : 'Chưa kích hoạt',
              ],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-muted">{label}</dt>
                <dd className="mt-1 break-words font-bold">{value}</dd>
              </div>
            ))}
          </dl>
          {selected.order && (
            <p className="rounded-xl bg-soft p-4 text-sm">
              Mã đơn hàng: <strong>{selected.order.orderCode}</strong>
            </p>
          )}
          {selected.order?.requiresReview && (
            <p className="rounded-xl bg-peach p-4 text-sm">
              Đơn hàng đang được đối soát. Vui lòng chờ xác nhận.
            </p>
          )}
          <div className="flex flex-wrap gap-3 border-t border-line pt-5">
            {selected.canViewClass && selected.accessMode !== 'NONE' && (
              <Button asChild>
                <Link
                  href={`/user/materials/${selected.classId}${selected.accessMode === 'CASH_PREVIEW' ? '?preview=true' : ''}`}
                >
                  {selected.accessMode === 'FULL' ? 'Vào học' : 'Xem trước chương'}
                </Link>
              </Button>
            )}
            <Button asChild variant="outline">
              <Link href={'/courses/' + selected.courseId}>Thông tin khóa học</Link>
            </Button>
            {selected.canViewSchedule && (
              <Button asChild>
                <Link href="/user/schedule">Xem lịch học</Link>
              </Button>
            )}
          </div>
        </UserDetailsDialog>
      )}
    </>
  );
}
