'use client';
import { useId, useState } from 'react';
import { ArrowLeft, ArrowUpRight, MessageCircle, Minus, Search } from 'lucide-react';
import Link from 'next/link';
import { useSession } from '@/features/auth/api/auth-queries';
import type { User } from '@/lib/api/contracts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NameAvatar } from '@/components/ui/name-avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useChatInbox } from '../api/use-chat-inbox';
import { conversationName } from '../lib/chat-display';
import { ChatRoom } from './chat-room';
import { ChatState } from './chat-state';

export function FloatingChat() {
  const session = useSession();
  const user = session.data;
  if (
    session.isError ||
    !user ||
    user.status !== 'ACTIVE' ||
    !['STUDENT', 'MENTOR'].includes(user.role)
  )
    return null;
  return <ChatLauncher key={user.id} user={user} />;
}

function ChatLauncher(props: { user: User }) {
  const inbox = useChatInbox(props.user.id);
  const [open, setOpen] = useState(false),
    [selected, setSelected] = useState<string | null>(null),
    [search, setSearch] = useState('');
  const titleId = useId();
  const basePath = props.user.role === 'MENTOR' ? '/mentor/messages' : '/user/messages';
  const unread = inbox.isError
    ? null
    : inbox.data?.reduce((sum, conversation) => sum + conversation.unreadCount, 0);
  const conversations =
    inbox.data?.filter((conversation) =>
      conversationName(conversation)
        .toLocaleLowerCase('vi')
        .includes(search.toLocaleLowerCase('vi')),
    ) ?? [];
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          className="fixed right-4 bottom-[max(5.5rem,env(safe-area-inset-bottom))] z-40 size-14 rounded-full bg-mint p-0 text-white shadow-lg shadow-forest/25 hover:bg-forest sm:right-6 sm:bottom-6"
          aria-label={open ? 'Thu gọn chat' : 'Mở chat'}
        >
          <MessageCircle aria-hidden="true" className="size-7" />
          {!!unread && (
            <span
              role="status"
              aria-label={`${unread} tin nhắn chưa đọc`}
              className="absolute -top-1 -right-1 flex min-h-6 min-w-6 items-center justify-center rounded-full border-2 border-canvas bg-headsup px-1 text-[11px] font-extrabold text-white"
            >
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="end"
        sideOffset={12}
        collisionPadding={12}
        aria-labelledby={titleId}
        onInteractOutside={(event) => event.preventDefault()}
        className="flex h-[min(38rem,var(--radix-popover-content-available-height))] max-h-[calc(100dvh-7rem)] w-[calc(100vw-1.5rem)] max-w-[26rem] flex-col gap-0 overflow-hidden rounded-2xl border-line bg-canvas p-0 font-[family-name:var(--font-brand)] text-foreground shadow-2xl shadow-forest/20"
      >
        <div className="flex shrink-0 items-center gap-2 border-b border-line bg-mint/5 px-3 py-2">
          {selected && (
            <Button
              variant="ghost"
              aria-label="Về danh sách chat"
              onClick={() => setSelected(null)}
            >
              <ArrowLeft aria-hidden="true" />
            </Button>
          )}
          <h2 id={titleId} className="min-w-0 flex-1 text-base font-extrabold">
            Tin nhắn
          </h2>
          <Button asChild variant="ghost" aria-label="Mở trang tin nhắn">
            <Link
              href={`${basePath}${selected ? '?conversation=' + selected : ''}`}
              onClick={() => setOpen(false)}
            >
              <ArrowUpRight aria-hidden="true" />
            </Link>
          </Button>
          <Button variant="ghost" aria-label="Thu gọn khung chat" onClick={() => setOpen(false)}>
            <Minus aria-hidden="true" />
          </Button>
        </div>
        <div className="min-h-0 flex-1">
          {selected ? (
            <ChatRoom
              key={selected}
              id={selected}
              user={props.user}
              basePath={basePath}
              compact
              onSelectConversation={setSelected}
            />
          ) : (
            <div className="flex h-full flex-col">
              <div className="flex shrink-0 items-center gap-2 border-b border-line p-3">
                <Search aria-hidden="true" className="size-4 text-muted" />
                <Input
                  aria-label="Tìm chat"
                  placeholder="Tìm người hoặc lớp học"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                {inbox.isPending ? (
                  <ChatState pending />
                ) : inbox.isError ? (
                  <ChatState error={inbox.error} retry={inbox.refetch} />
                ) : (
                  <>
                    {!conversations.length && (
                      <ChatState
                        empty={
                          search ? 'Không tìm thấy cuộc trò chuyện.' : 'Chưa có cuộc trò chuyện.'
                        }
                      />
                    )}
                    {conversations.map((conversation) => (
                      <button
                        type="button"
                        key={conversation.id}
                        onClick={() => setSelected(conversation.id)}
                        className="flex min-h-20 w-full cursor-pointer items-center gap-3 border-b border-line p-3 text-left hover:bg-soft focus-visible:outline-2 focus-visible:outline-mint"
                      >
                        <NameAvatar name={conversationName(conversation)} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-extrabold">
                            {conversationName(conversation)}
                          </span>
                          <span className="mt-1 block truncate text-xs text-muted">
                            {conversation.lastMessage?.deletedAt
                              ? 'Tin nhắn đã xóa'
                              : conversation.lastMessage?.body ||
                                conversation.lastMessage?.file?.originalFilename ||
                                'Bắt đầu trò chuyện'}
                          </span>
                        </span>
                        {conversation.unreadCount > 0 && (
                          <span className="rounded-full bg-mint px-2 py-1 text-xs font-bold text-white">
                            {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                          </span>
                        )}
                      </button>
                    ))}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
