'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from '@/features/auth/api/auth-queries';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { localReceiptRepository, receiptsCsv } from '../api/receipt-repository';
import { collectionMoney } from '../api/manager-collections';
import { ManagerState } from './manager-shared';

export function ManagerLocalReceipts(props: { onClose: () => void }) {
  const session = useSession();
  const receipts = useQuery({
    queryKey: ['manager', session.data?.id, 'local-receipts'],
    queryFn: () => localReceiptRepository.list(session.data?.id ?? ''),
    enabled: Boolean(session.data?.id),
    retry: false,
  });
  return (
    <Modal title="Phiếu cũ trên thiết bị" contentClassName="sm:max-w-3xl" onClose={props.onClose}>
      <div className="space-y-5 p-5">
        <p className="text-sm leading-6 text-muted">
          Các phiếu cũ chỉ để tra cứu và xuất dữ liệu. Chúng không xác nhận thanh toán và không được
          cộng vào danh sách đơn trên máy chủ.
        </p>
        <ManagerState pending={receipts.isPending} error={receipts.error} retry={receipts.refetch}>
          <ul className="divide-y divide-line">
            {receipts.data?.map((item) => (
              <li key={item.id} className="space-y-1 py-3 text-sm">
                <p className="font-semibold break-words">
                  {item.studentName} · {item.className}
                </p>
                <p>
                  {collectionMoney(item.amount)} ·{' '}
                  {item.status === 'DRAFT'
                    ? 'Phiếu nháp cũ'
                    : item.status === 'RECORDED_LOCAL'
                      ? 'Đã ghi nhận cục bộ'
                      : 'Đã hủy cục bộ'}
                </p>
              </li>
            ))}
          </ul>
          {receipts.data?.length === 0 && (
            <p className="text-sm text-muted">Không có phiếu cũ trên thiết bị này.</p>
          )}
        </ManagerState>
        <div className="flex flex-wrap justify-end gap-3">
          <Button
            variant="outline"
            disabled={!receipts.data?.length}
            onClick={() => {
              const url = URL.createObjectURL(
                new Blob([receiptsCsv(receipts.data ?? [])], { type: 'text/csv;charset=utf-8' }),
              );
              const link = document.createElement('a');
              link.href = url;
              link.download = 'mindy-phieu-cu-cuc-bo.csv';
              link.click();
              setTimeout(() => URL.revokeObjectURL(url), 1000);
            }}
          >
            Xuất phiếu cũ CSV
          </Button>
          <Button variant="outline" onClick={props.onClose}>
            Đóng
          </Button>
        </div>
      </div>
    </Modal>
  );
}
