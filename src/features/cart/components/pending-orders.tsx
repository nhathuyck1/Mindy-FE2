'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePendingOrders } from '@/features/orders/api/order-queries';
import { CommerceError, CommerceLoading } from '@/features/orders/components/commerce-state';
import { formatPrice, formatDate } from '@/features/courses/lib/course-format';

export function PendingOrders() {
  const [page, setPage] = useState(1);
  const orders = usePendingOrders(page);
  if (orders.isPending) return <CommerceLoading />;
  if (orders.isError)
    return (
      <CommerceError error={orders.error} retry={() => void orders.refetch()} returnTo="/cart" />
    );
  if (!orders.data.total) return null;
  return (
    <section aria-labelledby="pending-orders-heading" className="mt-10">
      <Card className="border-line shadow-none">
        <CardHeader>
          <CardTitle id="pending-orders-heading" className="text-lg font-semibold">
            Đơn đang chờ thanh toán
          </CardTitle>
          <CardDescription>
            Bạn có thể tiếp tục thanh toán đơn đã tạo mà không cần thêm lại lớp vào giỏ.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {orders.data.items.map((order) => (
            <div
              key={order.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-line p-4"
            >
              <div className="min-w-0">
                <p className="break-all text-sm font-bold">{order.orderCode}</p>
                <p className="mt-1 text-sm font-normal text-black">
                  {order.details.length} lớp · {formatDate(order.createdAt)}
                </p>
                <p className="mt-1 text-sm font-normal text-black">
                  {formatPrice(order.totalAmount)}
                </p>
              </div>
              {order.paymentType === 'PAYOS' ? (
                <Button asChild variant="outline" className="min-h-11">
                  <Link href={`/checkout/${order.id}`}>
                    Tiếp tục thanh toán
                    <ArrowRight aria-hidden="true" />
                  </Link>
                </Button>
              ) : (
                <Badge variant="secondary">Tiền mặt</Badge>
              )}
            </div>
          ))}
          {orders.data.total > 10 && (
            <nav
              aria-label="Phân trang đơn chờ"
              className="flex items-center justify-between gap-3"
            >
              <Button
                variant="outline"
                className="min-h-11"
                disabled={page === 1 || orders.isFetching}
                onClick={() => setPage(page - 1)}
              >
                Trước
              </Button>
              <span className="text-sm">Trang {page}</span>
              <Button
                variant="outline"
                className="min-h-11"
                disabled={page * 10 >= orders.data.total || orders.isFetching}
                onClick={() => setPage(page + 1)}
              >
                Sau
              </Button>
            </nav>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
