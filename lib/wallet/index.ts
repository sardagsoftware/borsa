export { default as WalletButton } from './components/WalletButton';
export { default as WalletModal } from './components/WalletModal';
export { default as NetworkSwitcher } from './components/NetworkSwitcher';
export { WalletProvider, useWallet, signInWithEthereum, executeMultiChainTransaction } from './context';
export { wagmiConfig as config, ENABLED_CHAINS as SUPPORTED_CHAINS } from './config';
import { ENABLED_CHAINS as SUPPORTED_CHAINS } from './config';

// Temporary mock objects until we implement them
const GAS_CONFIGS = {
  1: { // Ethereum
    gasLimit: 21000,
    maxFeePerGas: '20000000000', // 20 gwei
    maxPriorityFeePerGas: '2000000000', // 2 gwei
  },
  56: { // BSC
    gasLimit: 21000,
    gasPrice: '5000000000', // 5 gwei
  },
  137: { // Polygon
    gasLimit: 21000,
    maxFeePerGas: '30000000000', // 30 gwei
    maxPriorityFeePerGas: '1000000000', // 1 gwei
  },
  43114: { // Avalanche
    gasLimit: 21000,
    gasPrice: '25000000000', // 25 gwei
  }
};

const DEX_ROUTERS = {
  1: { // Ethereum
    uniswapV2: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
    uniswapV3: '0xE592427A0AEce92De3Edee1F18E0157C05861564'
  },
  56: { // BSC
    pancakeswapV2: '0x10ED43C718714eb63d5aA57B78B54704E256024E',
    pancakeswapV3: '0x1b81D678ffb9C0263b24A97847620C99d213eB14'
  },
  137: { // Polygon
    quickswap: '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff',
    uniswapV3: '0xE592427A0AEce92De3Edee1F18E0157C05861564'
  },
  43114: { // Avalanche
    traderjoe: '0x60aE616a2155Ee3d9A68541Ba4544862310933d4'
  }
};

// Wallet utilities
export const formatAddress = (address: string, chars: number = 4): string => {
  if (!address) return '';
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
};

export const formatBalance = (balance: string | number, decimals: number = 4): string => {
  const num = typeof balance === 'string' ? parseFloat(balance) : balance;
  if (isNaN(num)) return '0';
  
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
  if (num >= 1) return num.toFixed(2);
  
  return num.toFixed(decimals);
};

export const isValidAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

export const getExplorerUrl = (chainId: number, hash: string, type: 'tx' | 'address' = 'tx'): string => {
  const chain = Object.values(SUPPORTED_CHAINS).find((c: any) => c.id === chainId);
  if (!chain) return '';
  
  const path = type === 'tx' ? 'tx' : 'address';
  return `${chain.blockExplorers?.default?.url}/${path}/${hash}`;
};

// Price formatting for different locales
export const formatPrice = (price: number, currency: string = 'USD', locale: string = 'en-US'): string => {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 8,
    }).format(price);
  } catch {
    return `${price.toFixed(2)} ${currency}`;
  }
};

// Token logo URL helper
export const getTokenLogoUrl = (chainId: number, address: string): string => {
  // Use TrustWallet assets as fallback
  const chainName = {
    1: 'ethereum',
    56: 'smartchain',
    137: 'polygon',
    42161: 'arbitrum',
    10: 'optimism',
  }[chainId] || 'ethereum';
  
  return `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/${chainName}/assets/${address}/logo.png`;
};

// Gas estimation helper
export const estimateGasCost = (chainId: number, gasUsed: number, gasPrice: 'slow' | 'standard' | 'fast' = 'standard'): string => {
  const gasConfig = GAS_CONFIGS[chainId as keyof typeof GAS_CONFIGS];
  if (!gasConfig) return '0';
  
  const priceInGwei = gasConfig[gasPrice];
  const costInEth = (gasUsed * priceInGwei) / 1e9;
  
  return costInEth.toFixed(6);
};

// DEX helper functions
export const getBestDexRouter = (chainId: number): string | null => {
  const routers = DEX_ROUTERS[chainId as keyof typeof DEX_ROUTERS];
  if (!routers) return null;
  
  // Return the first (usually most popular) DEX router
  return Object.values(routers)[0] as string;
};

export const getAllDexRouters = (chainId: number): Array<{ name: string; address: string }> => {
  const routers = DEX_ROUTERS[chainId as keyof typeof DEX_ROUTERS];
  if (!routers) return [];
  
  return Object.entries(routers).map(([name, address]) => ({
    name: name.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
    address: address as string,
  }));
};
