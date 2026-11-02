'use client';
import { useQuery } from '@tanstack/react-query';
import type { z } from 'zod';
import { apiRequest } from '@/lib/api/client';
import { conversationPageSchema, type Conversation } from '../schemas/chat-contracts';

export function useChatInbox(userId: string) {
  return useQuery<Conversation[]>({
    queryKey: ['chat', userId, 'inbox'],
    retry: false,
    refetchInterval: (query) => (query.state.error ? false : 4000),
    queryFn: async ({ signal }): Promise<Conversation[]> => {
      const conversations = new Map<string, Conversation>();
      const cursors = new Set<string>();
      let cursor: string | null = null;
      do {
        const page: z.infer<typeof conversationPageSchema> = await apiRequest({
          path: `chat/conversations?limit=100${cursor ? '&cursor=' + encodeURIComponent(cursor) : ''}`,
          schema: conversationPageSchema,
          signal,
        });
        for (const conversation of page.data) conversations.set(conversation.id, conversation);
        cursor = page.meta.hasMore ? page.meta.nextCursor : null;
        if (page.meta.hasMore && (!cursor || cursors.has(cursor)))
          throw new Error('Invalid chat cursor');
        if (cursor) cursors.add(cursor);
      } while (cursor);
      return [...conversations.values()];
    },
  });
}
