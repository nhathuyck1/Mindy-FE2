'use client';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ClipboardList, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NativeSelect } from '@/components/ui/native-select';
import { useAssignmentQuery, useAssignmentSessions } from '../api/assignment-queries';
import * as dto from '../schemas/assignment-contracts';
import {
  AssignmentHeading,
  QueryState,
  Status,
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
}) {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const role = props.mentor ? 'MENTOR' : 'STUDENT';
  const sessions = useAssignmentSessions(props.classId, Boolean(props.mentor));
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
    <section className={assignmentRootClass} aria-label="Bài tập">
      <AssignmentHeading
        title="Bài tập"
        back={props.mentor ? undefined : '/user/courses'}
        backLabel="Khóa học của tôi"
      >
        {props.canCreate && props.sessionId && (
          <AssignmentCreate sessionId={props.sessionId} onCreated={() => query.refetch()} />
        )}
      </AssignmentHeading>
      <div className="flex flex-wrap gap-3">
        <NativeSelect
          aria-label="Loại bài"
          value={params.get('type') ?? ''}
          onChange={(e) => change('type', e.target.value)}
        >
          <option value="">Mọi loại bài</option>
          <option value="QUIZ">Trắc nghiệm</option>
          <option value="ZIP">Bài nộp ZIP</option>
        </NativeSelect>
        <NativeSelect
          aria-label="Mục đích"
          value={params.get('purpose') ?? ''}
          onChange={(e) => change('purpose', e.target.value)}
        >
          <option value="">Mọi mục đích</option>
          <option value="TEST">Kiểm tra</option>
          <option value="HOMEWORK">Bài về nhà</option>
        </NativeSelect>
        {props.mentor && (
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
        )}
        {!props.sessionId && (
          <NativeSelect
            aria-label="Buổi học"
            value={params.get('sessionId') ?? ''}
            onChange={(e) => change('sessionId', e.target.value)}
            disabled={sessions.isPending}
          >
            <option value="">Mọi buổi học</option>
            {sessions.data?.map((s) => (
              <option value={s.id} key={s.id}>
                {s.title}
              </option>
            ))}
          </NativeSelect>
        )}
        <Button
          variant="ghost"
          onClick={() => {
            router.push(pathname, { scroll: false });
          }}
        >
          Xóa lọc
        </Button>
      </div>
      {sessions.error && (
        <p className="text-sm text-muted">
          Chưa tải được bộ lọc buổi học.{' '}
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
              <div className={panelClass}>
                {query.data.items.length ? (
                  <ul className="divide-y divide-line">
                    {query.data.items.map((item) => (
                      <li key={item.id}>
                        <Link
                          href={`/${props.mentor ? 'mentor' : 'user'}/assignments/${item.id}${!props.mentor && props.classId ? `?classId=${props.classId}` : ''}`}
                          className="group flex min-w-0 items-start gap-4 rounded-xl py-5 focus-visible:outline-2 focus-visible:outline-mint"
                        >
                          <span className="hidden size-11 shrink-0 items-center justify-center rounded-xl bg-mint/10 text-mint sm:flex">
                            <ClipboardList size={22} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap gap-2">
                              <span className="text-sm text-muted">
                                {item.type === 'QUIZ' ? 'Trắc nghiệm' : 'Bài nộp ZIP'} ·{' '}
                                {item.purpose === 'TEST' ? 'Kiểm tra' : 'Bài về nhà'}
                              </span>
                            </div>
                            <h2 className="mt-2 text-lg font-extrabold break-words group-hover:text-mint">
                              {item.title}
                            </h2>
                            <p className="mt-2 text-sm text-muted">
                              Hạn nộp: {dateLabel(item.dueAt)}
                            </p>
                            <div className="mt-3">
                              <Status value={item.status} />
                            </div>
                          </div>
                          <ArrowUpRight
                            className="mt-2 size-5 shrink-0 text-mint"
                            aria-hidden="true"
                          />
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="py-8 text-center">
                    <ClipboardList aria-hidden="true" className="mx-auto mb-3 size-8 text-mint" />
                    <p className="font-bold">Chưa có bài tập</p>
                  </div>
                )}
                <Pager
                  page={page}
                  total={query.data.total}
                  onChange={(p) => change('page', String(p))}
                />
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
