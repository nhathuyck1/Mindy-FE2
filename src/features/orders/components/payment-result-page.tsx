'use client';

import { StudentGate, CommerceLoading, CommerceError } from './commerce-state';
import { usePaymentResult } from '../api/order-queries';
import { PaymentPanel } from '@/features/payments/components/payment-panel';

export function PaymentResultPage(props: { orderCode: string }) {
  return (
    <StudentGate returnTo={`/payment/result?orderCode=${props.orderCode}`}>
      <PaymentResultContent orderCode={props.orderCode} />
    </StudentGate>
  );
}

function PaymentResultContent(props: { orderCode: string }) {
  const result = usePaymentResult(props.orderCode);
  if (result.isPending) return <CommerceLoading />;
  if (result.isError)
    return (
      <CommerceError
        error={result.error}
        retry={() => void result.refetch()}
        returnTo={`/payment/result?orderCode=${props.orderCode}`}
      />
    );
  return <PaymentPanel orderId={result.data.id} />;
}
