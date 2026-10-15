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
      className="mt-8 border-t border-canvas pt-8 text-forest"
    >
      <h3 id="mentor-title" className="mb-5 text-xl font-extrabold sm:text-2xl">
        Mentor hướng dẫn
      </h3>
      {mentors.length === 0 ? (
        <p className="text-base">Thông tin mentor sẽ có khi khóa học mở lớp.</p>
      ) : (
        <div className="space-y-3">
          {mentors.map((mentor) => (
            <div
              key={mentor.id}
              className="flex items-start gap-3 rounded-xl border-2 border-canvas bg-canvas p-4 shadow-sm shadow-forest/5 sm:gap-4 sm:p-5"
            >
              <span className="grid size-12 shrink-0 place-items-center rounded-full bg-logo-soft text-mint">
                <Icon name="user" className="size-6" />
              </span>
              <div className="min-w-0">
                <h4 className="text-lg font-extrabold sm:text-xl">
                  {mentor.displayName ?? 'Mentor đang được cập nhật'}
                </h4>
                <p className="mt-2 text-base leading-relaxed text-muted">
                  {course.openClasses
                    .filter((item) => item.mentor.id === mentor.id)
                    .map((item) => item.name)
                    .join(' · ')}
                </p>
                <button
                  type="button"
                  onClick={() => props.onChooseClass()}
                  className="text-link mt-2 cursor-pointer text-base text-mint hover:text-forest hover:underline hover:underline-offset-4"
                >
                  Xem lớp & lịch học <Icon name="arrow" className="size-4 shrink-0" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
