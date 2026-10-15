import { LoadingOverlay } from '@/components/ui/spinner';

export default function AdminLoading() {
  return <LoadingOverlay scope="page" label="Đang tải trang quản trị…" />;
}
