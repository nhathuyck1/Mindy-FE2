import { Icon } from '@/components/ui/icon';
import type { CourseDetail } from '../../schemas/course-contracts';

export function CourseOverview(props: { course: CourseDetail }) {
  const course = props.course;
  const units = [...course.units].sort((a, b) => a.unitNumber - b.unitNumber);
  return (
    <section
      id="tong-quan"
      aria-labelledby="overview-title"
      className="rounded-xl border border-line bg-canvas p-5 sm:p-6"
    >
      <h2 id="overview-title" className="mb-5 flex items-center gap-2 text-lg font-extrabold">
        <Icon name="check" className="size-5 text-mint" />
        Bạn sẽ học được gì?
      </h2>
      {units.length > 0 ? (
        <ul className="grid gap-3 sm:grid-cols-2">
          {units.map((unit) => (
            <li
              key={unit.id}
              className="flex items-start gap-2 rounded-lg border border-line bg-canvas px-3 py-3 text-xs leading-relaxed"
            >
              <Icon name="check" className="mt-0.5 size-4 shrink-0 text-mint" />
              <span>{unit.title}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">Nội dung học đang được cập nhật.</p>
      )}
      <div className="mt-5 flex items-start gap-3 rounded-lg border border-line bg-canvas p-4">
        <Icon name="calendar" className="size-5 shrink-0 text-mint" />
        <p className="text-xs leading-relaxed">
          <strong className="mb-1 block text-mint">Tìm lớp phù hợp với lịch của bạn</strong>
          Xem mentor, hình thức học, số chỗ còn lại và lịch chi tiết khi chọn “Đăng ký học ngay”.
        </p>
      </div>
    </section>
  );
}
