'use client';

import { PaymentPanel } from '@/features/payments/components/payment-panel';

export function CheckoutPage(props: { orderId: string }) {
  return <PaymentPanel orderId={props.orderId} />;
}
