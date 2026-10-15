import type { Metadata } from 'next';
import { CommerceShell } from '@/features/orders/components/commerce-shell';
import { PaymentResultPage } from '@/features/orders/components/payment-result-page';
import { providerOrderCodeSchema } from '@/features/payments/schemas/payment-contracts';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

export const metadata: Metadata = {
  title: 'Kết quả thanh toán | Mindy',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};
export default async function Page(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await props.searchParams;
  const code = providerOrderCodeSchema.safeParse(query.orderCode);
  return (
    <CommerceShell>
      {code.success ? (
        <PaymentResultPage orderCode={code.data} />
      ) : (
        <>
          <h1 className="section-title mb-6">Kết quả thanh toán</h1>
          <Alert>
            <AlertTitle>Mã thanh toán không hợp lệ</AlertTitle>
            <AlertDescription>
              Vui lòng mở lại đơn hàng từ giỏ hàng để kiểm tra thanh toán.
            </AlertDescription>
          </Alert>
        </>
      )}
    </CommerceShell>
  );
}
