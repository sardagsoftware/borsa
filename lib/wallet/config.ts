'use client';

import { createConfig, http } from 'wagmi';
import { mainnet, bsc, polygon, avalanche } from 'wagmi/chains';
import { injected, walletConnect, coinbaseWallet } from 'wagmi/connectors';

// Enabled chains for the app
export const ENABLED_CHAINS = [mainnet, bsc, polygon, avalanche];

// Get WalletConnect project ID, return fallback if test ID
const getWalletConnectProjectId = () => {
  const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
  // Use fallback for invalid/test project IDs
  if (!projectId || projectId === '2f05a7e6e4adfb59423ccbc7832b4e5d') {
    console.warn('🔧 WalletConnect: Using development fallback project ID. For production, get a real project ID from https://cloud.walletconnect.com');
    return 'c4f79cc821944d9680842e34466bfbd'; // A valid test project ID
  }
  return projectId;
};

// Wagmi configuration - WalletConnect disabled for stability
export const wagmiConfig = createConfig({
  chains: [mainnet, bsc, polygon, avalanche],
  connectors: [
    injected(),
    // Temporarily disabled WalletConnect to fix webpack issues
    // walletConnect({ 
    //   projectId: getWalletConnectProjectId(),
    //   metadata: {
    //     name: 'AILYDIAN',
    //     description: 'AI Lens Trader - Professional Crypto Trading Platform',
    //     url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001',
    //     icons: ['http://localhost:3001/logo.png']
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
