'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CalendarDays,
  Trash2,
  ShoppingBag,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { CommerceError, CommerceLoading } from '@/features/orders/components/commerce-state';
import { useCheckout } from '@/features/orders/api/order-queries';
import { formatPrice, formatDate, deliveryLabel } from '@/features/courses/lib/course-format';
import { useCart, useRemoveCartItem } from '../api/cart-queries';
import { PendingOrders } from './pending-orders';

export function CartPage() {
  return (
    <div className="cart-content text-black">
      <CartContent />
    </div>
  );
}

function CartContent() {
  const cart = useCart();
  const remove = useRemoveCartItem();
  const checkout = useCheckout();
  const router = useRouter();
  const checkoutLock = useRef(false);
  const unavailable = cart.data?.items.some((item) => !item.isPurchasable);
  const busy = checkout.isPending || remove.isPending;
  const pay = async () => {
    if (checkoutLock.current || busy || cart.isFetching || !cart.data?.items.length || unavailable)
      return;
    checkoutLock.current = true;
    try {
      const result = await checkout.mutateAsync();
      router.push(`/checkout/${result.orders[0].id}`);
    } catch {
      // Read refreshed cart/pending orders before the user decides whether to submit again.
      checkoutLock.current = false;
    }
  };
  return (
    <>
      <Button asChild variant="link" className="mb-5 min-h-11 px-0 text-black">
        <Link href="/courses">
          <ArrowLeft aria-hidden="true" />
          Khám phá khóa học
        </Link>
      </Button>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-3 text-black">Hành trình học tập</p>
          <h1 className="text-3xl leading-tight font-extrabold tracking-tight sm:text-4xl">
            Giỏ hàng của bạn
          </h1>
          <p className="mt-3 text-sm font-normal text-black sm:text-base">
            Những lớp học bạn đã chọn, sẵn sàng cho bước tiếp theo.
          </p>
        </div>
        {cart.data && !cart.isError && (
          <Badge variant="secondary" className="px-4 py-2 text-sm">
            {cart.data.items.length} lớp học
          </Badge>
        )}
      </div>
      {checkout.isError && (
        <div className="mb-6 space-y-3">
          <CommerceError error={checkout.error} />
          <p className="text-sm text-black">
            Kiểm tra mục đơn đang chờ bên dưới trước khi thanh toán lại. Nếu đơn đã tạo, hãy tiếp
            tục trên đơn đó.
          </p>
        </div>
      )}
      {remove.isError && (
        <div className="mb-6">
          <CommerceError error={remove.error} />
        </div>
      )}
      {cart.isPending ? (
        <CommerceLoading />
      ) : cart.isError ? (
        <CommerceError error={cart.error} retry={() => void cart.refetch()} />
      ) : !cart.data.items.length ? (
        <Card className="border-line py-12 text-center shadow-none">
          <CardContent className="flex flex-col items-center gap-4">
            <span className="rounded-full bg-soft p-5">
              <ShoppingBag className="size-9 text-black" aria-hidden="true" />
            </span>
            <h2 className="text-2xl font-extrabold">Giỏ hàng đang trống</h2>
            <p className="max-w-md text-black">
              Chọn một lớp học phù hợp để bắt đầu hành trình cùng Mindy.
            </p>
            <Button asChild className="mt-2 min-h-12">
              <Link href="/courses">
                Khám phá khóa học
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <section aria-label="Các lớp trong giỏ" className="space-y-4">
            {cart.data.items.map((item) => (
              <Card key={item.classId} className="border-line shadow-none">
                <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <span className="hidden size-14 shrink-0 items-center justify-center rounded-xl bg-soft text-black sm:flex">
                    <BookOpen className="size-6" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <Badge variant="secondary" className="text-xs font-normal">
                        {deliveryLabel(item.deliveryMode)}
                      </Badge>
                      <span className="break-all text-xs font-normal text-black">
                        {item.classCode}
                      </span>
                    </div>
                    <h2 className="text-base font-bold leading-snug">
                      <Link href={`/courses/${item.courseId}`} className="hover:text-black">
                        {item.courseTitle}
                      </Link>
                    </h2>
                    <p className="mt-1 text-sm font-normal">{item.className}</p>
                    <p className="mt-3 flex items-start gap-2 text-sm font-normal text-black">
                      <CalendarDays className="size-4 shrink-0" aria-hidden="true" />
                      {formatDate(item.startDate)} – {formatDate(item.endDate)}
                    </p>
                    {!item.isPurchasable && (
                      <Alert className="mt-4 border-coral/40 bg-peach">
                        <AlertTitle>Lớp không còn nhận đăng ký</AlertTitle>
                        <AlertDescription>
                          Vui lòng xóa lớp này khỏi giỏ để tiếp tục.
                        </AlertDescription>
                      </Alert>
                    )}
                    {item.priceSnapshot !== item.currentPriceAmount && (
                      <p className="mt-3 text-sm font-normal text-black">
                        Học phí đã cập nhật từ {formatPrice(item.priceSnapshot)}.
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center justify-between gap-4 sm:flex-col sm:items-end">
                    <p className="text-base font-normal text-black sm:text-lg">
                      {formatPrice(item.currentPriceAmount)}
                    </p>
                    <Button
                      variant="ghost"
                      className="min-h-11 text-black hover:text-black"
                      disabled={busy}
                      aria-label={`Xóa ${item.className}`}
                      onClick={async () => {
                        try {
                          await remove.mutateAsync(item.classId);
                          toast.success('Đã xóa lớp khỏi giỏ hàng.');
                        } catch {
                          /* Render mutation error. */
                        }
                      }}
                    >
                      <Trash2 aria-hidden="true" />
                      {remove.isPending && remove.variables === item.classId ? 'Đang xóa…' : 'Xóa'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </section>
          <Card className="border-line shadow-none lg:sticky lg:top-28">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Tổng thanh toán</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex justify-between gap-4 text-sm font-normal">
                <span>Học phí ({cart.data.items.length} lớp)</span>
                <span className="font-bold">{formatPrice(cart.data.totalAmount)}</span>
              </div>
              <Separator />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="font-bold">Tổng cộng</span>
                <strong className="text-xl font-semibold text-black sm:text-2xl">
                  {formatPrice(cart.data.totalAmount)}
                </strong>
              </div>
              <Button
                className="min-h-13 w-full rounded-xl text-base font-extrabold"
                disabled={busy || cart.isFetching || unavailable || cart.data.totalAmount <= 0}
                onClick={() => void pay()}
              >
                {checkout.isPending ? 'Đang tạo đơn…' : 'Thanh toán'}
                <ArrowRight aria-hidden="true" />
              </Button>
              {cart.data.totalAmount <= 0 && (
                <p className="text-sm text-black">
                  Thanh toán QR yêu cầu tổng tiền lớn hơn 0. Vui lòng kiểm tra lại lớp đã chọn.
                </p>
              )}
              <p className="flex gap-2 text-sm leading-relaxed font-normal text-black">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-black" aria-hidden="true" />
                Quét QR hoặc mở payOS ở bước tiếp theo. Chỗ học được giữ sau khi đơn được tạo.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
      <PendingOrders />
    </>
  );
}
