'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  Clock3,
  QrCode,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useSession } from '@/features/auth/api/auth-queries';
import { useOrder } from '@/features/orders/api/order-queries';
import type { OrderPayment } from '@/features/orders/schemas/order-contracts';
import { CommerceError, CommerceLoading } from '@/features/orders/components/commerce-state';
import { formatPrice } from '@/features/courses/lib/course-format';
import { usePreparePayment } from '../api/payment-queries';
import { isPayable, paymentHeading } from '../lib/payment-state';

function useClock() {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const timer = setInterval(tick, 500);
    window.addEventListener('focus', tick);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', tick);
    };
  }, []);
  return now;
}

export function PaymentPanel(props: { orderId: string }) {
  const session = useSession();
  return <PaymentContent key={`${session.data?.id}:${props.orderId}`} orderId={props.orderId} />;
}

function PaymentContent(props: { orderId: string }) {
  const order = useOrder(props.orderId);
  // Do not start a payment from stale data following a failed order read.
  const prepare = usePreparePayment(order.isError ? undefined : order.data);
  const queryClient = useQueryClient();
  const now = useClock();
  const expiryChecked = useRef(false);
  const paidInvalidated = useRef(false);
  const { refetch } = order;
  const deadline = order.data?.expiresAt;
  useEffect(() => {
    if (now !== null && deadline && Date.parse(deadline) <= now && !expiryChecked.current) {
      expiryChecked.current = true;
      void refetch();
    }
  }, [now, deadline, refetch]);
  useEffect(() => {
    if (order.data?.status === 'PAID' && !paidInvalidated.current) {
      paidInvalidated.current = true;
      void queryClient.invalidateQueries({ queryKey: ['orders'] });
      void queryClient.invalidateQueries({ queryKey: ['catalog'] });
    }
  }, [order.data?.status, queryClient]);
  const returnTo = `/checkout/${props.orderId}`;
  if (order.isPending) return <CommerceLoading />;
  if (order.isError)
    return (
      <CommerceError error={order.error} retry={() => void order.check()} returnTo={returnTo} />
    );
  const data = order.data;
  const payable = now !== null && isPayable(data, now);
  const ready = payable && data.payment?.status === 'PENDING';
  const seconds =
    now === null ? null : Math.max(0, Math.ceil((Date.parse(data.expiresAt) - now) / 1000));
  const title = paymentHeading(data, now);
  const terminal = data.status !== 'PENDING' || data.payment?.status === 'REQUIRES_REVIEW';
  return (
    <>
      <Button asChild variant="link" className="mb-5 min-h-11 px-0">
        <Link href="/cart">
          <ArrowLeft aria-hidden="true" />
          Quay lại giỏ hàng
        </Link>
      </Button>
      <div className="mb-8">
        <p className="eyebrow mb-3 text-mint">Thanh toán học phí</p>
        <h1 className="section-title">Hoàn tất đăng ký của bạn</h1>
        <p className="mt-3 text-muted">Một bước nữa để bắt đầu hành trình học tập cùng Mindy.</p>
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="min-w-0 border-line shadow-none">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex size-14 items-center justify-center rounded-full bg-soft text-mint">
              {data.status === 'PAID' ? (
                <Check className="size-7" aria-hidden="true" />
              ) : (
                <QrCode className="size-7" aria-hidden="true" />
              )}
            </div>
            <CardTitle className="text-2xl" aria-live="polite">
              {title}
            </CardTitle>
            <CardDescription>
              {data.status === 'PAID'
                ? 'Mindy đã ghi nhận thanh toán của bạn.'
                : ready
                  ? 'Mở ứng dụng ngân hàng để quét mã QR bên dưới.'
                  : 'Kết quả được cập nhật từ hệ thống thanh toán.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {data.status === 'PAID' ? (
              <div className="rounded-2xl bg-soft px-5 py-8 text-center">
                <p className="text-3xl font-extrabold text-mint">{formatPrice(data.totalAmount)}</p>
                <p className="mt-3 break-all font-bold">{data.orderCode}</p>
                <Button asChild className="mt-6 min-h-12">
                  <Link href="/courses">Tiếp tục khám phá</Link>
                </Button>
              </div>
            ) : data.payment?.status === 'REQUIRES_REVIEW' ? (
              <Alert className="border-coral/40 bg-peach">
                <AlertTitle>Đang kiểm tra giao dịch</AlertTitle>
                <AlertDescription>
                  Vui lòng chờ hệ thống đối soát. Không thanh toán lại đơn hàng này.
                </AlertDescription>
              </Alert>
            ) : data.status === 'EXPIRED' ||
              data.status === 'CANCELLED' ||
              (seconds !== null && seconds === 0) ? (
              <Alert>
                <AlertTitle>
                  {data.status === 'CANCELLED' ? 'Đơn đã hủy' : 'Không còn thời gian thanh toán'}
                </AlertTitle>
                <AlertDescription>
                  Không chuyển tiền theo mã QR cũ. Bạn có thể quay lại khóa học để chọn lớp và tạo
                  đơn mới.
                </AlertDescription>
              </Alert>
            ) : data.paymentType === 'CASH' ? (
              <Alert>
                <AlertTitle>Thanh toán tiền mặt</AlertTitle>
                <AlertDescription>
                  Đơn này không sử dụng QR payOS. Vui lòng theo hướng dẫn thu tiền của lớp học.
                </AlertDescription>
              </Alert>
            ) : data.payment?.status === 'SUCCEEDED' ? (
              <Alert>
                <AlertTitle>Đang đồng bộ</AlertTitle>
                <AlertDescription>
                  Giao dịch đã được ghi nhận; đang chờ hệ thống hoàn tất trạng thái đơn hàng. Không
                  thanh toán lại.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                {prepare.isError && (
                  <CommerceError
                    error={prepare.error}
                    retry={payable ? () => prepare.mutate() : undefined}
                    returnTo={returnTo}
                  />
                )}
                {ready && data.payment?.qrCode ? (
                  <div className="mx-auto w-fit max-w-full rounded-2xl border border-line bg-canvas p-3 sm:p-4">
                    <QRCodeSVG
                      value={data.payment.qrCode}
                      size={260}
                      marginSize={4}
                      level="M"
                      title={`QR thanh toán đơn ${data.orderCode}`}
                      className="h-auto max-w-full"
                    />
                  </div>
                ) : ready && data.payment?.checkoutUrl ? (
                  <Alert>
                    <AlertTitle>Mở payOS để thanh toán</AlertTitle>
                    <AlertDescription>
                      Đơn đã có liên kết thanh toán nhưng chưa có mã QR hiển thị tại đây.
                    </AlertDescription>
                  </Alert>
                ) : prepare.isPending || now === null ? (
                  <div role="status" className="flex flex-col items-center gap-4">
                    <Skeleton className="size-52 max-w-full bg-soft" />
                    <p className="text-sm text-muted">Đang chuẩn bị mã QR…</p>
                  </div>
                ) : !prepare.isError ? (
                  <Alert>
                    <AlertTitle>Mã thanh toán đang được chuẩn bị</AlertTitle>
                    <AlertDescription>
                      <p>Bạn có thể thử lấy lại mã cho đơn này.</p>
                      <Button
                        variant="outline"
                        className="mt-2 min-h-11"
                        disabled={!payable}
                        onClick={() => prepare.mutate()}
                      >
                        Lấy lại mã QR
                      </Button>
                    </AlertDescription>
                  </Alert>
                ) : null}
                {ready && data.payment?.checkoutUrl && (
                  <Button asChild variant="outline" className="min-h-12 w-full whitespace-normal">
                    <a href={data.payment.checkoutUrl} target="_blank" rel="noopener noreferrer">
                      Mở trang thanh toán payOS
                      <ArrowUpRight aria-hidden="true" />
                    </a>
                  </Button>
                )}
              </>
            )}
            {payable && seconds !== null && (
              <div className="flex flex-wrap items-center justify-center gap-2 text-sm font-bold text-muted">
                <Clock3 className="size-4 text-mint" aria-hidden="true" />
                <span>Mã có hiệu lực trong</span>
                <span
                  className="rounded-lg bg-soft px-3 py-1.5 text-forest"
                  aria-label="Thời gian thanh toán còn lại"
                >
                  {Math.floor(seconds / 60)
                    .toString()
                    .padStart(2, '0')}
                  :{(seconds % 60).toString().padStart(2, '0')}
                </span>
              </div>
            )}
            {!terminal && (
              <Button
                variant="ghost"
                className="min-h-11 w-full whitespace-normal"
                disabled={order.isFetching || prepare.isPending}
                onClick={() => void order.check()}
              >
                <RefreshCw className="size-4" aria-hidden="true" />
                {order.isFetching ? 'Đang kiểm tra…' : 'Kiểm tra thanh toán'}
              </Button>
            )}
            {data.status !== 'PAID' && (
              <p className="flex justify-center gap-2 text-center text-sm leading-relaxed text-muted">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-mint" aria-hidden="true" />
                Chỉ chuyển đúng số tiền của đơn hàng. Kết quả sẽ tự cập nhật khi được xác nhận.
              </p>
            )}
          </CardContent>
        </Card>
        <OrderSummary order={data} />
      </div>
    </>
  );
}

function OrderSummary(props: { order: OrderPayment }) {
  const order = props.order;
  return (
    <Card className="min-w-0 border-line shadow-none lg:sticky lg:top-28">
      <CardHeader>
        <CardTitle className="text-xl">Thông tin đơn hàng</CardTitle>
        <CardDescription className="break-all">{order.orderCode}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <Badge variant="secondary">
          {order.status === 'PAID'
            ? 'Đã thanh toán'
            : order.status === 'PENDING'
              ? 'Đang chờ thanh toán'
              : order.status === 'EXPIRED'
                ? 'Hết hạn'
                : 'Đã hủy'}
        </Badge>
        <ul className="space-y-4">
          {order.details.map((item) => (
            <li key={item.id}>
              <p className="font-extrabold">{item.courseTitle}</p>
              <p className="mt-1 text-sm text-muted">{item.className}</p>
              <p className="mt-2 text-sm font-bold">{formatPrice(item.totalAmount)}</p>
            </li>
          ))}
        </ul>
        <Separator />
        <div className="flex flex-wrap justify-between gap-3">
          <span className="font-bold">Tổng thanh toán</span>
          <strong className="text-2xl text-mint">{formatPrice(order.totalAmount)}</strong>
        </div>
      </CardContent>
    </Card>
  );
}
