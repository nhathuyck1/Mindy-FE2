'use client';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { BookOpen, ArrowUpRight, CalendarDays, Users, Video, MapPin } from 'lucide-react';
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
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {classes.data?.items.map((item) => (
            <Link
              key={item.id}
              href={`/mentor/classes/${item.id}`}
              className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-line bg-canvas transition-colors hover:border-mint hover:bg-soft/30 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-mint"
            >
              <div className="flex items-center justify-between gap-3 bg-soft/70 px-5 py-4">
                <span className="grid size-11 place-items-center rounded-xl bg-canvas text-mint">
                  <BookOpen aria-hidden="true" className="size-6" />
                </span>
                <MentorStatus value={item.status} />
              </div>
              <div className="flex flex-1 flex-col p-5">
                <p className="text-xs font-semibold text-muted">
                  {item.assignmentType === 'SUBSTITUTE'
                    ? 'Dạy thay · Theo buổi'
                    : item.assignmentType === 'BOTH'
                      ? 'Mentor chính và dạy thay'
                      : 'Mentor chính'}
                </p>
                <p className="mt-4 text-xs font-bold tracking-wide text-mint">{item.code}</p>
                <h2 className="mt-2 text-lg leading-7 font-extrabold break-words">{item.name}</h2>
                <p className="mt-5 flex items-start gap-2 text-sm text-muted">
                  <CalendarDays aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-mint" />
                  <span>
                    {mentorDate(item.startDate, false)} – {mentorDate(item.endDate, false)}
                  </span>
                </p>
                <p className="mt-3 flex items-center gap-2 text-sm text-muted">
                  {item.deliveryMode === 'ONLINE' ? (
                    <Video aria-hidden="true" className="size-4 shrink-0 text-mint" />
                  ) : (
                    <MapPin aria-hidden="true" className="size-4 shrink-0 text-mint" />
                  )}
                  {item.deliveryMode === 'ONLINE' ? 'Trực tuyến' : 'Tại lớp'}
                </p>
              </div>
              <div className="mx-5 flex flex-wrap items-center justify-between gap-3 border-t border-line py-4 text-sm">
                <span className="inline-flex items-center gap-2 text-muted">
                  <Users aria-hidden="true" className="size-4" />
                  Sĩ số tối đa: {item.maxStudents}
                </span>
                <span className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-mint px-3 font-bold text-white transition-colors group-hover:bg-forest">
                  Vào lớp
                  <ArrowUpRight className="size-4" />
                </span>
              </div>
            </Link>
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
