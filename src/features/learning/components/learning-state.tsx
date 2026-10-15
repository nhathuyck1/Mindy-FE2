import { Button } from '@/components/ui/button';
import { ApiError } from '@/lib/api/client';

export function LearningState(props: {
  error?: unknown;
  retry?: () => void;
  children?: React.ReactNode;
}) {
  let message = 'Chưa thể tải nội dung. Vui lòng thử lại.';
  if (props.error instanceof ApiError) {
    if (props.error.status === 401) message = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
    if (props.error.status === 403)
      message = 'Bạn chưa có quyền học nội dung này. Vui lòng kiểm tra đăng ký lớp.';
    if (props.error.status === 404) message = 'Nội dung chưa được mở hoặc không còn khả dụng.';
    if (props.error.status === 409) message = 'Tài liệu đã thay đổi. Vui lòng tải lại nội dung.';
  }
  return (
    <div
      role={props.error ? 'alert' : 'status'}
      className="rounded-xl border border-line bg-canvas p-6 text-sm leading-relaxed"
    >
      <p>{props.error ? message : props.children}</p>
      {props.error && props.retry ? (
        <Button variant="outline" className="mt-4" onClick={props.retry}>
          Thử lại
        </Button>
      ) : null}
    </div>
  );
}
