'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { classOverviewGrid } from '@/components/ui/class-overview-card';
import { StudentClassCard, classAccessLabels } from './student-class-card';
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
export function MyCoursesPage() {
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<MyClass | null>(null);
  const [view, setView] = useState<'current' | 'history' | 'all'>('current');
  const query = useMyCourses(page, view);
  return (
    <>
      <header className="mb-7">
        <p className="eyebrow text-mint">Mindy · Học viên</p>
        <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">Khóa học của tôi</h1>
        <p className="mt-3 text-base text-muted">Các lớp bạn đã đăng ký và tình trạng học tập.</p>
      </header>
      <div
        role="group"
        aria-label="Lọc khóa học của tôi"
        className="mb-6 flex flex-wrap gap-2 rounded-2xl border border-line bg-soft/50 p-4 sm:p-5"
      >
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
          <div className={classOverviewGrid}>
            {query.data.items.map((item) => (
              <StudentClassCard
                key={item.enrollmentId}
                item={item}
                onDetails={() => setSelected(item)}
              />
            ))}
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
              {classAccessLabels[selected.accessReason]}
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
            {(selected.accessReason === 'ACTIVE_ENROLLMENT' ||
              selected.accessReason === 'PENDING_CASH' ||
              selected.accessReason === 'ENROLLMENT_COMPLETED') && (
              <Button asChild variant="outline">
                <Link href={`/user/messages?classId=${selected.classId}`}>Chat lớp</Link>
              </Button>
            )}
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
