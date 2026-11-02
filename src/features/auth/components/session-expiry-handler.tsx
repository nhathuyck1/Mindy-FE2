'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useMutationState, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Brand } from '@/components/ui/brand';
import {
  sessionSignal,
  sessionWasLoggedOut,
  subscribeSessionExpiry,
} from '@/lib/api/session-coordinator';
import { logoutNavigationKey, sessionKey, useSession } from '../api/auth-queries';
import { sessionLoginTarget } from '../lib/session-login-target';

export function SessionExpiryHandler(props: { children: React.ReactNode }) {
  const client = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const session = useSession();
  const logoutStates = useMutationState({
    filters: { mutationKey: logoutNavigationKey, exact: true },
    select: (mutation) => mutation.state.status,
  });
  const logoutStatus = logoutStates.at(-1);
  const logoutFinished = logoutStatus === 'success' && sessionWasLoggedOut();
  // One owner for navigation: guards only hide private content. Competing
  // router.replace calls can force a document reload and lose the expiry toast.
  useEffect(() => {
    if (logoutStatus === 'pending') return;
    if (logoutFinished) {
      if (pathname !== '/') router.replace('/');
      return;
    }
    if (!session.isSuccess || session.data) return;
    const target = sessionLoginTarget(window.location.pathname + window.location.search);
    if (target) router.replace(sessionWasLoggedOut() ? '/' : target);
  }, [session.isSuccess, session.data, pathname, router, logoutStatus, logoutFinished]);
  useEffect(() => {
    if (pathname !== '/' || logoutStatus !== 'success') return;
    // Retire the completed navigation so a later audience-mismatch logout
    // stays on its login form, and a future logout starts with a clean state.
    for (const mutation of client.getMutationCache().findAll({
      mutationKey: logoutNavigationKey,
      exact: true,
      status: 'success',
    }))
      client.getMutationCache().remove(mutation);
  }, [client, pathname, logoutStatus]);
  useEffect(
    () =>
      subscribeSessionExpiry(() => {
        const hadSession = Boolean(client.getQueryData(sessionKey));
        const expiredSession = sessionSignal();
        // The session transport already aborts with a 401 and resolves to null.
        // Cancelling its query would make an explicit refetch return stale data.
        const privateQueries = {
          predicate: (query: { queryKey: readonly unknown[] }) =>
            query.queryKey[0] !== 'catalog' &&
            !(query.queryKey[0] === 'auth' && query.queryKey[1] === 'session'),
        };
        void client.cancelQueries(privateQueries).then(() => {
          if (sessionSignal() !== expiredSession) return;
          client.removeQueries(privateQueries);
          client.getMutationCache().clear();
          client.setQueryData(sessionKey, null);
          if (hadSession)
            toast.error('Phiên đăng nhập đã hết. Vui lòng đăng nhập lại.', {
              id: 'session-expired',
            });
        });
      }),
    [client],
  );
  if (logoutStatus === 'pending' || (logoutFinished && pathname !== '/'))
    return (
      <main
        className="grid min-h-dvh place-items-center bg-canvas px-6"
        role="status"
        aria-label="Đang đăng xuất…"
        aria-live="polite"
        aria-busy="true"
      >
        <div className="flex flex-col items-center gap-5">
          <Brand />
          <p className="text-base font-semibold text-muted">Đang đăng xuất…</p>
        </div>
      </main>
    );
  return props.children;
}
