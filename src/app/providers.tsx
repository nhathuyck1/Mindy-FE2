'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { Provider } from 'react-redux';
import { makeStore } from '@/lib/store/store';
import { Toaster } from '@/components/ui/sonner';
import { ApiError } from '@/lib/api/client';
import { SessionExpiryHandler } from '@/features/auth/components/session-expiry-handler';

export function AppProviders(props: { children: React.ReactNode }) {
  const [store] = useState(makeStore);
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            retry: (count, error) =>
              !(error instanceof ApiError && [401, 403].includes(error.status)) && count < 1,
            refetchOnWindowFocus: false,
          },
          mutations: { retry: false },
        },
      }),
  );

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <SessionExpiryHandler>{props.children}</SessionExpiryHandler>
        <Toaster />
      </QueryClientProvider>
    </Provider>
  );
}
