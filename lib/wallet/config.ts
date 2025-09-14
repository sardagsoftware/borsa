'use client';

import { createConfig, http } from 'wagmi';
import { mainnet, bsc, polygon, avalanche } from 'wagmi/chains';
import { injected, walletConnect, coinbaseWallet } from 'wagmi/connectors';

// Enabled chains for the app
export const ENABLED_CHAINS = [mainnet, bsc, polygon, avalanche];
export const SUPPORTED_CHAINS = ENABLED_CHAINS; // Alias for compatibility

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

// Wagmi configuration
export const wagmiConfig = createConfig({
  chains: [mainnet, bsc, polygon, avalanche],
  connectors: [
    injected(),
    walletConnect({ 
      projectId: getWalletConnectProjectId(),
      metadata: {
        name: 'AILYDIAN',
        description: 'AI Lens Trader - Professional Crypto Trading Platform',
        url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001',
        icons: ['http://localhost:3001/logo.png']
      }
    }),
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

// Gas configurations for different networks
export const GAS_CONFIGS = {
  [mainnet.id]: {
    slow: '15000000000', // 15 gwei
    standard: '20000000000', // 20 gwei
    fast: '25000000000' // 25 gwei
  },
  [bsc.id]: {
    slow: '3000000000', // 3 gwei
    standard: '5000000000', // 5 gwei
    fast: '8000000000' // 8 gwei
  },
  [polygon.id]: {
    slow: '25000000000', // 25 gwei
    standard: '30000000000', // 30 gwei
    fast: '35000000000' // 35 gwei
  },
  [avalanche.id]: {
    slow: '20000000000', // 20 gwei
    standard: '25000000000', // 25 gwei
    fast: '30000000000' // 30 gwei
  }
};

// DEX router addresses for different networks
export const DEX_ROUTERS = {
  [mainnet.id]: {
    uniswap: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
    sushiswap: '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F'
  },
  [bsc.id]: {
    pancakeswap: '0x10ED43C718714eb63d5aA57B78B54704E256024E',
    biswap: '0x3a6d8cA21D1CF76F653A67577FA0D27453350dD8'
  },
  [polygon.id]: {
    quickswap: '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff',
    sushiswap: '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506'
  },
  [avalanche.id]: {
    traderjoe: '0x60aE616a2155Ee3d9A68541Ba4544862310933d4',
    pangolin: '0xE54Ca86531e17Ef3616d22Ca28b0D458b6C89106'
  }
};
