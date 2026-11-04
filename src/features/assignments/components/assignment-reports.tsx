'use client';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { z } from 'zod';
import { NativeSelect } from '@/components/ui/native-select';
import { Button } from '@/components/ui/button';
import { useAssignmentQuery, useAssignmentPeople } from '../api/assignment-queries';
import * as dto from '../schemas/assignment-contracts';
import { QueryState, Status, Pager, panelClass, dateLabel } from './assignment-ui';

export function AssignmentCounts(props: {
  counts: z.infer<typeof dto.countsSchema>;
  history?: boolean;
}) {
  return (
    <section className={`${panelClass} space-y-4`} aria-label="Thống kê bài tập">
      <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {(
          [
            ['assignments', 'Bài đã giao / lưu trữ'],
            ['eligible', 'Cặp bài – học viên hiện tại'],
            ['submitted', 'Đã nộp'],
            ['missing', 'Quá hạn chưa nộp'],
            ['ungraded', 'Chưa chấm'],
            ['unreleased', 'Điểm chờ trả'],
            ['released', 'Đã trả điểm'],
          ] as const
        ).map(([key, label]) => (
          <div key={key}>
            <dt className="text-sm text-muted">{label}</dt>
            <dd className="mt-1 text-2xl font-extrabold text-forest">{props.counts[key]}</dd>
          </div>
        ))}
      </dl>
      {props.history && (
        <p className="text-sm text-muted">
          Bài đã nộp gồm lịch sử học viên đã rời lớp. Điểm sửa chờ trả vẫn giữ bản đã công bố.
        </p>
      )}
    </section>
  );
}
export function useAssignmentReportFilters(prefix: string) {
  const search = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  function change(key: string, value: string) {
    const next = new URLSearchParams(search);
    next.delete(`${prefix}page`);
    if (value) next.set(`${prefix}${key}`, value);
    else next.delete(`${prefix}${key}`);
    router.push(`${pathname}?${next}`, { scroll: false });
  }
  const params = new URLSearchParams();
  for (const key of ['page', 'status', 'attemptNumber', 'history', 'studentId']) {
    const value = search.get(`${prefix}${key}`);
    if (value) params.set(key, value);
  }
  return { params, change };
}
export function AssignmentHistory(props: {
  assignmentId: string;
  mentor?: boolean;
  type?: string;
  rosterAllowed?: boolean;
}) {
  const { params, change } = useAssignmentReportFilters('history-');
  const people = useAssignmentPeople(props.assignmentId, !!props.mentor && !!props.rosterAllowed);
  const valid = (
    props.mentor ? dto.mentorHistoryQuerySchema : dto.studentHistoryQuerySchema
  ).safeParse(Object.fromEntries(params));
  const query = useAssignmentQuery(
    `${props.mentor ? 'mentor' : 'me'}/assignments/${props.assignmentId}/submissions?${params}`,
    props.mentor ? dto.mentorHistorySchema : dto.studentHistorySchema,
    valid.success,
    props.mentor ? 'MENTOR' : 'STUDENT',
  );
  const statuses = props.mentor
    ? [
        ['UNGRADED', 'Chưa chấm'],
        ['GRADED', 'Đã chấm'],
        ['UNRELEASED', 'Chờ trả điểm'],
        ['RELEASED', 'Đã trả điểm'],
      ]
    : [
        ['SUBMITTED', 'Đã nộp'],
        ['RELEASED', 'Đã trả điểm'],
      ];
  return (
    <section className={`${panelClass} space-y-5`}>
      <h2 className="text-xl font-extrabold">{props.mentor ? 'Bài đã nộp' : 'Lịch sử nộp bài'}</h2>
      <div className="flex flex-wrap items-center gap-3">
        <NativeSelect
          aria-label="Lọc bài nộp"
          value={params.get('status') ?? ''}
          onChange={(e) => change('status', e.target.value)}
        >
          <option value="">Mọi trạng thái</option>
          {statuses.map(([value, label]) => (
            <option value={value} key={value}>
              {label}
            </option>
          ))}
        </NativeSelect>
        <NativeSelect
          aria-label="Lượt nộp"
          value={params.get('attemptNumber') ?? ''}
          onChange={(e) => change('attemptNumber', e.target.value)}
        >
          <option value="">Mọi lượt</option>
          {Array.from({ length: 10 }, (_, i) => (
            <option key={i} value={i + 1}>
              Lượt {i + 1}
            </option>
          ))}
        </NativeSelect>
        {props.mentor && (
          <>
            <label className="flex min-h-11 items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={params.get('history') === 'true'}
                onChange={(e) => change('history', e.target.checked ? 'true' : '')}
              />
              Gồm lượt cũ
            </label>
            {props.rosterAllowed && (
              <NativeSelect
                aria-label="Học viên"
                value={params.get('studentId') ?? ''}
                onChange={(e) => change('studentId', e.target.value)}
              >
                <option value="">Mọi học viên</option>
                {people.data?.map((person) => (
                  <option value={person.studentId} key={person.enrollmentId}>
                    {person.displayName}
                  </option>
                ))}
              </NativeSelect>
            )}
          </>
        )}
      </div>
      {!valid.success ? (
        <p role="alert">Bộ lọc không hợp lệ.</p>
      ) : (
        <QueryState pending={query.isPending} error={query.error} retry={query.refetch}>
          {query.data && (
            <>
              <ul className="divide-y divide-line">
                {query.data.items.map((item) => (
                  <li
                    key={item.id}
                    className="flex min-w-0 flex-wrap items-center justify-between gap-4 py-4"
                  >
                    <div className="min-w-0">
                      <p className="font-bold">
                        Lượt {item.attemptNumber ?? '—'}
                        {props.mentor && (
                          <span className="block text-sm font-normal break-all text-muted">
                            {people.data?.find((person) => person.studentId === item.studentId)
                              ?.displayName ?? `Học viên · ${item.studentId.slice(-6)}`}
                          </span>
                        )}
                      </p>
                      <p className="mt-1 text-sm text-muted">{dateLabel(item.submittedAt)}</p>
                      <div className="mt-2">
                        <Status value={item.status} />
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-bold">
                        {item.type === 'QUIZ'
                          ? item.result
                            ? `${item.result.score}/${item.result.maxScore}`
                            : 'Chờ điểm'
                          : item.grade
                            ? `${item.grade.score}/${item.snapshot?.maxScore ?? '—'}`
                            : 'Chưa trả điểm'}
                      </span>
                      {item.type === 'ZIP' || !props.mentor ? (
                        <Button asChild variant="outline">
                          <Link
                            href={`/${props.mentor ? 'mentor' : 'user'}/${item.type === 'ZIP' ? 'zip-submissions' : 'assignment-submissions'}/${item.id}`}
                          >
                            {props.mentor ? 'Mở bài' : 'Xem kết quả'}
                          </Link>
                        </Button>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
              {!query.data.items.length && <p className="py-5 text-muted">Chưa có bài nộp.</p>}
              <Pager
                page={query.data.page}
                total={query.data.total}
                onChange={(p) => change('page', String(p))}
              />
            </>
          )}
        </QueryState>
      )}
    </section>
  );
}
export function AssignmentRoster(props: { assignmentId: string }) {
  const { params, change } = useAssignmentReportFilters('roster-');
  const valid = dto.mentorHistoryQuerySchema.safeParse(Object.fromEntries(params));
  const query = useAssignmentQuery(
    `mentor/assignments/${props.assignmentId}/roster?${params}`,
    dto.rosterSchema,
    valid.success,
    'MENTOR',
  );
  return (
    <section className={`${panelClass} space-y-5`}>
      <h2 className="text-xl font-extrabold">Học viên hiện tại</h2>
      <QueryState pending={query.isPending} error={query.error} retry={query.refetch}>
        {query.data && (
          <>
            <ul className="divide-y divide-line">
              {query.data.items.map((item) => (
                <li
                  key={item.enrollmentId}
                  className="flex flex-wrap items-center justify-between gap-3 py-4"
                >
                  <span className="min-w-0 font-bold break-words">{item.displayName}</span>
                  <span className="text-sm text-muted">
                    {item.missing
                      ? 'Quá hạn chưa nộp'
                      : !item.submitted
                        ? 'Chưa nộp'
                        : !item.graded
                          ? 'Chưa chấm'
                          : !item.released
                            ? 'Chưa trả điểm'
                            : 'Đã trả điểm'}
                  </span>
                </li>
              ))}
            </ul>
            {!query.data.items.length && (
              <p className="text-muted">Chưa có học viên đủ điều kiện.</p>
            )}
            <Pager
              page={query.data.page}
              total={query.data.total}
              onChange={(p) => change('page', String(p))}
            />
          </>
        )}
      </QueryState>
    </section>
  );
}
