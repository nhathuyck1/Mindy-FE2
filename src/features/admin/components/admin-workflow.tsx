import Link from 'next/link';
import { Icon } from '@/components/ui/icon';

const steps = [
  {
    title: 'Tài khoản & phân quyền',
    icon: 'users',
    text: 'Admin quản lý tài khoản của trung tâm. Manager phụ trách vận hành; Mentor phụ trách giảng dạy; Student theo học lớp đã đăng ký.',
    note: 'Tài khoản cần ở trạng thái hoạt động để sử dụng đúng quyền.',
    href: '/admin/users',
  },
  {
    title: 'Khóa học & giáo trình',
    icon: 'book',
    text: 'Khóa học bắt đầu ở trạng thái chưa kích hoạt. Cần danh mục đang hoạt động và ít nhất một học phần trước khi kích hoạt.',
    note: 'Thay đổi giáo trình khóa học không tự thay đổi các lớp đã tạo.',
    href: '/admin/courses',
  },
  {
    title: 'Lớp học & tuyển sinh',
    icon: 'calendar',
    text: 'Tạo lớp nháp từ khóa học đã kích hoạt, gán giảng viên và sắp lịch. Kiểm tra điều kiện trước khi mở tuyển sinh.',
    note: 'Bản nháp → Đang tuyển sinh → Đang học → Hoàn thành.',
    href: '/admin/classes',
  },
] as const;

export function AdminWorkflow() {
  return (
    <>
      <div className="admin-page-heading">
        <div>
          <p className="eyebrow mb-2 text-muted">Hướng dẫn quản trị</p>
          <h1 className="text-[34px] font-extrabold tracking-tight sm:text-[38px]">
            Quy trình vận hành
          </h1>
          <p className="mt-2 text-base leading-6 text-muted">
            Từ tài khoản đến lớp học, từng bước có liên kết rõ ràng.
          </p>
        </div>
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        {steps.map((step, index) => (
          <article key={step.href} className="rounded-2xl border border-line bg-canvas p-6">
            <div className="flex items-center justify-between">
              <span className="grid size-11 place-items-center rounded-xl bg-soft text-mint">
                <Icon name={step.icon} />
              </span>
              <span className="text-sm font-extrabold">0{index + 1}</span>
            </div>
            <h2 className="mt-6 text-xl font-extrabold">{step.title}</h2>
            <p className="mt-3 text-base leading-7 text-muted">{step.text}</p>
            <p className="mt-4 border-l-2 border-coral pl-3 text-sm leading-6 text-muted">
              {step.note}
            </p>
            <Link href={step.href} className="admin-button mt-6">
              Xem danh sách
              <Icon name="arrow" className="size-4" />
            </Link>
          </article>
        ))}
      </div>
      <section className="mt-6 rounded-2xl border border-line bg-canvas p-6">
        <h2 className="text-lg font-extrabold">Các bước tiếp theo của trung tâm</h2>
        <p className="mt-3 max-w-4xl text-base leading-7 text-muted">
          Đăng ký vào giỏ chưa đồng nghĩa đã nhập học. Xác nhận đơn và thanh toán quyết định quyền
          vào lớp. Phân công dạy thay, tài liệu và điểm danh có quy trình phân quyền riêng theo lớp
          và từng buổi.
        </p>
        <p className="mt-3 text-sm leading-6 text-muted">
          Có thể tạo tài khoản, khóa hoặc mở tài khoản, tạo và chỉnh sửa khóa học, học phần, lớp và
          lịch buổi. Thanh toán, tài liệu, điểm danh và phân công lại giảng viên sẽ được bổ sung
          theo từng module.
        </p>
      </section>
    </>
  );
}
