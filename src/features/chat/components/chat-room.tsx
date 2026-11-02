'use client';
import Link from 'next/link';
import { useState } from 'react';
import { ArrowLeft, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NameAvatar } from '@/components/ui/name-avatar';
import type { User } from '@/lib/api/contracts';
import { useChatQuery } from '../api/chat-queries';
import { useChatLive } from '../api/use-chat-live';
import { conversationSchema, type ChatMessage } from '../schemas/chat-contracts';
import { conversationName } from '../lib/chat-display';
import { ChatState } from './chat-state';
import { ChatMembers } from './chat-members';
import { ChatTimeline } from './chat-timeline';
import { ChatComposer } from './chat-composer';

export function ChatRoom(props: {
  id: string;
  user: User;
  basePath: string;
  compact?: boolean;
  onSelectConversation?: (id: string) => void;
}) {
  const query = useChatQuery(`chat/conversations/${props.id}`, conversationSchema, true, true);
  const [members, setMembers] = useState(false),
    [reply, setReply] = useState<ChatMessage | null>(null);
  const revoked = useChatLive(props.id, props.user.id);
  if (revoked)
    return (
      <ChatState empty="Quyền truy cập cuộc trò chuyện đã thay đổi. Vui lòng chọn lại từ danh sách." />
    );
  if (query.isPending) return <ChatState pending />;
  if (query.isError) return <ChatState error={query.error} retry={query.refetch} />;
  const c = query.data;
  return (
    <div
      className={
        props.compact ? 'flex h-full min-h-0 flex-col' : 'flex h-[75dvh] min-h-[32rem] flex-col'
      }
    >
      <header className="flex shrink-0 items-center gap-3 border-b border-line p-4">
        {!props.compact && (
          <Button asChild variant="ghost" className="lg:hidden" aria-label="Về danh sách tin nhắn">
            <Link href={props.basePath}>
              <ArrowLeft aria-hidden="true" />
            </Link>
          </Button>
        )}
        <NameAvatar name={conversationName(c)} />
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-extrabold">{conversationName(c)}</h2>
          <p className="text-xs text-muted">
            {c.accessMode === 'HISTORY_READ_ONLY'
              ? 'Lịch sử · Chỉ đọc'
              : c.accessMode === 'CASH_PENDING'
                ? 'Đang chờ xác nhận tiền mặt'
                : c.type === 'GROUP'
                  ? 'Nhóm lớp học'
                  : 'Tin nhắn riêng'}
          </p>
        </div>
        <Button variant="ghost" aria-label="Thành viên" onClick={() => setMembers(true)}>
          <Users aria-hidden="true" />
        </Button>
      </header>
      <ChatTimeline
        id={props.id}
        userId={props.user.id}
        canSend={c.capabilities.canSend}
        lastRead={c.lastReadSequence}
        onReply={setReply}
      />
      {c.capabilities.canSend ? (
        <ChatComposer
          key={props.id}
          conversation={c}
          reply={reply}
          onClearReply={() => setReply(null)}
        />
      ) : (
        <p className="border-t border-line p-4 text-sm text-muted">
          Cuộc trò chuyện này chỉ cho phép đọc lịch sử.
        </p>
      )}
      {members && (
        <ChatMembers
          id={props.id}
          user={props.user}
          basePath={props.basePath}
          onClose={() => setMembers(false)}
          onSelectConversation={props.onSelectConversation}
        />
      )}
    </div>
  );
}
