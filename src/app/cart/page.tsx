import type { Metadata } from 'next';
import { CommerceShell } from '@/features/orders/components/commerce-shell';
import { CartPage } from '@/features/cart/components/cart-page';

export const metadata: Metadata = {
  title: 'Giỏ hàng | Mindy',
  robots: { index: false, follow: false },
};
export default function Page() {
  return (
    <CommerceShell>
      <CartPage />
    </CommerceShell>
  );
}
