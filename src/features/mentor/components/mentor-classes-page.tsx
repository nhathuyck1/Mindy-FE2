'use client';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ArrowUpRight, Users } from 'lucide-react';
import { ClassOverviewCard, classOverviewGrid } from '@/components/ui/class-overview-card';
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
  const params = useSearchParams(),
    router = useRouter(),
    pathname = usePathname();
  const requestedPage = Number(params.get('page') ?? 1);
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const requestedStatus = params.get('status') ?? '';
  const status = ['DRAFT', 'OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].includes(
    requestedStatus,
  )
    ? requestedStatus
    : '';
  const requestedAssignment = params.get('assignment') ?? 'ANY';
  const assignment = ['PRIMARY', 'SUBSTITUTE'].includes(requestedAssignment)
    ? requestedAssignment
    : 'ANY';
  function update(values: Record<string, string | number>) {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(values)) {
      if (!value || value === 'ANY' || (key === 'page' && value === 1)) next.delete(key);
      else next.set(key, String(value));
    }
    router.replace(`${pathname}${next.size ? `?${next}` : ''}`, { scroll: false });
  }
  const classes = useMentorQuery(
    `mentor/classes?page=${page}&pageSize=20&assignment=${assignment}${status ? `&status=${status}` : ''}`,
    mentorClassPageSchema,
  );
  return (
    <>
      <MentorHeading title="Lớp của tôi" />
      <div className="mb-6 flex flex-wrap items-end gap-4 rounded-2xl border border-line bg-soft/50 p-4 sm:p-5">
        <label className="space-y-2 text-sm font-bold">
          Phân công
          <NativeSelect
            aria-label="Phân công"
            value={assignment}
            onChange={(e) => {
              update({ assignment: e.target.value, page: 1 });
            }}
          >
            <NativeSelectOption value="ANY">Tất cả phân công</NativeSelectOption>
            <NativeSelectOption value="PRIMARY">Mentor chính</NativeSelectOption>
            <NativeSelectOption value="SUBSTITUTE">Dạy thay</NativeSelectOption>
          </NativeSelect>
        </label>
        <div className="max-w-xs">
          <label htmlFor="mentor-class-status" className="mb-2 block text-sm font-bold">
            Trạng thái lớp
          </label>
          <NativeSelect
            id="mentor-class-status"
            value={status}
            onChange={(e) => {
              update({ status: e.target.value, page: 1 });
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
      </div>
      <MentorQueryState
        pending={classes.isPending}
        error={classes.error}
        retry={classes.refetch}
        empty={classes.data?.items.length === 0}
      >
        <div className={classOverviewGrid}>
          {classes.data?.items.map((item) => (
            <ClassOverviewCard
              key={item.id}
              href={`/mentor/classes/${item.id}`}
              code={item.code}
              title={item.name}
              subtitle={
                item.assignmentType === 'SUBSTITUTE'
                  ? 'Dạy thay · Theo buổi'
                  : item.assignmentType === 'BOTH'
                    ? 'Mentor chính và dạy thay'
                    : 'Mentor chính'
              }
              status={<MentorStatus value={item.status} />}
              dates={`${mentorDate(item.startDate, false)} – ${mentorDate(item.endDate, false)}`}
              online={item.deliveryMode === 'ONLINE'}
              delivery={item.deliveryMode === 'ONLINE' ? 'Trực tuyến' : 'Tại lớp'}
              footer={
                <>
                  <span className="mr-auto inline-flex items-center gap-2 text-muted">
                    <Users aria-hidden="true" className="size-4" />
                    Sĩ số tối đa: {item.maxStudents}
                  </span>
                  <span className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-mint px-3 font-bold text-white transition-colors group-hover:bg-forest">
                    Vào lớp
                    <ArrowUpRight aria-hidden="true" className="size-4" />
                  </span>
                </>
              }
            />
          ))}
        </div>
      </MentorQueryState>
      {classes.data && (
        <MentorPagination
          page={page}
          total={classes.data.total}
          onChange={(page) => update({ page })}
        />
      )}
    </>
  );
}
