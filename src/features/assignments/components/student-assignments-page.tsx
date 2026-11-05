'use client';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { NativeSelect } from '@/components/ui/native-select';
import { AssignmentList } from '@/features/assignments/components/assignment-list';
import { useAssignmentClasses } from '@/features/user/api/user-queries';
export function StudentAssignmentsPage() {
  const classes = useAssignmentClasses();
  const params = useSearchParams(),
    router = useRouter(),
    pathname = usePathname();
  const current =
    classes.data?.find((c) => c.classId === params.get('classId')) ?? classes.data?.[0];
  return (
    <div className="min-w-0 space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
        <div>
          <p className="eyebrow">Học tập</p>
          <h1 className="section-title">Bài tập</h1>
        </div>
        <Button asChild variant="outline">
          <Link href="/user/courses">Khóa học của tôi</Link>
        </Button>
      </header>
      {classes.isPending && <p role="status">Đang tải lớp học…</p>}
      {classes.error && (
        <p role="alert">
          Chưa tải được lớp học.{' '}
          <Button variant="link" onClick={() => void classes.refetch()}>
            Thử lại
          </Button>
        </p>
      )}
      {classes.data && !classes.data.length && (
        <p className="py-8 text-muted">Chưa có lớp được mở bài tập.</p>
      )}
      {current && (
        <>
          <label className="grid max-w-xl gap-2 text-sm font-bold">
            Lớp học
            <NativeSelect
              value={current.classId}
              onChange={(event) => {
                const next = new URLSearchParams(params);
                for (const key of ['page', 'sessionId']) next.delete(key);
                next.set('classId', event.target.value);
                router.push(pathname + '?' + next, { scroll: false });
              }}
            >
              {classes.data?.map((c) => (
                <option key={c.classId} value={c.classId}>
                  {c.className} · {c.courseTitle}
                </option>
              ))}
            </NativeSelect>
          </label>
          <AssignmentList key={current.classId} classId={current.classId} embedded />
        </>
      )}
    </div>
  );
}
