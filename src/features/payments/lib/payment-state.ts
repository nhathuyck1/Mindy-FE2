import type { OrderPayment } from '@/features/orders/schemas/order-contracts';

export function isPayable(order: OrderPayment, now: number) {
  return (
    order.status === 'PENDING' &&
    order.paymentType === 'PAYOS' &&
    Date.parse(order.expiresAt) > now &&
    order.payment?.status !== 'REQUIRES_REVIEW' &&
    order.payment?.status !== 'SUCCEEDED'
  );
}

export function needsPaymentLink(order: OrderPayment, now: number) {
  return (
    isPayable(order, now) &&
    (!order.payment ||
      order.payment.status === 'CREATING' ||
      (!order.payment.qrCode && !order.payment.checkoutUrl))
  );
}

export function shouldPollOrder(order: OrderPayment, now: number) {
  return (
    order.status === 'PENDING' &&
    order.payment?.status !== 'REQUIRES_REVIEW' &&
    Date.parse(order.expiresAt) > now
  );
}

export function paymentHeading(order: OrderPayment, now: number | null) {
  if (order.status === 'PAID') return 'Thanh toán thành công';
  if (order.payment?.status === 'REQUIRES_REVIEW') return 'Giao dịch đang cần đối soát';
  if (order.status === 'EXPIRED') return 'Đơn hàng đã hết hạn';
  if (order.status === 'CANCELLED') return 'Đơn hàng đã hủy';
  if (now !== null && Date.parse(order.expiresAt) <= now) return 'Thời gian thanh toán đã kết thúc';
  if (order.paymentType === 'CASH') return 'Đơn thanh toán tiền mặt';
  if (order.payment?.status === 'SUCCEEDED') return 'Đang đồng bộ kết quả thanh toán';
  return 'Quét mã để thanh toán';
}
