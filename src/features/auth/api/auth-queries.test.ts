import { QueryClient, QueryObserver } from '@tanstack/react-query';
import { expect, it } from 'vitest';
import { replaceSession, sessionKey } from './auth-queries';

it('Updates every mounted session observer on logout and removes private cached data', async () => {
  const client = new QueryClient();
  client.setQueryData(sessionKey, { role: 'ADMIN' });
  client.setQueryData(['admin', 'users', { page: 1 }], { items: ['private record'] });
  const guard = new QueryObserver(client, { queryKey: sessionKey, enabled: false });
  const header = new QueryObserver(client, { queryKey: sessionKey, enabled: false });
  const unsubscribeGuard = guard.subscribe(() => undefined);
  const unsubscribeHeader = header.subscribe(() => undefined);
  try {
    await replaceSession(client, null);
    expect(guard.getCurrentResult().data).toBeNull();
    expect(header.getCurrentResult().data).toBeNull();
    expect(client.getQueriesData({ queryKey: ['admin'] })).toEqual([]);
  } finally {
    unsubscribeGuard();
    unsubscribeHeader();
    client.clear();
  }
});
