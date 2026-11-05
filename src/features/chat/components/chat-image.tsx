'use client';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { apiRequest } from '@/lib/api/client';
import { accessSchema } from '../schemas/chat-contracts';

export function ChatImage(props: { conversationId: string; messageId: string; name: string }) {
  const [access, setAccess] = useState<{ url: string; expiresAt: string } | null>(null);
  const [error, setError] = useState(false),
    [large, setLarge] = useState(false),
    [busy, setBusy] = useState(false);
  const [returnFocus, setReturnFocus] = useState<HTMLButtonElement | null>(null);
  const path = `chat/conversations/${props.conversationId}/messages/${props.messageId}/file-access?disposition=inline`;
  useEffect(() => {
    const controller = new AbortController();
    apiRequest({ path, method: 'POST', schema: accessSchema, signal: controller.signal })
      .then(setAccess)
      .catch(() => {
        if (!controller.signal.aborted) setError(true);
      });
    return () => controller.abort();
  }, [path]);
  async function refresh(open = false) {
    setBusy(true);
    setError(false);
    try {
      setAccess(await apiRequest({ path, method: 'POST', schema: accessSchema }));
      if (open) setLarge(true);
    } catch {
      setError(true);
      setAccess(null);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="mt-2 space-y-2">
      {access && !error ? (
        <button
          type="button"
          className="block max-w-full rounded-xl focus-visible:outline-2 focus-visible:outline-mint"
          aria-label={`Mở lớn ảnh ${props.name}`}
          onClick={(event) => {
            setReturnFocus(event.currentTarget);
            if (Date.parse(access.expiresAt) <= Date.now()) void refresh(true);
            else setLarge(true);
          }}
        >
          {/* Signed private URLs are short-lived and must bypass the public image optimizer. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={access.url}
            alt={props.name}
            className="max-h-64 max-w-full rounded-xl object-contain"
            onError={() => setError(true)}
          />
        </button>
      ) : (
        <p className="text-xs text-muted">
          {error ? 'Ảnh chưa tải được hoặc liên kết đã hết hạn.' : 'Đang tải ảnh…'}
        </p>
      )}
      {error && (
        <Button variant="link" disabled={busy} onClick={() => void refresh()}>
          Tải lại ảnh
        </Button>
      )}
      {large && access && (
        <Modal title={props.name} returnFocus={returnFocus} onClose={() => setLarge(false)}>
          <div className="p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={access.url}
              alt={props.name}
              className="max-h-[75dvh] w-full object-contain"
              onError={() => setError(true)}
            />
            {error && (
              <Button disabled={busy} onClick={() => void refresh()}>
                Lấy lại ảnh
              </Button>
            )}
          </div>
        </Modal>
      )}
    </div>
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
