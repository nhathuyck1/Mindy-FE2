import { Icon } from '@/components/ui/icon';
import type { CourseDetail } from '../../schemas/course-contracts';

export function CourseMentors(props: { course: CourseDetail; onChooseClass: () => void }) {
  const course = props.course;
  const mentors = [
    ...new Map(course.openClasses.map((item) => [item.mentor.id, item.mentor])).values(),
  ];
  return (
    <section
      id="mentor"
      aria-labelledby="mentor-title"
      className="rounded-xl border border-line bg-canvas p-5 sm:p-6"
    >
      <h2 id="mentor-title" className="mb-5 text-lg font-extrabold">
        Mentor hướng dẫn
      </h2>
      {mentors.length === 0 ? (
        <p className="text-sm text-muted">Thông tin mentor sẽ có khi khóa học mở lớp.</p>
      ) : (
        <div className="space-y-3">
          {mentors.map((mentor) => (
            <div
              key={mentor.id}
              className="flex items-start gap-4 rounded-lg border border-line bg-canvas p-4"
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-full border border-line bg-canvas text-mint">
                <Icon name="user" />
              </span>
              <div className="min-w-0">
                <h3 className="text-sm font-extrabold">
                  {mentor.displayName ?? 'Mentor đang được cập nhật'}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-muted">
                  {course.openClasses
                    .filter((item) => item.mentor.id === mentor.id)
                    .map((item) => item.name)
                    .join(' · ')}
                </p>
                <button
                  type="button"
                  onClick={() => props.onChooseClass()}
                  className="text-link mt-1 cursor-pointer text-xs text-mint"
                >
                  Xem lớp & lịch học <Icon name="arrow" className="size-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
