import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { z } from 'zod';
import { CommerceShell } from '@/features/orders/components/commerce-shell';
import { CheckoutPage } from '@/features/orders/components/checkout-page';

export const metadata: Metadata = {
  title: 'Thanh toán | Mindy',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};
export default async function Page(props: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await props.params;
  if (!z.uuid().safeParse(orderId).success) notFound();
  return (
    <CommerceShell>
      <CheckoutPage orderId={orderId} />
    </CommerceShell>
  );
}
