'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowUpRight, ClipboardList, ExternalLink, Presentation, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LinkLoadingIcon } from '@/components/ui/link-loading-icon';
import { useAssignmentQuery } from '@/features/assignments/api/assignment-queries';
import { studentAssignmentPageSchema } from '@/features/assignments/schemas/assignment-contracts';
import { dateLabel, Pager } from '@/features/assignments/components/assignment-ui';
import { ApiError } from '@/lib/api/client';
import { StudentSessionMaterials } from './student-session-materials';
import { StudentSessionAttendance, StudentSessionDetails } from './student-session-ui';
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
      className="min-w-0 overflow-hidden rounded-2xl border border-line bg-canvas"
    >
      <h2 className="flex items-center gap-2.5 border-b border-line bg-soft/35 px-5 py-4 text-lg font-extrabold">
        <ClipboardList aria-hidden="true" className="size-5 text-mint" />
        Bài tập của buổi học
      </h2>
      <div className="p-4 sm:p-5">
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
                      className="flex min-h-20 min-w-0 items-center gap-3 rounded-lg px-2 py-3 hover:bg-soft focus-visible:outline-2 focus-visible:outline-mint"
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
                        <p className="mt-1 font-bold [overflow-wrap:anywhere]">{item.title}</p>
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
      </div>
    </section>
  );
}

export function StudentSessionResources(props: { event: ScheduleEvent }) {
  const query = useStudentSessionResources(props.event);
  const unavailable =
    props.event.accessMode === 'CASH_PREVIEW' ? (
      <p className="rounded-xl bg-peach p-4 text-sm">
        Chờ xác nhận thanh toán tiền mặt để mở bảng vẽ, phòng học và bài tập.
      </p>
    ) : props.event.sessionStatus === 'CANCELLED' || query.data?.cancelled ? (
      <p className="rounded-xl bg-soft p-4 text-sm">Buổi học đã hủy.</p>
    ) : query.isPending ? (
      <p role="status" className="rounded-2xl border border-line bg-canvas p-5 text-sm text-muted">
        Đang tải không gian buổi học…
      </p>
    ) : query.isError ? (
      <div role="alert" className="space-y-3 rounded-2xl border border-line bg-canvas p-5 text-sm">
        <p>
          {query.error instanceof ApiError && [403, 404].includes(query.error.status)
            ? 'Bạn chưa có quyền truy cập nội dung của buổi học này.'
            : 'Chưa tải được không gian buổi học. Vui lòng thử lại.'}
        </p>
        <Button variant="outline" onClick={() => void query.refetch()}>
          Thử lại buổi học
        </Button>
      </div>
    ) : null;
  const data = unavailable ? null : query.data;
  const meetingUrl = data?.meetingUrl;
  const canJoin = data?.status === 'SCHEDULED' || data?.status === 'IN_PROGRESS';
  return (
    <div className="grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_19rem]">
      <StudentSessionDetails event={props.event} />
      <aside
        aria-label="Công cụ và điểm danh buổi học"
        className="grid min-w-0 gap-4 sm:grid-cols-2 xl:col-start-2 xl:row-span-2 xl:row-start-1 xl:grid-cols-1"
      >
        {data && (
          <section
            aria-label="Không gian buổi học"
            className="min-w-0 rounded-2xl bg-forest p-5 text-canvas"
          >
            <h2 className="flex items-center gap-3 text-base font-extrabold">
              <Presentation aria-hidden="true" className="size-5 shrink-0" />
              Không gian buổi học
            </h2>
            <div className="mt-5 grid gap-2.5">
              <Button
                asChild
                variant="secondary"
                className="justify-start rounded-xl bg-canvas text-forest hover:bg-soft"
              >
                <Link href={`/whiteboards/${props.event.sessionId}`}>
                  <LinkLoadingIcon>
                    <Presentation aria-hidden="true" className="size-4" />
                  </LinkLoadingIcon>
                  Mở bảng vẽ
                </Link>
              </Button>
              {canJoin && props.event.deliveryMode === 'ONLINE' && meetingUrl ? (
                <Button
                  asChild
                  variant="unstyled"
                  className="justify-start rounded-xl border border-canvas/25 bg-canvas/10 text-canvas hover:bg-canvas/20"
                >
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
                <p className="mt-1 text-sm leading-6 text-canvas/85">
                  {!canJoin
                    ? 'Buổi học đã kết thúc.'
                    : props.event.deliveryMode === 'ONLINE'
                      ? 'Mentor chưa cập nhật link phòng học.'
                      : 'Học trực tiếp tại lớp.'}
                </p>
              )}
            </div>
          </section>
        )}
        <StudentSessionAttendance event={props.event} />
      </aside>
      <div className="min-w-0 space-y-5 xl:col-start-1">
        {unavailable}
        {data && (
          <>
            {data.unit && (
              <StudentSessionMaterials
                classId={props.event.classId}
                sessionId={props.event.sessionId}
                unit={data.unit}
              />
            )}
            {data.canViewAssignments ? (
              <SessionAssignments key={props.event.sessionId} event={props.event} />
            ) : (
              <p className="rounded-xl bg-soft p-4 text-sm">
                Bài tập của lớp dành cho học viên đăng ký chính thức. Bạn có thể xem bài tập tại lớp
                gốc trong mục Khóa học của tôi.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
