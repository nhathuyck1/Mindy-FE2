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
      <div className="rounded-xl border border-line bg-canvas p-6 shadow-sm shadow-forest/5">
        <p className="text-xs text-muted">Học phí khóa học</p>
        <p className="mt-1 text-3xl font-extrabold text-mint">{formatPrice(course.priceAmount)}</p>
        <p className="mt-2 text-xs leading-relaxed text-muted">
          Chọn lớp và xem lịch học trước khi bắt đầu.
        </p>
        <button
          type="button"
          onClick={() => props.onChooseClass()}
          className="mt-5 flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-mint px-4 text-sm font-extrabold text-canvas transition-colors hover:bg-forest"
        >
          Đăng ký học ngay <Icon name="arrow" className="size-4" />
        </button>
        <a
          href="#giao-trinh"
          className="mt-3 flex min-h-11 items-center justify-center gap-2 rounded-lg border border-mint bg-canvas px-4 text-xs font-extrabold text-mint hover:border-forest hover:text-forest"
        >
          <Icon name="book" className="size-4" />
          Xem giáo trình
        </a>
        <div className="mt-5 border-t border-line pt-5">
          <p className="mb-4 text-xs font-extrabold">Thông tin khóa học</p>
          <ul className="space-y-3 text-xs text-muted">
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
        <div className="mt-5 rounded-lg border border-line bg-canvas p-3 text-[11px] leading-relaxed text-muted">
          Bấm đăng ký để xem các lớp đang mở và số chỗ còn lại.
        </div>
      </div>
      <div className="flex items-start gap-3 rounded-xl border border-line bg-canvas p-4">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-line bg-canvas text-mint">
          <Icon name="clock" className="size-5" />
        </span>
        <div>
          <p className="text-xs font-extrabold">Một nhịp học phù hợp</p>
          <p className="mt-1 text-[11px] leading-relaxed text-muted">
            Lịch hiển thị theo giờ Việt Nam (UTC+7).
          </p>
        </div>
      </div>
    </aside>
  );
}
