import { Icon } from '@/components/ui/icon';
import type { CourseDetail } from '../../schemas/course-contracts';
import { CourseCurriculum } from './course-curriculum';
import { CourseMentors } from './course-mentors';

export function CourseOverview(props: { course: CourseDetail; onChooseClass: () => void }) {
  const course = props.course;
  const units = [...course.units].sort((a, b) => a.unitNumber - b.unitNumber);
  return (
    <section
      id="tong-quan"
      aria-labelledby="overview-title"
      className="rounded-2xl border-2 border-canvas bg-logo-soft p-5 text-forest shadow-sm shadow-forest/10 sm:p-7"
    >
      <h2
        id="overview-title"
        className="mb-5 flex items-center gap-3 text-xl font-extrabold sm:text-2xl"
      >
        <Icon name="check" className="size-6 shrink-0 text-mint" />
        Bạn sẽ học được gì?
      </h2>
      {units.length > 0 ? (
        <ul className="grid gap-3 sm:grid-cols-2">
          {units.map((unit) => (
            <li
              key={unit.id}
              className="flex items-start gap-3 rounded-xl border-2 border-canvas bg-canvas p-4 text-base leading-relaxed font-semibold shadow-sm shadow-forest/5"
            >
              <Icon name="check" className="mt-0.5 size-5 shrink-0 text-mint" />
              <span>{unit.title}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-base text-muted">Nội dung học đang được cập nhật.</p>
      )}
      <CourseCurriculum units={course.units} />
      <CourseMentors course={course} onChooseClass={props.onChooseClass} />
    </section>
  );
}
