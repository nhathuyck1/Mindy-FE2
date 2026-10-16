'use client';
import Link from 'next/link';
import { useState } from 'react';
import { BookOpen, ArrowUpRight } from 'lucide-react';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { useMentorQuery } from '../api/mentor-queries';
import { mentorClassPageSchema } from '../schemas/mentor-contracts';
import {
  MentorHeading,
  MentorPagination,
  MentorQueryState,
  MentorStatus,
  mentorDate,
  mentorLabels,
} from './mentor-shared';
export function MentorClassesPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const classes = useMentorQuery(
    `mentor/classes?page=${page}&pageSize=20${status ? `&status=${status}` : ''}`,
    mentorClassPageSchema,
  );
  return (
    <>
      <MentorHeading
        title="Lớp của tôi"
        description="Các lớp bạn đang được phân công. Mở lớp để xem học viên, chuẩn bị học liệu và quản lý quyền truy cập chương."
      />
      <div className="mb-5 max-w-xs">
        <label htmlFor="mentor-class-status" className="mb-2 block text-sm font-bold">
          Trạng thái lớp
        </label>
        <NativeSelect
          id="mentor-class-status"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <NativeSelectOption value="">Tất cả trạng thái</NativeSelectOption>
          {['DRAFT', 'OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map((v) => (
            <NativeSelectOption key={v} value={v}>
              {mentorLabels[v]}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>
      <MentorQueryState
        pending={classes.isPending}
        error={classes.error}
        retry={classes.refetch}
        empty={classes.data?.items.length === 0}
      >
        <div className="grid gap-5 xl:grid-cols-2">
          {classes.data?.items.map((item) => (
            <Link
              key={item.id}
              href={`/mentor/classes/${item.id}`}
              className="rounded-2xl border border-line bg-canvas p-6 transition-colors hover:border-mint"
            >
              <div className="flex items-center justify-between gap-3">
                <BookOpen className="size-7 text-mint" />
                <MentorStatus value={item.status} />
              </div>
              <p className="mt-6 text-sm font-bold text-mint">{item.code}</p>
              <h2 className="mt-2 text-xl font-extrabold break-words">{item.name}</h2>
              <p className="mt-4 text-sm text-muted">
                {mentorDate(item.startDate, false)} – {mentorDate(item.endDate, false)} ·{' '}
                {item.deliveryMode === 'ONLINE' ? 'Trực tuyến' : 'Tại lớp'}
              </p>
              <div className="mt-6 flex items-center justify-between border-t border-line pt-4 text-sm">
                <span>Sĩ số tối đa: {item.maxStudents}</span>
                <span className="inline-flex items-center gap-2 font-bold text-mint">
                  Vào lớp
                  <ArrowUpRight className="size-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </MentorQueryState>
      {classes.data && (
        <MentorPagination page={page} total={classes.data.total} onChange={setPage} />
      )}
    </>
  );
}
