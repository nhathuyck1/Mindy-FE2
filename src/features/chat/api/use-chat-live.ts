'use client';
import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io } from 'socket.io-client';
import { sessionSignal } from '@/lib/api/session-coordinator';
import { apiRequest } from '@/lib/api/client';
import { conversationSchema } from '../schemas/chat-contracts';

// Socket events are invalidation hints. HTTP snapshots remain the authority,
// including reconnects, edits and tombstones; polling also covers proxy outages.
export function useChatLive(id: string, userId: string) {
  const client = useQueryClient();
  const [revoked, setRevoked] = useState(false);
  useEffect(() => {
    const signal = sessionSignal();
    const socket = io('/chat', {
      path: '/socket.io',
      transports: ['websocket'],
      withCredentials: true,
      reconnectionAttempts: 3,
    });
    let stopped = false;
    const refresh = () => {
      void client.invalidateQueries({ queryKey: ['chat', userId] });
    };
    socket.on('connect', () => {
      socket.timeout(8000).emit('conversation:join', { conversationId: id }, () => refresh());
    });
    for (const event of [
      'message:created',
      'message:updated',
      'message:deleted',
      'conversation:read',
    ])
      socket.on(event, refresh);
    socket.on('conversation:access-changed', () => {
      setRevoked(true);
      client.removeQueries({
        predicate: (q) =>
          q.queryKey[0] === 'chat' &&
          typeof q.queryKey[2] === 'string' &&
          q.queryKey[2].includes(id),
      });
      refresh();
      socket.disconnect();
    });
    socket.on('connect_error', () => {
      if (stopped) return;
      void apiRequest({ path: `chat/conversations/${id}`, schema: conversationSchema, signal })
        .then(() => {
          if (!stopped) refresh();
        })
        .catch(() => {
          socket.disconnect();
          refresh();
        });
    });
    const stop = () => {
      stopped = true;
      socket.disconnect();
    };
    signal.addEventListener('abort', stop, { once: true });
    return () => {
      stop();
      signal.removeEventListener('abort', stop);
    };
  }, [client, id, userId]);
  return revoked;
}
