'use client';
import { useEffect, useRef, useState } from 'react';
import { MoreVertical, Reply } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { NameAvatar } from '@/components/ui/name-avatar';
import { Textarea } from '@/components/ui/textarea';
import { apiRequest } from '@/lib/api/client';
import { cn } from '@/lib/utils';
import { ChatImage } from './chat-image';
import { chatError, useRefreshChat } from '../api/chat-queries';
import {
  accessSchema,
  chatMutationSchema,
  textSchema,
  type ChatMessage,
} from '../schemas/chat-contracts';
export function ChatMessageItem(props: {
  message: ChatMessage;
  own: boolean;
  canSend: boolean;
  onReply: (m: ChatMessage) => void;
}) {
  const m = props.message,
    refresh = useRefreshChat();
  const menuTrigger = useRef<HTMLButtonElement>(null);
  const [returnFocus, setReturnFocus] = useState<HTMLButtonElement | null>(null);
  const [mode, setMode] = useState<'edit' | 'delete' | null>(null),
    [body, setBody] = useState(''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const [snapshot, setSnapshot] = useState(m.version),
    [blocked, setBlocked] = useState(false);
  const [withinEditWindow, setWithinEditWindow] = useState(
    () => Date.now() - Date.parse(m.createdAt) < 15 * 60 * 1000,
  );
  useEffect(() => {
    const remaining = Date.parse(m.createdAt) + 15 * 60 * 1000 - Date.now();
    if (remaining <= 0) return;
    const timer = setTimeout(() => setWithinEditWindow(false), remaining);
    return () => clearTimeout(timer);
  }, [m.createdAt]);
  async function change() {
    setBusy(true);
    setError('');
    try {
      await apiRequest({
        path: `chat/conversations/${m.conversationId}/messages/${m.id}${mode === 'delete' ? `?expectedVersion=${snapshot}` : ''}`,
        method: mode === 'delete' ? 'DELETE' : 'PATCH',
        body: mode === 'edit' ? { body, expectedVersion: snapshot } : undefined,
        idempotencyKey: crypto.randomUUID(),
        schema: chatMutationSchema,
      });
      setMode(null);
    } catch (e) {
      setError(chatError(e));
      setBlocked(true);
    } finally {
      setBusy(false);
      void refresh();
    }
  }
  async function download() {
    setBusy(true);
    setError('');
    const tab = window.open('about:blank', '_blank');
    if (tab) tab.opener = null;
    try {
      const access = await apiRequest({
        path: `chat/conversations/${m.conversationId}/messages/${m.id}/file-access`,
        method: 'POST',
        schema: accessSchema,
      });
      if (tab) tab.location.replace(access.url);
      else throw new Error('Popup blocked');
    } catch (e) {
      tab?.close();
      setError(chatError(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <article
      className={cn('flex items-start gap-2', props.own && 'flex-row-reverse')}
      aria-label={`Tin nhắn của ${m.sender.displayName}`}
    >
      <NameAvatar name={m.sender.displayName} className="size-9 text-xs" />
      <div className="min-w-0 max-w-[calc(100%-2.75rem)] sm:max-w-[85%]">
        <p className={cn('mb-1 text-xs text-muted', props.own && 'text-right')}>
          {m.sender.displayName}
        </p>
        <div className={cn('flex items-center gap-1', props.own && 'flex-row-reverse')}>
          <div
            className={cn(
              'min-w-0 rounded-2xl border border-line bg-canvas px-4 py-3 text-sm',
              props.own && 'border-mint/20 bg-mint/10',
            )}
          >
            {m.deletedAt ? (
              <p className="italic text-muted">Tin nhắn đã xóa</p>
            ) : (
              <>
                {m.replyTo && (
                  <p className="mb-2 border-l-2 border-mint pl-2 text-xs text-muted">
                    Trả lời {m.replyTo.senderDisplayName}
                    {m.replyTo.deleted ? ' · Tin nhắn đã xóa' : ''}
                  </p>
                )}
                {m.body && <p className="whitespace-pre-wrap [overflow-wrap:anywhere]">{m.body}</p>}
                {m.file && m.type === 'IMAGE' && (
                  <ChatImage
                    conversationId={m.conversationId}
                    messageId={m.id}
                    name={m.file.originalFilename}
                  />
                )}
                {m.file && (
                  <Button
                    variant="link"
                    className="max-w-full whitespace-normal break-all px-0 text-left"
                    disabled={busy}
                    onClick={() => void download()}
                  >
                    {m.type === 'IMAGE' ? 'Xem ảnh' : 'Tải PDF'} · {m.file.originalFilename}
                  </Button>
                )}
              </>
            )}
            <p className="mt-2 text-[11px] text-muted">
              <time dateTime={m.createdAt}>
                {new Intl.DateTimeFormat('vi-VN', {
                  hour: '2-digit',
                  minute: '2-digit',
                  day: '2-digit',
                  month: '2-digit',
                  timeZone: 'Asia/Bangkok',
                }).format(new Date(m.createdAt))}
              </time>
              {m.editedAt ? ' · Đã chỉnh sửa' : ''}
            </p>
          </div>
          {!m.deletedAt && props.canSend && (
            <div className="flex shrink-0 items-center">
              <Button
                variant="ghost"
                className="size-11 rounded-full p-0 text-muted"
                aria-label="Trả lời"
                title="Trả lời"
                onClick={() => props.onReply(m)}
              >
                <Reply aria-hidden="true" className="size-4" />
              </Button>
              {props.own && (
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      ref={menuTrigger}
                      onClick={(event) => setReturnFocus(event.currentTarget)}
                      variant="ghost"
                      className="size-11 rounded-full p-0 text-muted"
                      aria-label="Tùy chọn tin nhắn"
                      title="Tùy chọn tin nhắn"
                    >
                      <MoreVertical aria-hidden="true" className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="min-w-36 rounded-xl border-line bg-canvas p-1 font-[family-name:var(--font-brand)]"
                    onCloseAutoFocus={(event) => {
                      event.preventDefault();
                      if (!mode) menuTrigger.current?.focus();
                    }}
                  >
                    {m.type === 'TEXT' && withinEditWindow && (
                      <DropdownMenuItem
                        className="min-h-11 cursor-pointer rounded-lg px-3"
                        onSelect={() => {
                          setBody(m.body ?? '');
                          setSnapshot(m.version);
                          setBlocked(false);
                          setError('');
                          setMode('edit');
                        }}
                      >
                        Sửa
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      className="min-h-11 cursor-pointer rounded-lg px-3 text-headsup focus:text-headsup"
                      onSelect={() => {
                        setSnapshot(m.version);
                        setBlocked(false);
                        setError('');
                        setMode('delete');
                      }}
                    >
                      Xóa
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          )}
        </div>
        {error && !mode && (
          <p role="alert" className="text-xs text-headsup">
            {error}
          </p>
        )}
      </div>
      {mode && (
        <Modal
          title={mode === 'edit' ? 'Sửa tin nhắn' : 'Xóa tin nhắn'}
          returnFocus={returnFocus}
          onClose={() => {
            if (!busy) setMode(null);
          }}
        >
          <div className="space-y-4 p-5">
            {mode === 'edit' ? (
              <Textarea
                aria-label="Nội dung chỉnh sửa"
                maxLength={4000}
                value={body}
                disabled={busy || blocked}
                onChange={(e) => setBody(e.target.value)}
              />
            ) : (
              <p>Tin nhắn sẽ được xóa với mọi người trong cuộc trò chuyện.</p>
            )}
            {error && (
              <p role="alert">
                {error} Đóng hộp thoại và kiểm tra lại tin nhắn trước khi thao tác tiếp.
              </p>
            )}
            <div className="flex gap-2">
              <Button variant="outline" disabled={busy} onClick={() => setMode(null)}>
                Hủy
              </Button>
              <Button
                disabled={
                  busy ||
                  blocked ||
                  snapshot !== m.version ||
                  (mode === 'edit' && !textSchema.safeParse(body).success)
                }
                onClick={() => void change()}
              >
                {busy ? 'Đang lưu…' : mode === 'delete' ? 'Xóa tin nhắn' : 'Lưu thay đổi'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </article>
  );
}
