'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  ArrowUpRight,
  BookOpen,
  ClipboardList,
  ExternalLink,
  PanelsTopLeft,
  Video,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAssignmentQuery } from '@/features/assignments/api/assignment-queries';
import { studentAssignmentPageSchema } from '@/features/assignments/schemas/assignment-contracts';
import { dateLabel, Pager } from '@/features/assignments/components/assignment-ui';
import { ApiError } from '@/lib/api/client';
import { useStudentSessionResources } from '../api/student-session';
import type { ScheduleEvent } from '../schemas/user-contracts';

function SessionAssignments(props: { event: ScheduleEvent }) {
  const [page, setPage] = useState(1);
  const query = useAssignmentQuery(
    `me/classes/${props.event.classId}/assignments?sessionId=${props.event.sessionId}&page=${page}&pageSize=20`,
    studentAssignmentPageSchema,
  );
  return (
    <section
      aria-label="Bài tập của buổi học"
      className="rounded-2xl border border-line p-4 sm:p-5"
    >
      <h3 className="flex items-center gap-2 text-base font-extrabold">
        <ClipboardList aria-hidden="true" className="size-5 text-mint" />
        Bài tập của buổi học
      </h3>
      {query.isPending ? (
        <p role="status" className="mt-4 text-sm text-muted">
          Đang tải bài tập…
        </p>
      ) : query.isError ? (
        <div role="alert" className="mt-4 space-y-2 text-sm">
          <p>Chưa tải được bài tập của buổi học.</p>
          <Button variant="outline" onClick={() => void query.refetch()}>
            Thử lại bài tập
          </Button>
        </div>
      ) : (
        <>
          {query.data.items.length ? (
            <ul className="mt-3 divide-y divide-line">
              {query.data.items.map((item) => (
                <li key={item.id}>
                  <Link
                    href={`/user/assignments/${item.id}?classId=${props.event.classId}`}
                    className="flex min-h-20 min-w-0 items-center gap-3 rounded-lg py-3 hover:bg-soft focus-visible:outline-2 focus-visible:outline-mint"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-mint">
                        {
                          { QUIZ: 'Trắc nghiệm', ZIP: 'Bài nộp ZIP', CODE: 'Bài tập lập trình' }[
                            item.type
                          ]
                        }
                        {' · '}
                        {item.purpose === 'HOMEWORK' ? 'Bài về nhà' : 'Kiểm tra'}
                      </p>
                      <p className="mt-1 break-words font-bold">{item.title}</p>
                      <p className="mt-1 text-xs text-muted">Hạn nộp: {dateLabel(item.dueAt)}</p>
                    </div>
                    <ArrowUpRight aria-hidden="true" className="size-5 shrink-0 text-mint" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-muted">Chưa có bài tập được giao cho buổi học này.</p>
          )}
          <Pager
            page={page}
            total={query.data.total}
            pageSize={query.data.pageSize}
            onChange={setPage}
          />
        </>
      )}
    </section>
  );
}

export function StudentSessionResources(props: { event: ScheduleEvent }) {
  const query = useStudentSessionResources(props.event);
  if (props.event.accessMode === 'CASH_PREVIEW')
    return (
      <p className="rounded-xl bg-peach p-4 text-sm">
        Chờ xác nhận thanh toán tiền mặt để mở bảng vẽ, phòng học và bài tập.
      </p>
    );
  if (props.event.sessionStatus === 'CANCELLED' || query.data?.cancelled)
    return <p className="rounded-xl bg-soft p-4 text-sm">Buổi học đã hủy.</p>;
  if (query.isPending)
    return (
      <p role="status" className="text-sm text-muted">
        Đang tải không gian buổi học…
      </p>
    );
  if (query.isError)
    return (
      <div role="alert" className="space-y-3 rounded-xl border border-line p-4 text-sm">
        <p>
          {query.error instanceof ApiError && [403, 404].includes(query.error.status)
            ? 'Bạn chưa có quyền truy cập nội dung của buổi học này.'
            : 'Chưa tải được không gian buổi học. Vui lòng thử lại.'}
        </p>
        <Button variant="outline" onClick={() => void query.refetch()}>
          Thử lại buổi học
        </Button>
      </div>
    );
  const meetingUrl = query.data.meetingUrl;
  const canJoin = query.data.status === 'SCHEDULED' || query.data.status === 'IN_PROGRESS';
  return (
    <div className="min-w-0 space-y-4">
      <section
        aria-label="Không gian buổi học"
        className="rounded-2xl bg-forest p-4 text-white sm:p-5"
      >
        <h3 className="font-extrabold">Không gian buổi học</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Button asChild className="justify-start bg-white text-forest hover:bg-soft">
            <Link href={`/whiteboards/${props.event.sessionId}`}>
              <PanelsTopLeft aria-hidden="true" className="size-4" />
              Mở bảng vẽ
            </Link>
          </Button>
          {canJoin && props.event.deliveryMode === 'ONLINE' && meetingUrl ? (
            <Button asChild className="justify-start bg-white text-forest hover:bg-soft">
              <a
                href={meetingUrl}
                target="_blank"
                rel="noopener noreferrer"
                referrerPolicy="no-referrer"
              >
                <Video aria-hidden="true" className="size-4" />
                Vào phòng học
                <ExternalLink aria-hidden="true" className="ml-auto size-3.5" />
              </a>
            </Button>
          ) : (
            <p className="flex min-h-11 items-center text-sm text-white/85">
              {!canJoin
                ? 'Buổi học đã kết thúc.'
                : props.event.deliveryMode === 'ONLINE'
                  ? 'Mentor chưa cập nhật link phòng học.'
                  : 'Học trực tiếp tại lớp.'}
            </p>
          )}
        </div>
        {props.event.accessMode === 'FULL' && (
          <Link
            href={`/user/materials/${props.event.classId}`}
            className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-bold underline underline-offset-4"
          >
            <BookOpen aria-hidden="true" className="size-4" />
            Tài liệu của lớp
          </Link>
        )}
      </section>
      {query.data.canViewAssignments ? (
        <SessionAssignments key={props.event.sessionId} event={props.event} />
      ) : (
        <p className="rounded-xl bg-soft p-4 text-sm">
          Bài tập của lớp dành cho học viên đăng ký chính thức. Bạn có thể xem bài tập tại lớp gốc
          trong mục Khóa học của tôi.
        </p>
      )}
    </div>
  );
}
