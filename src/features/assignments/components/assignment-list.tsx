'use client';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ClipboardList, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NativeSelect } from '@/components/ui/native-select';
import { useAssignmentQuery, useAssignmentSessions } from '../api/assignment-queries';
import * as dto from '../schemas/assignment-contracts';
import { AssignmentListItem } from './assignment-list-item';
import {
  AssignmentHeading,
  QueryState,
  Pager,
  dateLabel,
  panelClass,
  assignmentRootClass,
} from './assignment-ui';
import { AssignmentCreate } from './assignment-metadata-form';
import { AssignmentCounts } from './assignment-reports';

export function AssignmentList(props: {
  classId?: string;
  sessionId?: string;
  mentor?: boolean;
  canCreate?: boolean;
  reports?: boolean;
  embedded?: boolean;
}) {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const role = props.mentor ? 'MENTOR' : 'STUDENT';
  const sessions = useAssignmentSessions(props.classId, Boolean(props.mentor));
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const refresh = () => setNow(Date.now());
    const timer = window.setInterval(refresh, 60_000);
    window.addEventListener('focus', refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', refresh);
    };
  }, []);
  const queryParams = new URLSearchParams();
  for (const key of ['page', 'type', 'purpose', 'status', 'sessionId']) {
    const value = params.get(key);
    if (value) queryParams.set(key, value);
  }
  const parsed = dto.assignmentQuerySchema.safeParse(Object.fromEntries(queryParams));
  const page = parsed.success ? parsed.data.page : 1;
  const id = props.sessionId ?? props.classId;
  const valid = dto.uuid.safeParse(id).success && parsed.success;
  const path = `${props.mentor ? 'mentor' : 'me'}/${props.sessionId ? 'class-sessions' : 'classes'}/${id}/assignments?${queryParams}`;
  const query = useAssignmentQuery(
    path,
    props.mentor ? dto.mentorAssignmentPageSchema : dto.studentAssignmentPageSchema,
    valid,
    role,
  );
  function change(key: string, value: string) {
    const next = new URLSearchParams(params);
    next.delete('page');
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`${pathname}?${next}`, { scroll: false });
  }
  if (!dto.uuid.safeParse(id).success) return <p>Không tìm thấy lớp học.</p>;
  return (
    <section className={`${assignmentRootClass} mx-auto w-full max-w-6xl`} aria-label="Bài tập">
      {!props.embedded && (
        <AssignmentHeading
          title="Bài tập"
          back={props.mentor ? undefined : '/user/courses'}
          backLabel="Khóa học của tôi"
        >
          {props.canCreate && props.sessionId && (
            <AssignmentCreate sessionId={props.sessionId} onCreated={() => query.refetch()} />
          )}
        </AssignmentHeading>
      )}
      <div className="border-b border-line pb-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-bold text-forest">
          <SlidersHorizontal size={16} aria-hidden="true" />
          Lọc bài tập
        </div>
        <div className="flex flex-wrap items-end gap-3 [&>label]:grid [&>label]:min-w-0 [&>label]:flex-1 [&>label]:basis-40 [&>label]:gap-2 [&>label]:text-sm [&>label]:font-bold [&_[data-slot=native-select-wrapper]]:w-full">
          <label>
            Loại bài
            <NativeSelect
              aria-label="Loại bài"
              value={params.get('type') ?? ''}
              onChange={(e) => change('type', e.target.value)}
            >
              <option value="">Mọi loại bài</option>
              <option value="QUIZ">Trắc nghiệm</option>
              <option value="ZIP">Bài nộp ZIP</option>
              <option value="CODE">Bài tập lập trình</option>
            </NativeSelect>
          </label>
          <label>
            Mục đích
            <NativeSelect
              aria-label="Mục đích"
              value={params.get('purpose') ?? ''}
              onChange={(e) => change('purpose', e.target.value)}
            >
              <option value="">Mọi mục đích</option>
              <option value="TEST">Kiểm tra</option>
              <option value="HOMEWORK">Bài về nhà</option>
            </NativeSelect>
          </label>
          {props.mentor && (
            <label>
              Trạng thái bài
              <NativeSelect
                aria-label="Trạng thái bài"
                value={params.get('status') ?? ''}
                onChange={(e) => change('status', e.target.value)}
              >
                <option value="">Mọi trạng thái</option>
                <option value="DRAFT">Bản nháp</option>
                <option value="PUBLISHED">Đã giao</option>
                <option value="ARCHIVED">Đã lưu trữ</option>
              </NativeSelect>
            </label>
          )}
          {!props.sessionId && (
            <label>
              Buổi học
              <NativeSelect
                aria-label="Buổi học"
                value={params.get('sessionId') ?? ''}
                onChange={(e) => change('sessionId', e.target.value)}
                disabled={sessions.isPending || Boolean(sessions.error)}
              >
                <option value="">Mọi buổi học</option>
                {sessions.data?.map((s) => (
                  <option value={s.id} key={s.id}>
                    {s.sessionNumber && !/^buổi\s+\d+(?:\s|[:.·–-]|$)/iu.test(s.title.trim())
                      ? `Buổi ${s.sessionNumber} · `
                      : ''}
                    {s.title} · {dateLabel(s.startsAt)}
                  </option>
                ))}
              </NativeSelect>
            </label>
          )}
          <Button
            variant="ghost"
            onClick={() => {
              const next = new URLSearchParams(params);
              for (const key of ['page', 'type', 'purpose', 'status', 'sessionId'])
                next.delete(key);
              router.push(`${pathname}${next.size ? `?${next}` : ''}`, { scroll: false });
            }}
          >
            Xóa lọc
          </Button>
        </div>
      </div>
      {sessions.error && (
        <p className="text-sm text-muted">
          Chưa tải được thông tin buổi học.{' '}
          <Button variant="ghost" onClick={() => sessions.refetch()}>
            Thử lại
          </Button>
        </p>
      )}
      {!parsed.success ? (
        <div className={panelClass}>
          <p role="alert">Bộ lọc không hợp lệ. Hãy xóa lọc để tiếp tục.</p>
        </div>
      ) : (
        <>
          {props.mentor && props.classId && props.reports && (
            <AssignmentMetrics classId={props.classId} params={queryParams} />
          )}
          <QueryState pending={query.isPending} error={query.error} retry={query.refetch}>
            {query.data && (
              <div className="min-w-0 overflow-hidden rounded-2xl border border-line bg-canvas">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-4 sm:px-5">
                  <h2 className="font-extrabold">Danh sách bài tập</h2>
                  <span className="rounded-lg bg-mint/10 px-2.5 py-1 text-sm font-bold text-forest">
                    {query.data.total} bài tập
                  </span>
                </div>
                {query.data.items.length ? (
                  <>
                    <div
                      aria-hidden="true"
                      className="hidden grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_7rem] gap-5 border-b border-line bg-soft px-5 py-3 text-sm font-bold text-muted lg:grid"
                    >
                      <span>Bài tập</span>
                      <span>Buổi học</span>
                      <span className="text-center">Hạn nộp</span>
                      <span />
                    </div>
                    <ul className="divide-y divide-line">
                      {query.data.items.map((item) => (
                        <AssignmentListItem
                          key={item.id}
                          item={item}
                          session={sessions.data?.find((s) => s.id === item.sessionId)}
                          sessionsPending={sessions.isPending}
                          sessionId={props.sessionId}
                          classId={props.classId}
                          mentor={props.mentor}
                          now={now}
                        />
                      ))}
                    </ul>
                  </>
                ) : (
                  <div className="py-8 text-center">
                    <ClipboardList aria-hidden="true" className="mx-auto mb-3 size-8 text-mint" />
                    <p className="font-bold">Chưa có bài tập</p>
                  </div>
                )}
                <div className="px-4 pb-4 sm:px-5">
                  <Pager
                    page={page}
                    total={query.data.total}
                    pageSize={query.data.pageSize}
                    onChange={(p) => change('page', String(p))}
                  />
                </div>
              </div>
            )}
          </QueryState>
        </>
      )}
    </section>
  );
}
function AssignmentMetrics(props: { classId: string; params: URLSearchParams }) {
  const params = new URLSearchParams(props.params);
  params.delete('page');
  params.delete('status');
  const query = useAssignmentQuery(
    `mentor/classes/${props.classId}/assignment-metrics?${params}`,
    dto.metricsSchema,
    true,
    'MENTOR',
  );
  return (
    <QueryState pending={query.isPending} error={query.error} retry={query.refetch}>
      {query.data && (
        <AssignmentCounts
          counts={query.data}
          history={query.data.historyIncludesTerminalEnrollments}
        />
      )}
    </QueryState>
  );
}
