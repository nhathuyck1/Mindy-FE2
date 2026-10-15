import { Icon } from '@/components/ui/icon';
import type { CourseDetail } from '../../schemas/course-contracts';
import { formatPrice } from '../../lib/course-format';

export function CourseRegistrationCard(props: { course: CourseDetail; onChooseClass: () => void }) {
  const course = props.course;
  const units = course.units;
  return (
    <aside
      className="order-first space-y-4 lg:sticky lg:top-28 lg:order-none"
      aria-label="Đăng ký khóa học"
    >
      <div className="rounded-2xl border border-line bg-canvas p-6 shadow-sm shadow-forest/5 xl:p-7">
        <p className="text-sm font-semibold text-muted">Học phí khóa học</p>
        <p className="mt-1 text-4xl font-extrabold text-mint">{formatPrice(course.priceAmount)}</p>
        <p className="mt-2 text-sm leading-relaxed font-semibold text-muted">
          Chọn lớp và xem lịch học trước khi bắt đầu.
        </p>
        <button
          type="button"
          onClick={() => props.onChooseClass()}
          className="mt-5 flex min-h-13 w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-coral px-4 text-base font-extrabold text-canvas transition-colors hover:bg-headsup"
        >
          Đăng ký học ngay <Icon name="arrow" className="size-4" />
        </button>
        <a
          href="#giao-trinh"
          className="mt-3 flex min-h-13 items-center justify-center gap-2 rounded-lg border border-forest bg-forest px-4 text-base font-extrabold text-canvas transition-colors hover:border-mint hover:bg-mint"
        >
          <Icon name="book" className="size-4" />
          Xem giáo trình
        </a>
        <div className="mt-5 border-t border-line pt-5">
          <p className="mb-4 text-base font-extrabold">Thông tin khóa học</p>
          <ul className="space-y-3 text-sm leading-relaxed font-semibold text-muted">
            <li className="flex items-center gap-2">
              <Icon name="book" className="size-4 shrink-0 text-mint" />
              {units.length} học phần trong giáo trình
            </li>
            <li className="flex items-center gap-2">
              <Icon name="calendar" className="size-4 shrink-0 text-mint" />
              Lịch chi tiết theo từng lớp
            </li>
            <li className="flex items-center gap-2">
              <Icon name="user" className="size-4 shrink-0 text-mint" />
              Mentor hướng dẫn theo lớp
            </li>
          </ul>
        </div>
      </div>
    </aside>
  );
}
