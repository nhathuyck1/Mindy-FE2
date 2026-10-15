'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { Provider } from 'react-redux';
import { makeStore } from '@/lib/store/store';
import { Toaster } from '@/components/ui/sonner';

export function AppProviders(props: { children: React.ReactNode }) {
  const [store] = useState(makeStore);
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 60_000, retry: 1, refetchOnWindowFocus: false },
          mutations: { retry: false },
        },
      }),
  );

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        {props.children}
        <Toaster />
      </QueryClientProvider>
    </Provider>
  );
}
