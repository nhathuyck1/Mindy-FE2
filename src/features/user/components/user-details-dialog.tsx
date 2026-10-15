'use client';

import { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function UserDetailsDialog(props: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    const trigger = document.activeElement;
    const overflow = document.body.style.overflow;
    dialog?.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      dialog?.close();
      document.body.style.overflow = overflow;
      if (trigger instanceof HTMLElement) trigger.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        props.onClose();
      }}
      className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-3xl overflow-y-auto overscroll-contain rounded-2xl border border-line bg-canvas p-0 text-black shadow-2xl backdrop:bg-forest/50"
    >
      <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-line bg-canvas px-5 py-4 sm:px-6">
        <h2 id={titleId} className="text-lg font-extrabold sm:text-xl">
          {props.title}
        </h2>
        <Button variant="ghost" size="icon-lg" aria-label="Đóng chi tiết" onClick={props.onClose}>
          <X aria-hidden="true" />
        </Button>
      </div>
      <div className="space-y-6 p-5 sm:p-6">{props.children}</div>
    </dialog>
  );
}
