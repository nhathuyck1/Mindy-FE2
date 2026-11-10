'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { Dialog } from 'radix-ui';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/api/client';
import { cn } from '@/lib/utils';
import { accessSchema } from '../schemas/chat-contracts';

export function ChatImage(props: { conversationId: string; messageId: string; name: string }) {
  const [access, setAccess] = useState<{ url: string; expiresAt: string } | null>(null);
  const [error, setError] = useState(false),
    [large, setLarge] = useState(false),
    [busy, setBusy] = useState(false);
  const [loadedUrl, setLoadedUrl] = useState<string>();
  const trigger = useRef<HTMLButtonElement>(null);
  const lifetime = useRef<AbortController>(null);
  const path = `chat/conversations/${props.conversationId}/messages/${props.messageId}/file-access?disposition=inline`;
  const showError = useCallback(() => {
    setError(true);
    setLoadedUrl(undefined);
    toast.error('Không tải được ảnh. Vui lòng thử lại.', { id: `chat-image-${props.messageId}` });
  }, [props.messageId]);
  useEffect(() => {
    const controller = new AbortController();
    lifetime.current = controller;
    apiRequest({ path, method: 'POST', schema: accessSchema, signal: controller.signal })
      .then((next) => {
        if (!controller.signal.aborted) setAccess(next);
      })
      .catch(() => {
        if (!controller.signal.aborted) showError();
      });
    return () => controller.abort();
  }, [path, showError]);
  async function refresh(open = false) {
    const signal = lifetime.current?.signal;
    if (busy || !signal || signal.aborted) return;
    setBusy(true);
    try {
      const next = await apiRequest({ path, method: 'POST', schema: accessSchema, signal });
      if (signal.aborted) return;
      setAccess(next);
      setError(false);
      if (open) setLarge(true);
    } catch {
      if (!signal.aborted) {
        showError();
        setAccess(null);
      }
    } finally {
      if (!signal.aborted) setBusy(false);
    }
  }
  return (
    <Dialog.Root open={large} onOpenChange={setLarge}>
      {access && !error && (
        <button
          ref={trigger}
          type="button"
          className={cn(
            'block max-w-full cursor-zoom-in rounded-xl focus-visible:outline-2 focus-visible:outline-mint',
            loadedUrl !== access.url && 'invisible',
          )}
          aria-label={`Mở lớn ảnh ${props.name}`}
          aria-disabled={busy}
          onClick={() => {
            if (busy) return;
            if (Date.parse(access.expiresAt) <= Date.now()) void refresh(true);
            else setLarge(true);
          }}
        >
          {/* Signed private URLs are short-lived and must bypass the public image optimizer. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={access.url}
            alt=""
            className="max-h-64 max-w-full rounded-xl object-contain"
            onLoad={() => setLoadedUrl(access.url)}
            onError={showError}
          />
        </button>
      )}
      {error && (
        <Button ref={trigger} variant="link" disabled={busy} onClick={() => void refresh()}>
          Tải lại ảnh
        </Button>
      )}
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-ink" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed inset-0 z-50 flex items-center justify-center px-4 py-16 outline-none"
          onClick={(event) => {
            if (event.target === event.currentTarget) setLarge(false);
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            trigger.current?.focus({ preventScroll: true });
          }}
        >
          <Dialog.Title className="sr-only">Xem ảnh</Dialog.Title>
          <Dialog.Close asChild>
            <Button
              variant="ghost"
              aria-label="Đóng ảnh"
              className="absolute top-3 right-3 size-11 rounded-full p-0 text-canvas hover:bg-canvas/10 hover:text-canvas"
            >
              <X aria-hidden="true" />
            </Button>
          </Dialog.Close>
          {access && !error && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={access.url}
              alt={props.name}
              className={cn(
                'max-h-full max-w-full object-contain',
                loadedUrl !== access.url && 'invisible',
              )}
              onLoad={() => setLoadedUrl(access.url)}
              onError={showError}
            />
          )}
          {error && (
            <Button disabled={busy} onClick={() => void refresh()}>
              Tải lại ảnh
            </Button>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
export function LocalImagePreview(props: { file: File }) {
  const element = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const url = URL.createObjectURL(props.file);
    if (element.current) element.current.src = url;
    return () => URL.revokeObjectURL(url);
  }, [props.file]);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={element}
      alt={`Ảnh đã chọn: ${props.file.name}`}
      className="max-h-40 max-w-full rounded-xl object-contain"
    />
  );
}
