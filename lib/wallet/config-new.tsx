'use client';

import { WagmiProvider, createConfig, http } from 'wagmi';
import { mainnet, bsc, polygon, avalanche } from 'wagmi/chains';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { injected, walletConnect, coinbaseWallet } from 'wagmi/connectors';

// Enabled chains for the app
export const ENABLED_CHAINS = [mainnet, bsc, polygon, avalanche];

// Wagmi configuration
export const wagmiConfig = createConfig({
  chains: [mainnet, bsc, polygon, avalanche],
  connectors: [
    injected(),
    walletConnect({ projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '1234567890abcdef' }),
    coinbaseWallet({ 
      appName: process.env.NEXT_PUBLIC_APP_NAME || 'AILYDIAN',
      preference: 'smartWalletOnly' 
    }),
  ],
  transports: {
    [mainnet.id]: http(),
    [bsc.id]: http(),
    [polygon.id]: http(),
    [avalanche.id]: http(),
  },
  ssr: true
});

// React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

// Web3 Providers wrapper component
function Web3Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}

// Named export
export { Web3Providers };

// Default export 
export default Web3Providers;
