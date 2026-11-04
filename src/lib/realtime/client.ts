import { io } from 'socket.io-client';
import { apiRequest } from '@/lib/api/client';
import { realtimeConnectionSchema, type RealtimeChannel } from './contracts';

/** Acquire a fresh ticket per attempt. Never cache credentials or send them in a URL. */
export async function createRealtimeSocket(channel: RealtimeChannel, signal: AbortSignal) {
  const connection = await apiRequest({
    path: 'auth/realtime-ticket',
    method: 'POST',
    body: { channel },
    schema: realtimeConnectionSchema,
    signal,
  });
  signal.throwIfAborted();
  const url = new URL(connection.url);
  if (
    !['https:', 'http:'].includes(url.protocol) ||
    url.pathname !== '/' ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    (window.location.protocol === 'https:' && url.protocol !== 'https:')
  )
    throw new Error('Invalid realtime origin');
  if (Date.parse(connection.expiresAt) <= Date.now()) throw new Error('Realtime ticket expired');
  return io(url.origin + (channel === 'chat' ? '/chat' : ''), {
    path: channel === 'chat' ? '/socket.io' : '/ws/whiteboards',
    addTrailingSlash: false,
    transports: ['websocket'],
    withCredentials: false,
    forceNew: true,
    autoConnect: false,
    reconnection: false,
    auth: { ticket: connection.ticket },
  });
}
