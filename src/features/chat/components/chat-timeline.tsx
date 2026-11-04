'use client';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/api/client';
import { useChatPages, useRefreshChat } from '../api/chat-queries';
import { messageSchema, readSchema, type ChatMessage } from '../schemas/chat-contracts';
import { ChatState } from './chat-state';
import { ChatMessageItem } from './chat-message-item';
export function ChatTimeline(props: {
  id: string;
  userId: string;
  canSend: boolean;
  lastRead: string;
  onReply: (m: ChatMessage) => void;
}) {
  const query = useChatPages(`chat/conversations/${props.id}/messages`, messageSchema, true);
  const refresh = useRefreshChat();
  const area = useRef<HTMLDivElement>(null),
    bottom = useRef<HTMLDivElement>(null),
    seen = useRef(props.lastRead),
    initial = useRef(true);
  const [atBottom, setAtBottom] = useState(true),
    [readError, setReadError] = useState(false);
  const map = new Map<string, ChatMessage>();
  for (const page of query.data?.pages ?? [])
    for (const message of page.data) {
      const prior = map.get(message.id);
      if (!prior || message.version > prior.version) map.set(message.id, message);
    }
  const messages = [...map.values()].sort((a, b) =>
    BigInt(a.sequence) < BigInt(b.sequence) ? -1 : 1,
  );
  const latest = messages.at(-1)?.sequence;
  const ready = !!query.data && !query.isError;
  useEffect(() => {
    if (!ready) return;
    if (initial.current || atBottom) {
      bottom.current?.scrollIntoView({ block: 'nearest' });
      initial.current = false;
    }
  }, [latest, ready, atBottom]);
  useEffect(() => {
    if (!ready || !atBottom || !latest) return;
    const controller = new AbortController();
    let sending = false;
    const mark = () => {
      if (
        sending ||
        document.visibilityState !== 'visible' ||
        !document.hasFocus() ||
        BigInt(latest) <= BigInt(seen.current)
      )
        return;
      sending = true;
      void apiRequest({
        path: `chat/conversations/${props.id}/read`,
        method: 'PUT',
        body: { throughSequence: latest },
        schema: readSchema,
        signal: controller.signal,
      })
        .then((r) => {
          seen.current = r.lastReadSequence;
          setReadError(false);
          void refresh();
        })
        .catch(() => {
          if (!controller.signal.aborted) setReadError(true);
        })
        .finally(() => {
          sending = false;
        });
    };
    mark();
    window.addEventListener('focus', mark);
    document.addEventListener('visibilitychange', mark);
    return () => {
      controller.abort();
      window.removeEventListener('focus', mark);
      document.removeEventListener('visibilitychange', mark);
    };
  }, [latest, atBottom, ready, props.id, refresh]);
  if (query.isPending)
    return (
      <div className="flex-1">
        <ChatState pending />
      </div>
    );
  if (query.isError)
    return (
      <div className="flex-1">
        <ChatState error={query.error} retry={query.refetch} />
      </div>
    );
  return (
    <>
      <div
        ref={area}
        className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain bg-soft/40 p-4"
        aria-label="Lịch sử tin nhắn"
        onScroll={(e) => {
          const el = e.currentTarget;
          setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 48);
        }}
      >
        {query.hasNextPage && (
          <Button
            variant="outline"
            disabled={query.isFetchingNextPage}
            onClick={() => void query.fetchNextPage()}
          >
            Tin nhắn trước đó
          </Button>
        )}
        {!messages.length && <ChatState empty="Chưa có tin nhắn. Hãy bắt đầu cuộc trò chuyện." />}
        {messages.map((m) => (
          <ChatMessageItem
            key={m.id}
            message={m}
            own={m.sender.id === props.userId}
            canSend={props.canSend}
            onReply={props.onReply}
          />
        ))}
        <div ref={bottom} />
      </div>
      {!atBottom && (
        <Button
          variant="ghost"
          onClick={() => {
            bottom.current?.scrollIntoView({ block: 'nearest' });
            setAtBottom(true);
          }}
        >
          Đến tin nhắn mới nhất
        </Button>
      )}
      {readError && (
        <p role="status" className="px-4 text-xs text-muted">
          Chưa cập nhật được trạng thái đã đọc.
        </p>
      )}
    </>
  );
}
