'use client';
import { useEffect, useRef, useState } from 'react';
import { Paperclip, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { apiRequest, ApiError } from '@/lib/api/client';
import { sessionSignal } from '@/lib/api/session-coordinator';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { clearChatDraft } from '@/lib/store/ui-slice';
import { CODE_DRAG_TYPE } from '@/features/whiteboard/lib/code-board';
import { chatError, useRefreshChat } from '../api/chat-queries';
import { CHAT_TEXT_MAX, codeFence } from '../lib/chat-code';
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
  // A draft sent from the code workspace ("Gửi vào chat") fills a freshly opened composer.
  const draft = useAppSelector((state) => state.ui.chatDraft),
    dispatch = useAppDispatch();
  const [body, setBody] = useState(() => (draft ? draft.text.slice(0, CHAT_TEXT_MAX) : '')),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState('');
  const [pending, setPending] = useState<SendInput | null>(null),
    [attachment, setAttachment] = useState<{
      id: string;
      name: string;
      type: 'FILE' | 'IMAGE';
    } | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  const lifetime = useRef<AbortController | null>(null),
    fileInput = useRef<HTMLInputElement>(null),
    sending = useRef(false);
  useEffect(() => {
    if (draft) dispatch(clearChatDraft());
    // Consume the draft once, when this composer mounts with it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
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
      setNotice('Chọn ảnh JPG, PNG, WebP hoặc PDF, tối đa 10 MiB.');
      return;
    }
    setBusy(true);
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
      className="shrink-0 space-y-2 border-t border-line px-3 py-2.5"
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
      {attachment && (
        <div className="flex items-center justify-between gap-2 text-sm">
          <span className="truncate">{attachment.name}</span>
          <Button
            type="button"
            variant="ghost"
            disabled={locked}
            aria-label="Bỏ tệp đính kèm"
            onClick={() => setAttachment(null)}
          >
            <X aria-hidden="true" />
          </Button>
        </div>
      )}
      <label className="sr-only" htmlFor={`chat-${c.id}`}>
        Tin nhắn
      </label>
      <div className="flex items-end gap-1.5">
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
              size="icon-lg"
              aria-label="Đính kèm ảnh hoặc PDF"
              title="Đính kèm ảnh hoặc PDF"
              disabled={locked || !!processing}
              onClick={() => fileInput.current?.click()}
              className="shrink-0 rounded-full"
            >
              <Paperclip aria-hidden="true" />
            </Button>
          </>
        )}
        <Textarea
          id={`chat-${c.id}`}
          placeholder="Nhập tin nhắn… (Shift + Enter để xuống dòng)"
          rows={1}
          maxLength={4000}
          value={body}
          disabled={locked}
          onChange={(e) => setBody(e.target.value)}
          onDrop={(event) => {
            // Code dragged out of the editor arrives wrapped as a fenced code block.
            const language = event.dataTransfer.getData(CODE_DRAG_TYPE);
            if (language !== 'javascript' && language !== 'java21') return;
            event.preventDefault();
            const el = event.currentTarget;
            const block = codeFence(event.dataTransfer.getData('text/plain'), language);
            const before = body.slice(0, el.selectionStart);
            const after = body.slice(el.selectionEnd);
            const glue = (side: string) => (side && !side.endsWith('\n') ? '\n' : '');
            const next = `${before}${glue(before)}${block}\n${after}`;
            if (next.length > CHAT_TEXT_MAX) {
              setNotice('Đoạn code quá dài cho một tin nhắn (tối đa 4000 ký tự).');
              return;
            }
            setBody(next);
          }}
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
          className="max-h-32 min-h-10 flex-1 resize-none rounded-2xl py-2"
        />
        <Button
          type="submit"
          className="h-10 shrink-0 rounded-full px-4"
          disabled={busy || !!processing || (!pending && !body.trim() && !attachment)}
        >
          <Send aria-hidden="true" />
          {busy ? 'Đang xử lý…' : pending ? 'Thử gửi lại' : 'Gửi'}
        </Button>
      </div>
      {body.length > 3500 && (
        <p className="text-right text-xs text-muted tabular-nums">{body.length}/4.000</p>
      )}
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
