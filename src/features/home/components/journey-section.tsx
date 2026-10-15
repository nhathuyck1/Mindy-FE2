import { Icon } from '@/components/ui/icon';

const steps = [
  {
    title: 'Tìm điều bạn muốn học',
    text: 'Khám phá đề cương và chọn khóa học phù hợp với mục tiêu của bạn.',
    icon: 'book',
  },
  {
    title: 'Chọn lớp, gặp giảng viên',
    text: 'Xem lịch, hình thức học và người đồng hành trước khi đăng ký.',
    icon: 'clock',
  },
  {
    title: 'Bắt đầu và thực hành',
    text: 'Theo dõi đơn đăng ký, vào lớp và tiếp tục hành trình của bạn.',
    icon: 'check',
  },
] as const;

export function JourneySection() {
  return (
    <section
      id="hanh-trinh"
      className="page-container grid gap-10 pb-16 md:grid-cols-2 lg:gap-24 lg:pb-24"
      aria-labelledby="journey-title"
    >
      <div>
        <p className="eyebrow mb-6 text-mint">Hành trình cùng Mindy</p>
        <h2 id="journey-title" className="section-title">
          Một bước nhỏ.
          <br />
          Một điều mới.
          <br />
          <span className="text-mint">Mỗi ngày.</span>
        </h2>
        <p className="mt-6 max-w-90 text-base leading-relaxed text-muted">
          Bạn không cần biết tất cả để bắt đầu. Chỉ cần một điểm xuất phát và sự tò mò.
        </p>
      </div>
      <ol>
        {steps.map((step, index) => (
          <li
            key={step.title}
            className="flex items-start gap-5 border-b border-line py-6 first:pt-0"
          >
            <span className="pt-1 text-xs font-bold text-mint">0{index + 1}</span>
            <div className="flex-1">
              <h3 className="text-lg font-extrabold">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{step.text}</p>
            </div>
            <Icon name={step.icon} className="mt-1 shrink-0 text-mint" />
          </li>
        ))}
      </ol>
    </section>
  );
}
