'use client';

import { createConfig, http } from 'wagmi';
import { mainnet, bsc, polygon, avalanche } from 'wagmi/chains';
import { injected, walletConnect, coinbaseWallet } from 'wagmi/connectors';

// Enabled chains for the app
export const ENABLED_CHAINS = [mainnet, bsc, polygon, avalanche];

// Wagmi configuration - WalletConnect disabled for stability
export const wagmiConfig = createConfig({
  chains: [mainnet, bsc, polygon, avalanche],
  connectors: [
    injected(),
    // Temporarily disabled WalletConnect to fix webpack issues
    // walletConnect({ 
    //   projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '1234567890abcdef',
    //   metadata: {
    //     name: 'AILYDIAN',
    //     description: 'AI Lens Trader - Professional Crypto Trading Platform',
    //     url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    //     icons: ['http://localhost:3000/logo.png']
    //   }
    // }),
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
