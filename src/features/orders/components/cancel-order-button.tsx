'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ApiError } from '@/lib/api/client';
import { useCancelOrder } from '../api/order-queries';
import type { Order } from '../schemas/order-contracts';

export function CancelOrderButton(props: {
  order: Order;
  onCancelled?: (order: Order) => void;
  disabled?: boolean;
}) {
  const [confirming, setConfirming] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const cancel = useCancelOrder();
  const submitted = useRef(false);
  if (props.order.status !== 'PENDING') return null;

  async function confirm() {
    if (submitted.current) return;
    submitted.current = true;
    try {
      const result = await cancel.mutateAsync(props.order.id);
      props.onCancelled?.(result);
      toast.success('Đã hủy đơn hàng và giải phóng chỗ giữ.');
      setConfirming(false);
    } catch (error) {
      submitted.current = false;
      setErrorMessage(
        error instanceof ApiError && error.code === 'ORDER_NOT_CANCELLABLE'
          ? 'Đơn đã thanh toán hoặc hết hạn nên không thể hủy. Vui lòng kiểm tra trạng thái mới nhất.'
          : 'Chưa xác nhận được kết quả hủy đơn. Vui lòng kiểm tra trạng thái và thử lại.',
      );
    }
  }

  return (
    <>
      <Button
        variant="outline"
        className="min-h-11"
        disabled={cancel.isPending || props.disabled}
        onClick={() => {
          setErrorMessage(null);
          setConfirming(true);
        }}
      >
        Hủy đơn hàng
      </Button>
      {confirming && (
        <CancelOrderConfirmation
          orderCode={props.order.orderCode}
          pending={cancel.isPending}
          disabled={props.disabled}
          errorMessage={errorMessage}
          onClose={() => setConfirming(false)}
          onConfirm={() => void confirm()}
        />
      )}
    </>
  );
}

function CancelOrderConfirmation(props: {
  orderCode: string;
  pending: boolean;
  disabled?: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const keepButton = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  useEffect(() => {
    const element = dialog.current;
    const trigger = document.activeElement;
    const overflow = document.body.style.overflow;
    element?.showModal();
    document.body.style.overflow = 'hidden';
    keepButton.current?.focus();
    return () => {
      element?.close();
      document.body.style.overflow = overflow;
      if (trigger instanceof HTMLElement && trigger.isConnected)
        trigger.focus({ preventScroll: true });
    };
  }, []);
  // Native top layer also works when opened from the native order-details dialog.
  return createPortal(
    <dialog
      ref={dialog}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={(event) => {
        event.preventDefault();
        event.stopPropagation();
        if (!props.pending) props.onClose();
      }}
      className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-2xl border border-line bg-canvas p-6 font-sans text-ink shadow-2xl backdrop:bg-forest/40"
    >
      <h2 id={titleId} className="text-xl font-extrabold">
        Hủy đơn hàng?
      </h2>
      <p className="mt-2 text-sm font-bold break-all text-muted">{props.orderCode}</p>
      <p id={descriptionId} className="mt-4 text-sm leading-6 whitespace-normal">
        Các lớp trong đơn sẽ được bỏ giữ chỗ. Không chuyển tiền cho đơn này sau khi hủy.
      </p>
      {props.errorMessage && (
        <p role="alert" className="mt-4 rounded-lg bg-coral/10 p-3 text-sm">
          {props.errorMessage}
        </p>
      )}
      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button
          ref={keepButton}
          variant="outline"
          className="min-h-11"
          disabled={props.pending}
          onClick={props.onClose}
        >
          Giữ đơn hàng
        </Button>
        <Button
          variant="destructive"
          className="min-h-11"
          disabled={props.pending || props.disabled}
          onClick={props.onConfirm}
        >
          {props.pending ? 'Đang hủy…' : 'Xác nhận hủy'}
        </Button>
      </div>
    </dialog>,
    document.body,
  );
}
