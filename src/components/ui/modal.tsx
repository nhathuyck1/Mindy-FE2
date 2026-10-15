'use client';
import { useState } from 'react';
import { Button } from './button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from './sheet';
import { Icon } from './icon';
import { cn } from '@/lib/utils';
export function Modal(props: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  sheet?: boolean;
  contentClassName?: string;
  returnFocus?: HTMLElement | null;
  embedded?: boolean;
  id?: string;
}) {
  const [returnFocus] = useState(
    () => props.returnFocus ?? (typeof document === 'undefined' ? null : document.activeElement),
  );
  const onOpenChange = (open: boolean) => {
    if (!open) props.onClose();
  };
  const restoreFocus = (event: Event) => {
    event.preventDefault();
    if (returnFocus instanceof HTMLElement && returnFocus.isConnected)
      returnFocus.focus({ preventScroll: true });
  };
  const close = (
    <Button
      type="button"
      variant="unstyled"
      size="unstyled"
      aria-label="Đóng"
      onClick={props.onClose}
      className="admin-icon-button"
    >
      <Icon name="close" />
    </Button>
  );
  if (props.embedded) return <section className="min-w-0 text-forest">{props.children}</section>;
  if (props.sheet)
    return (
      <Sheet open onOpenChange={onOpenChange}>
        <SheetContent
          side="left"
          showCloseButton={false}
          aria-describedby={undefined}
          onCloseAutoFocus={restoreFocus}
          className="admin-typography h-dvh w-72 max-w-[calc(100vw-2rem)] gap-0 overflow-y-auto border-line p-0 text-forest sm:max-w-72"
        >
          <SheetHeader className="flex-row items-center justify-between gap-4 border-b border-line p-5">
            <SheetTitle className="text-lg font-extrabold">{props.title}</SheetTitle>
            {close}
          </SheetHeader>
          {props.children}
        </SheetContent>
      </Sheet>
    );
  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent
        id={props.id}
        aria-modal="true"
        showCloseButton={false}
        aria-describedby={undefined}
        onCloseAutoFocus={restoreFocus}
        className={cn(
          'admin-typography scrollbar-hidden block max-h-[90dvh] max-w-xl overflow-y-auto rounded-2xl border-line p-0 text-forest sm:max-w-xl [&_*]:scrollbar-hidden',
          props.contentClassName,
        )}
      >
        <DialogHeader className="flex-row items-center justify-between gap-4 border-b border-line p-5">
          <DialogTitle className="text-lg font-extrabold">{props.title}</DialogTitle>
          {close}
        </DialogHeader>
        {props.children}
      </DialogContent>
    </Dialog>
  );
}
