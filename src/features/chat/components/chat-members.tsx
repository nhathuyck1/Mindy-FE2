'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { NameAvatar } from '@/components/ui/name-avatar';
import type { User } from '@/lib/api/contracts';
import { apiRequest } from '@/lib/api/client';
import { chatError, useChatPages, useRefreshChat } from '../api/chat-queries';
import { memberSchema, directSchema } from '../schemas/chat-contracts';
import { ChatState } from './chat-state';
export function ChatMembers(props: {
  id: string;
  user: User;
  basePath: string;
  onClose: () => void;
  onSelectConversation?: (id: string) => void;
}) {
  const query = useChatPages(`chat/conversations/${props.id}/members`, memberSchema);
  const router = useRouter(),
    refresh = useRefreshChat();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  async function open(peerUserId: string) {
    setBusy(true);
    setError('');
    try {
      const result = await apiRequest({
        path: 'chat/conversations/direct',
        method: 'POST',
        body: { peerUserId },
        schema: directSchema,
      });
      void refresh();
      if (props.onSelectConversation) props.onSelectConversation(result.conversation.id);
      else router.push(`${props.basePath}?conversation=${result.conversation.id}`);
      props.onClose();
    } catch (e) {
      setError(chatError(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title="Thành viên cuộc trò chuyện" onClose={props.onClose}>
      {query.isPending ? (
        <ChatState pending />
      ) : query.isError ? (
        <ChatState error={query.error} retry={query.refetch} />
      ) : (
        <div className="space-y-3 p-5">
          {query.data.pages
            .flatMap((p) => p.data)
            .map((m) => (
              <div key={m.userId} className="flex flex-wrap items-center gap-3">
                <NameAvatar name={m.displayName} />
                <div className="min-w-0 flex-1">
                  <p className="break-words font-bold">
                    {m.displayName}
                    {m.userId === props.user.id ? ' (Bạn)' : ''}
                  </p>
                  <p className="text-xs text-muted">{m.role === 'ADMIN' ? 'Mentor' : 'Học viên'}</p>
                </div>
                {m.userId !== props.user.id &&
                  (props.user.role === 'MENTOR' ? m.role === 'MEMBER' : m.role === 'ADMIN') && (
                    <Button variant="outline" disabled={busy} onClick={() => void open(m.userId)}>
                      Nhắn riêng
                    </Button>
                  )}
              </div>
            ))}
          {query.hasNextPage && (
            <Button
              variant="ghost"
              disabled={query.isFetchingNextPage}
              onClick={() => void query.fetchNextPage()}
            >
              Xem thêm thành viên
            </Button>
          )}
          {error && (
            <p role="alert" className="text-sm text-headsup">
              {error}
            </p>
          )}
        </div>
      )}
    </Modal>
  );
}
