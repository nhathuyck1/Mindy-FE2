'use client';
import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Socket } from 'socket.io-client';
import { sessionSignal } from '@/lib/api/session-coordinator';
import { ApiError } from '@/lib/api/client';
import { createRealtimeSocket } from '@/lib/realtime/client';

// Events invalidate HTTP snapshots; each reconnect gets a fresh, scoped handshake ticket.
export function useChatLive(id: string, userId: string) {
  const client = useQueryClient();
  const [revoked, setRevoked] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    const session = sessionSignal();
    const signal = AbortSignal.any([session, controller.signal]);
    let socket: Socket | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let retries = 0;
    let stopped = false;
    const refresh = () => {
      void client.invalidateQueries({ queryKey: ['chat', userId] });
    };
    const retry = () => {
      if (stopped || signal.aborted || timer || retries >= 3) return;
      timer = setTimeout(() => {
        timer = undefined;
        void connect();
      }, [1000, 2000, 5000][retries++]);
    };
    const connect = async () => {
      if (stopped || signal.aborted) return;
      socket?.removeAllListeners();
      socket?.disconnect();
      try {
        const next = await createRealtimeSocket('chat', signal);
        if (stopped || signal.aborted) {
          next.disconnect();
          return;
        }
        socket = next;
        next.on('connect', () => {
          retries = 0;
          next.timeout(8000).emit('conversation:join', { conversationId: id }, () => refresh());
        });
        for (const event of [
          'message:created',
          'message:updated',
          'message:deleted',
          'conversation:read',
        ])
          next.on(event, refresh);
        next.on('conversation:access-changed', () => {
          setRevoked(true);
          client.removeQueries({
            predicate: (q) =>
              q.queryKey[0] === 'chat' &&
              typeof q.queryKey[2] === 'string' &&
              q.queryKey[2].includes(id),
          });
          refresh();
          stop();
        });
        next.on('disconnect', retry);
        next.on('connect_error', retry);
        next.connect();
      } catch (error) {
        if (stopped || signal.aborted) return;
        if (error instanceof ApiError && [401, 403].includes(error.status)) {
          refresh();
          stop();
        } else retry();
      }
    };
    const stop = () => {
      stopped = true;
      clearTimeout(timer);
      controller.abort();
      socket?.removeAllListeners();
      socket?.disconnect();
    };
    session.addEventListener('abort', stop, { once: true });
    void connect();
    return () => {
      stop();
      session.removeEventListener('abort', stop);
    };
  }, [client, id, userId]);
  return revoked;
}
