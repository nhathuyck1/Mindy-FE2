import { ArrowRight, BookOpen } from 'lucide-react';
import type { Course } from '@/features/courses/schemas/course-contracts';

export function ManagerCourseList(props: { courses: Course[]; onSelect: (id: string) => void }) {
  return (
    <section
      aria-label="Danh sách khóa học"
      className="overflow-hidden rounded-2xl border border-line bg-canvas"
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-5 sm:px-6">
        <h2 className="text-lg font-bold">Danh sách khóa học</h2>
        <span className="text-sm text-muted">{props.courses.length} khóa học</span>
      </header>
      {props.courses.length ? (
        <ul className="divide-y divide-line">
          {props.courses.map((course) => (
            <li key={course.id}>
              <button
                type="button"
                onClick={() => props.onSelect(course.id)}
                className="flex w-full min-w-0 items-center gap-4 px-5 py-5 text-left transition-colors hover:bg-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint focus-visible:ring-inset sm:px-6"
              >
                <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-mint/10 text-mint">
                  <BookOpen aria-hidden="true" className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-base font-semibold break-words">{course.title}</span>
                  <span className="mt-1 block text-sm break-words text-muted">{course.code}</span>
                </span>
                <span className="hidden shrink-0 text-sm font-medium text-mint sm:inline">
                  Xem chi tiết
                </span>
                <ArrowRight aria-hidden="true" className="size-5 shrink-0 text-mint" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p role="status" className="p-8 text-center text-sm text-muted">
          Chưa có khóa học.
        </p>
      )}
    </section>
  );
}
