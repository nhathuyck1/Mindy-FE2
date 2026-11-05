'use client';
import { useEffect, useRef, useState } from 'react';
import { Paperclip, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { LocalImagePreview } from './chat-image';
import { apiRequest, ApiError } from '@/lib/api/client';
import { sessionSignal } from '@/lib/api/session-coordinator';
import { chatError, useRefreshChat } from '../api/chat-queries';
import {
  chatMutationSchema,
  fileStatusSchema,
  sendSchema,
  uploadInput,
  uploadIntentSchema,
  type Conversation,
  type ChatMessage,
  type SendInput,
} from '../schemas/chat-contracts';

export function ChatComposer(props: {
  conversation: Conversation;
  reply: ChatMessage | null;
  onClearReply: () => void;
}) {
  const c = props.conversation,
    refresh = useRefreshChat();
  const [body, setBody] = useState(''),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState('');
  const [pending, setPending] = useState<SendInput | null>(null),
    [attachment, setAttachment] = useState<{
      id: string;
      name: string;
      type: 'FILE' | 'IMAGE';
    } | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const textInput = useRef<HTMLTextAreaElement>(null);
  const lifetime = useRef<AbortController | null>(null),
    fileInput = useRef<HTMLInputElement>(null),
    sending = useRef(false);
  useEffect(() => {
    lifetime.current = new AbortController();
    return () => lifetime.current?.abort();
  }, []);
  const signal = () =>
    AbortSignal.any([sessionSignal(), lifetime.current?.signal ?? AbortSignal.abort()]);
  useEffect(() => {
    if (!processing) return;
    const controller = new AbortController();
    const active = AbortSignal.any([sessionSignal(), controller.signal]);
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout>;
    async function poll() {
      try {
        const result = await apiRequest({
          path: `chat/conversations/${c.id}/attachments/${processing}`,
          schema: fileStatusSchema,
          signal: active,
        });
        if (result.status === 'READY' && result.file) {
          setAttachment({
            id: result.id,
            name: result.originalFilename,
            type: result.file.kind === 'IMAGE' ? 'IMAGE' : 'FILE',
          });
          setProcessing(null);
          setNotice('');
          return;
        }
        if (['FAILED', 'DELETED', 'DELETING'].includes(result.status)) {
          setProcessing(null);
          setNotice('Tệp không được chấp nhận. Vui lòng chọn tệp khác.');
          return;
        }
        if (++attempts < 15) timer = setTimeout(() => void poll(), 2000);
      } catch {
        /* Keep the file ID for an explicit status check after transient failures. */
      }
    }
    timer = setTimeout(() => void poll(), 1500);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [processing, c.id]);
  const locked = busy || !!pending;
  async function send() {
    if (sending.current) return;
    const input = pending ?? {
      clientMessageId: crypto.randomUUID(),
      type: attachment?.type ?? 'TEXT',
      ...(body.trim() ? { body } : {}),
      ...(attachment ? { fileObjectId: attachment.id } : {}),
      ...(props.reply ? { replyToMessageId: props.reply.id } : {}),
    };
    if (!sendSchema.safeParse(input).success) {
      setNotice('Nhập tin nhắn tối đa 4.000 ký tự hoặc chọn tệp.');
      return;
    }
    sending.current = true;
    setPending(input);
    setBusy(true);
    setNotice('');
    try {
      await apiRequest({
        path: `chat/conversations/${c.id}/messages`,
        method: 'POST',
        body: input,
        schema: chatMutationSchema,
        signal: signal(),
      });
      setBody('');
      setAttachment(null);
      setPreviewFile(null);
      setPending(null);
      props.onClearReply();
      void refresh();
    } catch (e) {
      if (e instanceof ApiError && e.status < 500 && ![408, 429].includes(e.status)) {
        setPending(null);
        setNotice(chatError(e));
      } else
        setNotice(
          'Chưa nhận được xác nhận gửi. Nhấn Thử gửi lại để kiểm tra cùng tin nhắn, tránh gửi trùng.',
        );
    } finally {
      sending.current = false;
      setBusy(false);
    }
  }
  async function checkFile(id: string) {
    const result = await apiRequest({
      path: `chat/conversations/${c.id}/attachments/${id}/complete`,
      method: 'POST',
      schema: fileStatusSchema,
      signal: signal(),
    });
    if (result.status === 'READY' && result.file) {
      setAttachment({
        id: result.id,
        name: result.originalFilename,
        type: result.file.kind === 'IMAGE' ? 'IMAGE' : 'FILE',
      });
      setProcessing(null);
      setNotice('');
    } else if (['FAILED', 'DELETED', 'DELETING'].includes(result.status)) {
      setProcessing(null);
      setNotice('Tệp không được chấp nhận. Vui lòng chọn tệp khác.');
    } else {
      setProcessing(id);
      setNotice('Tệp đang được kiểm tra. Nhấn Kiểm tra tệp để cập nhật.');
    }
  }
  async function upload(file: File) {
    if (busy || pending) return;
    const input = uploadInput.safeParse({
      originalFilename: file.name,
      declaredMimeType: file.type,
      declaredSizeBytes: file.size,
    });
    if (!input.success) {
      setNotice('Chọn ảnh JPG, PNG, WebP tối đa 5 MiB hoặc PDF tối đa 10 MiB.');
      return;
    }
    setBusy(true);
    setPreviewFile(file.type.startsWith('image/') ? file : null);
    setAttachment(null);
    setProcessing(null);
    setNotice('Đang tải tệp…');
    try {
      const active = signal();
      const intent = await apiRequest({
        path: `chat/conversations/${c.id}/attachments/upload-intents`,
        method: 'POST',
        body: input.data,
        idempotencyKey: crypto.randomUUID(),
        schema: uploadIntentSchema,
        signal: active,
      });
      const uploaded = await fetch(intent.uploadUrl, {
        method: 'PUT',
        body: file,
        headers: intent.requiredHeaders,
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
        signal: AbortSignal.any([active, AbortSignal.timeout(60000)]),
      });
      if (!uploaded.ok) throw new Error('Upload failed');
      setProcessing(intent.fileId);
      await checkFile(intent.fileId);
    } catch (e) {
      setNotice(chatError(e));
    } finally {
      setBusy(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  }
  return (
    <form
      className="shrink-0 space-y-3 border-t border-line p-4"
      onSubmit={(e) => {
        e.preventDefault();
        void send();
      }}
    >
      {props.reply && (
        <div className="flex items-center justify-between gap-2 rounded-lg bg-soft p-2 text-xs">
          <span className="truncate">Trả lời {props.reply.sender.displayName}</span>
          <Button
            type="button"
            variant="ghost"
            aria-label="Hủy trả lời"
            disabled={locked}
            onClick={props.onClearReply}
          >
            <X aria-hidden="true" />
          </Button>
        </div>
      )}
      {previewFile && (
        <LocalImagePreview key={previewFile.name + previewFile.lastModified} file={previewFile} />
      )}
      {attachment && (
        <div className="flex items-center justify-between gap-2 text-sm">
          <span className="truncate">{attachment.name}</span>
          <Button
            type="button"
            variant="ghost"
            disabled={locked}
            aria-label="Bỏ tệp đính kèm"
            onClick={() => {
              setAttachment(null);
              setPreviewFile(null);
            }}
          >
            <X aria-hidden="true" />
          </Button>
        </div>
      )}
      <label className="sr-only" htmlFor={`chat-${c.id}`}>
        Tin nhắn
      </label>
      <Textarea
        ref={textInput}
        id={`chat-${c.id}`}
        placeholder="Nhập tin nhắn…"
        rows={2}
        maxLength={4000}
        value={body}
        disabled={locked}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={(event) => {
          if (
            event.key !== 'Enter' ||
            event.shiftKey ||
            event.nativeEvent.isComposing ||
            event.nativeEvent.keyCode === 229
          )
            return;
          event.preventDefault();
          if (!busy && !processing && (pending || body.trim() || attachment)) void send();
        }}
        className="max-h-40 min-h-20 resize-y"
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <details className="relative">
            <summary className="cursor-pointer rounded-xl p-3 text-sm" aria-label="Chọn emoji">
              😊
            </summary>
            <div className="absolute bottom-full left-0 z-10 grid w-56 grid-cols-5 gap-1 rounded-xl border border-line bg-canvas p-2 shadow-lg">
              {[
                '😀',
                '😊',
                '😂',
                '❤️',
                '👍',
                '🎉',
                '🥳',
                '👏',
                '🔥',
                '🤔',
                '😢',
                '🙏',
                '💯',
                '✅',
                '👨‍👩‍👧‍👦',
              ].map((emoji) => (
                <Button
                  key={emoji}
                  type="button"
                  variant="ghost"
                  disabled={locked}
                  aria-label={`Chèn ${emoji}`}
                  onClick={() => {
                    const start = textInput.current?.selectionStart ?? body.length,
                      end = textInput.current?.selectionEnd ?? start;
                    const next = body.slice(0, start) + emoji + body.slice(end);
                    if (next.length <= 4000) {
                      setBody(next);
                      requestAnimationFrame(() => {
                        textInput.current?.focus();
                        textInput.current?.setSelectionRange(
                          start + emoji.length,
                          start + emoji.length,
                        );
                      });
                    }
                  }}
                >
                  {emoji}
                </Button>
              ))}
            </div>
          </details>
          {c.capabilities.canAttach && (
            <>
              <input
                ref={fileInput}
                type="file"
                className="sr-only"
                aria-label="Chọn ảnh hoặc PDF"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                disabled={locked}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void upload(file);
                }}
              />
              <Button
                type="button"
                variant="ghost"
                aria-label="Đính kèm ảnh hoặc PDF"
                disabled={locked || !!processing}
                onClick={() => fileInput.current?.click()}
              >
                <Paperclip aria-hidden="true" />
              </Button>
            </>
          )}
          <span className="text-xs text-muted">{body.length}/4.000</span>
        </div>
        <Button
          type="submit"
          disabled={busy || !!processing || (!pending && !body.trim() && !attachment)}
        >
          <Send aria-hidden="true" />
          {busy ? 'Đang xử lý…' : pending ? 'Thử gửi lại' : 'Gửi'}
        </Button>
      </div>
      <p className="text-xs text-muted">Enter để gửi · Shift + Enter để xuống dòng</p>
      {notice && (
        <p role="status" className="text-xs text-muted">
          {notice}
        </p>
      )}
      {processing && (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => {
              setBusy(true);
              void checkFile(processing)
                .catch((e) => setNotice(chatError(e)))
                .finally(() => setBusy(false));
            }}
          >
            Kiểm tra tệp
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={busy}
            onClick={() => {
              setProcessing(null);
              setPreviewFile(null);
              setNotice('');
            }}
          >
            Bỏ tệp
          </Button>
        </div>
      )}
    </form>
  );
}
