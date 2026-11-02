'use client';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { MessageCircle, Search } from 'lucide-react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { NameAvatar } from '@/components/ui/name-avatar';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useSession } from '@/features/auth/api/auth-queries';
import { useChatPages, useChatQuery } from '../api/chat-queries';
import { conversationSchema } from '../schemas/chat-contracts';
import { conversationName } from '../lib/chat-display';
import { ChatState } from './chat-state';
import { ChatRoom } from './chat-room';

export function ChatPage() {
  const search = useSearchParams(),
    pathname = usePathname();
  const session = useSession();
  const [filter, setFilter] = useState('');
  const list = useChatPages('chat/conversations', conversationSchema, true);
  const classId = search.get('classId'),
    selectedId = search.get('conversation');
  const validClass = z.uuidv4().safeParse(classId).success;
  const classChat = useChatQuery(`classes/${classId}/chat`, conversationSchema, validClass);
  const selected = selectedId ?? classChat.data?.id;
  const validSelected = z.uuidv4().safeParse(selected).success;
  const invalid = (!!selectedId && !validSelected) || (!!classId && !validClass);
  const conversations =
    list.data?.pages
      .flatMap((p) => p.data)
      .filter((c) =>
        conversationName(c).toLocaleLowerCase('vi').includes(filter.toLocaleLowerCase('vi')),
      ) ?? [];
  return (
    <div className="min-w-0 font-[family-name:var(--font-brand)]">
      <h1 className="text-2xl font-extrabold">Tin nhắn</h1>
      <p className="mt-2 mb-6 text-sm text-muted">Trao đổi cùng lớp học và Mentor của bạn.</p>
      <div className="grid min-h-[36rem] min-w-0 overflow-hidden rounded-2xl border border-line bg-canvas lg:grid-cols-[19rem_minmax(0,1fr)]">
        <aside
          className={cn('min-w-0 border-line lg:border-r', validSelected && 'hidden lg:block')}
          aria-label="Cuộc trò chuyện"
        >
          <div className="flex items-center gap-2 border-b border-line p-4">
            <Search className="size-4 text-muted" aria-hidden="true" />
            <Input
              aria-label="Tìm cuộc trò chuyện đã tải"
              placeholder="Tìm cuộc trò chuyện"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
          <div className="max-h-[65dvh] overflow-y-auto">
            {list.isPending ? (
              <ChatState pending />
            ) : list.isError ? (
              <ChatState error={list.error} retry={list.refetch} />
            ) : (
              <>
                {!conversations.length && (
                  <ChatState
                    empty={
                      filter
                        ? 'Không tìm thấy trong danh sách đã tải.'
                        : 'Chưa có cuộc trò chuyện. Nhóm lớp sẽ xuất hiện khi bạn được cấp quyền.'
                    }
                  />
                )}
                {conversations.map((c) => (
                  <Link
                    key={c.id}
                    href={`${pathname}?conversation=${c.id}`}
                    aria-current={selected === c.id ? 'page' : undefined}
                    className={cn(
                      'flex min-h-24 items-center gap-3 border-b border-line p-4 hover:bg-soft focus-visible:outline-2 focus-visible:outline-mint',
                      selected === c.id && 'bg-mint/10',
                    )}
                  >
                    <NameAvatar name={conversationName(c)} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-extrabold">{conversationName(c)}</span>
                      <span className="mt-1 block truncate text-xs text-muted">
                        {c.type === 'GROUP' ? 'Nhóm lớp' : 'Tin nhắn riêng'} ·{' '}
                        {c.lastMessage?.deletedAt
                          ? 'Tin nhắn đã xóa'
                          : c.lastMessage?.body ||
                            c.lastMessage?.file?.originalFilename ||
                            'Chưa có tin nhắn'}
                      </span>
                    </span>
                    {c.unreadCount > 0 && (
                      <span
                        className="rounded-full bg-mint px-2 py-1 text-xs font-bold text-white"
                        aria-label={`${c.unreadCount} tin chưa đọc`}
                      >
                        {c.unreadCount > 99 ? '99+' : c.unreadCount}
                      </span>
                    )}
                  </Link>
                ))}
                {list.hasNextPage && (
                  <Button
                    variant="ghost"
                    className="m-3"
                    disabled={list.isFetchingNextPage}
                    onClick={() => void list.fetchNextPage()}
                  >
                    Xem thêm cuộc trò chuyện
                  </Button>
                )}
              </>
            )}
          </div>
        </aside>
        <section className="min-w-0" aria-label="Nội dung trò chuyện">
          {invalid ? (
            <ChatState empty="Liên kết cuộc trò chuyện không hợp lệ." />
          ) : validSelected && selected && session.data ? (
            <ChatRoom
              key={`${session.data.id}/${selected}`}
              id={selected}
              user={session.data}
              basePath={pathname}
            />
          ) : validClass ? (
            <ChatState
              pending={classChat.isPending}
              error={classChat.error}
              retry={classChat.refetch}
            />
          ) : (
            <div className="hidden h-full min-h-96 flex-col items-center justify-center gap-3 p-8 text-center text-muted lg:flex">
              <MessageCircle className="size-12 text-mint" aria-hidden="true" />
              <p>Chọn một cuộc trò chuyện để bắt đầu.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
