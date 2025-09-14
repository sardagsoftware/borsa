'use client';

import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from 'next-auth/react';
import { wagmiConfig } from '../lib/wallet/config';
import { Toaster } from 'react-hot-toast';

// QueryClient'ı component dışında oluştur (singleton pattern)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 dakika
      refetchOnWindowFocus: false,
    },
  },
});

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'var(--binance-panel, #2B2B2B)',
                color: 'var(--binance-text, #FAFAFA)',
                border: '1px solid var(--border, #404040)',
              },
              success: {
                iconTheme: {
                  primary: '#0ECB81',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#F6465D',
                  secondary: '#fff',
                },
              },
            }}
          />
          {children}
        </QueryClientProvider>
      </WagmiProvider>
    </SessionProvider>
  );
}
