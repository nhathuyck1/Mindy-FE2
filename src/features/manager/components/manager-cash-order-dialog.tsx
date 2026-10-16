'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { ApiError } from '@/lib/api/client';
import { useManagerCommand, useManagerQuery } from '../api/manager-queries';
import {
  cashCollectionError,
  collectionMoney,
  collectionStatuses,
} from '../api/manager-collections';
import {
  collectionOrderDetailSchema,
  confirmedCashOrderSchema,
  confirmCashSchema,
  type ConfirmedCashOrder,
} from '../schemas/manager-collections-contracts';
import { ManagerState, managerDate } from './manager-shared';

export function ManagerCashOrderDialog(props: {
  id: string;
  onClose: () => void;
  onSuccess: (order: ConfirmedCashOrder) => void;
}) {
  const detail = useManagerQuery(`manager/orders/${props.id}`, collectionOrderDetailSchema);
  const command = useManagerCommand(confirmedCashOrderSchema);
  const [amount, setAmount] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);
  const [error, setError] = useState('');
  const [needsCheck, setNeedsCheck] = useState(false);
  const [forbidden, setForbidden] = useState(false);
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const order = detail.data;
  const eligible =
    order?.paymentType === 'CASH' &&
    order.status === 'PENDING' &&
    order.totalAmount > 0 &&
    order.details.length > 0 &&
    Date.parse(order.expiresAt) > now &&
    order.payment?.status !== 'REQUIRES_REVIEW';
  const matches =
    order &&
    Number(amount) === order.totalAmount &&
    confirmCashSchema.safeParse({ receivedAmount: Number(amount) }).success;
  const busy = command.isPending;
  return (
    <Modal
      title="Chi tiết & thu tiền"
      contentClassName="sm:max-w-3xl"
      onClose={() => {
        if (!busy) props.onClose();
      }}
    >
      <div className="space-y-5 p-5 sm:p-7">
        <ManagerState pending={detail.isPending} error={detail.error} retry={detail.refetch}>
          {order && (
            <>
              <div className="flex flex-wrap justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs text-muted">Mã đơn</p>
                  <h2 className="mt-1 text-xl font-bold break-all">{order.orderCode}</h2>
                  <p className="mt-2 text-sm">
                    Học viên: <strong>{order.student.displayName || 'Chưa cập nhật tên'}</strong>
                  </p>
                </div>
                <span className="h-fit rounded-lg bg-soft px-3 py-2 text-sm font-semibold">
                  {collectionStatuses[order.status]}
                </span>
              </div>
              <section className="rounded-xl border border-line" aria-label="Các lớp trong đơn">
                <h3 className="border-b border-line p-4 text-sm font-semibold">
                  Toàn bộ {order.details.length} lớp trong đơn
                </h3>
                <ul className="divide-y divide-line">
                  {order.details.map((item) => (
                    <li key={item.id} className="flex flex-wrap justify-between gap-3 p-4 text-sm">
                      <div className="min-w-0">
                        <p className="font-semibold break-words">{item.className}</p>
                        <p className="mt-1 text-muted break-words">{item.courseTitle}</p>
                      </div>
                      <span className="whitespace-nowrap font-semibold">
                        {collectionMoney(item.totalAmount)}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="flex flex-wrap justify-between gap-3 border-t border-line bg-soft p-4 font-bold">
                  <span>Tổng phải thu cả đơn</span>
                  <span>{collectionMoney(order.totalAmount)}</span>
                </p>
              </section>
              <dl className="grid gap-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-muted">Phương thức</dt>
                  <dd className="mt-1 font-semibold">
                    {order.paymentType === 'CASH' ? 'Tiền mặt' : 'payOS'}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted">Hạn thanh toán</dt>
                  <dd className="mt-1">{managerDate(order.expiresAt)}</dd>
                </div>
                {order.paidAt && (
                  <div>
                    <dt className="text-muted">Đã thanh toán lúc</dt>
                    <dd className="mt-1">{managerDate(order.paidAt)}</dd>
                  </div>
                )}
                {order.payment?.confirmedBy && (
                  <div>
                    <dt className="text-muted">Người xác nhận thu</dt>
                    <dd className="mt-1">
                      {order.payment.confirmedBy.displayName || 'Chưa cập nhật tên'}
                      {order.payment.confirmedBy.source === 'LEGACY_MENTOR' ? ' (dữ liệu cũ)' : ''}
                    </dd>
                  </div>
                )}
              </dl>
              {order.status === 'PAID' && (
                <p role="status" className="rounded-xl bg-mint/10 p-4 text-sm font-semibold">
                  Đơn hàng đã được thanh toán.
                </p>
              )}
              {order.payment?.review && (
                <p role="alert" className="rounded-xl bg-peach p-4 text-sm">
                  Giao dịch cần đối soát:{' '}
                  {order.payment.review.reason || 'Liên hệ quản trị viên để kiểm tra.'}
                </p>
              )}
              {eligible && (
                <form
                  className="space-y-4 border-t border-line pt-5"
                  onSubmit={async (event) => {
                    event.preventDefault();
                    if (
                      !order ||
                      !matches ||
                      !acknowledged ||
                      busy ||
                      needsCheck ||
                      forbidden ||
                      detail.isFetching ||
                      Date.parse(order.expiresAt) <= Date.now()
                    )
                      return;
                    setError('');
                    try {
                      const result = await command.mutateAsync({
                        path: `manager/cash-orders/${order.id}/confirm`,
                        body: { receivedAmount: Number(amount) },
                      });
                      if (result.id !== order.id || result.totalAmount !== order.totalAmount)
                        throw new Error('Kết quả không khớp với đơn.');
                      props.onSuccess(result);
                    } catch (failure) {
                      setError(cashCollectionError(failure));
                      setNeedsCheck(true);
                      setForbidden(
                        failure instanceof ApiError && [401, 403, 404].includes(failure.status),
                      );
                      setAcknowledged(false);
                      await detail.refetch();
                    }
                  }}
                >
                  <p className="text-sm leading-6 text-muted">
                    Chỉ xác nhận sau khi đã nhận đủ tổng tiền của tất cả các lớp trong đơn. Xác nhận
                    một lần cho cả đơn.
                  </p>
                  <label className="block text-sm font-semibold">
                    Tiền đã nhận (VND)
                    <Input
                      type="number"
                      name="receivedAmount"
                      min={1}
                      max={Number.MAX_SAFE_INTEGER}
                      step={1}
                      required
                      value={amount}
                      disabled={busy || needsCheck || forbidden}
                      onChange={(event) => setAmount(event.target.value)}
                      className="mt-2"
                    />
                  </label>
                  {amount && !matches && (
                    <p role="status" className="text-sm text-muted">
                      Số tiền phải bằng {collectionMoney(order.totalAmount)}.
                    </p>
                  )}
                  <label className="flex items-start gap-3 text-sm leading-6">
                    <input
                      type="checkbox"
                      className="mt-1 size-4 shrink-0"
                      checked={acknowledged}
                      disabled={busy || needsCheck || forbidden}
                      onChange={(event) => setAcknowledged(event.target.checked)}
                    />
                    <span>
                      Tôi đã nhận đủ {collectionMoney(order.totalAmount)} cho toàn bộ đơn này.
                    </span>
                  </label>
                  <Button
                    type="submit"
                    disabled={
                      !matches ||
                      !acknowledged ||
                      busy ||
                      needsCheck ||
                      forbidden ||
                      detail.isFetching
                    }
                  >
                    {busy ? 'Đang xác nhận…' : 'Xác nhận đã thu tiền'}
                  </Button>
                </form>
              )}
              {!eligible && order.status === 'PENDING' && (
                <p role="status" className="rounded-xl bg-soft p-4 text-sm">
                  {order.paymentType !== 'CASH'
                    ? 'Đơn payOS được cập nhật qua hệ thống thanh toán.'
                    : Date.parse(order.expiresAt) <= now
                      ? 'Đơn đã quá hạn thu tiền. Hãy kiểm tra lại trạng thái.'
                      : 'Đơn này hiện chưa đủ điều kiện xác nhận thu tiền.'}
                </p>
              )}
            </>
          )}
        </ManagerState>
        {error && (
          <div role="alert" className="space-y-3 rounded-xl bg-peach p-4 text-sm">
            <p>{error}</p>
            {!forbidden && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={busy || detail.isFetching}
                onClick={async () => {
                  const result = await detail.refetch();
                  if (result.isSuccess) {
                    setNeedsCheck(false);
                    setError('');
                    command.reset();
                  }
                }}
              >
                Kiểm tra lại đơn
              </Button>
            )}
          </div>
        )}
        <div className="flex justify-end border-t border-line pt-4">
          <Button variant="outline" disabled={busy} onClick={props.onClose}>
            Đóng
          </Button>
        </div>
      </div>
    </Modal>
  );
}
