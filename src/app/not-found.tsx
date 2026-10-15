import Link from 'next/link';
import { Brand } from '@/components/ui/brand';

export default function NotFoundPage() {
  return (
    <main className="page-container grid min-h-screen place-content-center justify-items-start gap-6">
      <Brand />
      <p className="eyebrow text-mint">404 · Không tìm thấy trang</p>
      <h1 className="section-title">
        Mình quay lại
        <br />
        điểm bắt đầu nhé.
      </h1>
      <Link href="/" className="text-link">
        Về trang chủ →
      </Link>
    </main>
  );
}
