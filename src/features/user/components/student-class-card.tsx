import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ClassOverviewCard } from '@/components/ui/class-overview-card';
import { deliveryLabel, formatDate } from '@/features/courses/lib/course-format';
import type { MyClass } from '../schemas/user-contracts';

export const classAccessLabels = {
  ACTIVE_ENROLLMENT: 'Đang học',
  PENDING_CASH: 'Chờ xác nhận tiền mặt',
  PENDING_PAYOS: 'Chờ thanh toán',
  HOLD_EXPIRED: 'Đã hết thời gian giữ chỗ',
  ENROLLMENT_CANCELLED: 'Đã hủy đăng ký',
  ENROLLMENT_COMPLETED: 'Đã hoàn thành',
  CLASS_CANCELLED: 'Lớp đã hủy',
  STATE_MISMATCH: 'Cần kiểm tra đăng ký',
};

export function StudentClassCard(props: { item: MyClass; onDetails?: () => void }) {
  const { item } = props;
  const preview = item.accessMode === 'CASH_PREVIEW';
  return (
    <ClassOverviewCard
      code={`${item.courseCode} · ${item.classCode}`}
      title={item.courseTitle}
      subtitle={`${item.className} · Mentor: ${item.mentor.displayName || 'Chưa cập nhật'}`}
      status={
        <span className="rounded-lg border border-mint/20 bg-canvas px-2.5 py-1 text-xs font-bold text-forest">
          {classAccessLabels[item.accessReason]}
        </span>
      }
      dates={`${formatDate(item.startDate)} – ${formatDate(item.endDate)}`}
      online={item.deliveryMode === 'ONLINE'}
      delivery={deliveryLabel(item.deliveryMode)}
      footer={
        <>
          {item.canViewClass && item.accessMode !== 'NONE' && (
            <Button asChild className="bg-mint text-canvas hover:bg-forest">
              <Link href={`/user/materials/${item.classId}${preview ? '?preview=true' : ''}`}>
                {preview ? 'Xem trước chương' : 'Vào học'}
                <ArrowUpRight aria-hidden="true" />
              </Link>
            </Button>
          )}
          {props.onDetails && (
            <>
              {item.canViewClass && item.accessMode === 'FULL' && (
                <Button asChild variant="outline">
                  <Link href={`/user/classes/${item.classId}/assignments`}>Bài tập</Link>
                </Button>
              )}
              <Button variant="outline" onClick={props.onDetails}>
                Xem chi tiết
              </Button>
            </>
          )}
        </>
      }
    />
  );
}
