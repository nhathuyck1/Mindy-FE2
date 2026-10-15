'use client';

import Link from 'next/link';
import { type RefObject, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';

export function LoginRequiredDialog(props: {
  courseId: string;
  triggerRef: RefObject<HTMLButtonElement | null>;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const returnTo = encodeURIComponent('/courses/' + props.courseId);

  useEffect(() => {
    const element = dialog.current;
    const trigger = props.triggerRef.current;
    const previousOverflow = document.body.style.overflow;
    element?.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      element?.close();
      document.body.style.overflow = previousOverflow;
      if (trigger instanceof HTMLElement) trigger.focus();
    };
  }, [props.triggerRef]);

  return (
    <dialog
      ref={dialog}
      aria-labelledby="login-required-title"
      aria-describedby="login-required-description"
      onCancel={(event) => {
        event.preventDefault();
        props.onClose();
      }}
      className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-2xl border border-line bg-canvas p-6 text-forest shadow-2xl backdrop:bg-forest/55 sm:p-7"
    >
      <div className="flex items-center justify-between gap-4">
        <h2 id="login-required-title" className="text-xl font-extrabold">
          Bạn chưa đăng nhập
        </h2>
        <button
          type="button"
          onClick={props.onClose}
          aria-label="Đóng thông báo đăng nhập"
          className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-lg border border-line hover:bg-soft"
        >
          <Icon name="close" className="size-5" />
        </button>
      </div>
      <p id="login-required-description" className="mt-3 text-base leading-relaxed text-muted">
        Hãy đăng nhập để có thể đăng ký học ngay bây giờ.
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button variant="outline" className="min-h-11" onClick={props.onClose}>
          Để sau
        </Button>
        <Button asChild className="min-h-11">
          <Link href={'/login?returnTo=' + returnTo}>Đăng nhập ngay</Link>
        </Button>
      </div>
    </dialog>
  );
}
