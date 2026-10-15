'use client';

import { StudentGate } from './commerce-state';
import { PaymentPanel } from '@/features/payments/components/payment-panel';

export function CheckoutPage(props: { orderId: string }) {
  return (
    <StudentGate returnTo={`/checkout/${props.orderId}`}>
      <PaymentPanel orderId={props.orderId} />
    </StudentGate>
  );
}
