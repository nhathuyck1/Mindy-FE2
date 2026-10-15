'use client';

import { Toaster as Sonner, type ToasterProps } from 'sonner';

export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="light"
      position="bottom-right"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: '!bg-card !text-card-foreground !border-border !font-sans',
          actionButton: '!bg-primary !text-primary-foreground',
        },
      }}
      {...props}
    />
  );
}
