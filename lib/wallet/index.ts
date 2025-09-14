export { default as WalletButton } from './components/WalletButton';
export { default as WalletModal } from './components/WalletModal';
export { default as NetworkSwitcher } from './components/NetworkSwitcher';
export { WalletProvider, useWallet, signInWithEthereum, executeMultiChainTransaction } from './context';
export { config, SUPPORTED_CHAINS, TRADING_PAIRS, GAS_CONFIGS, DEX_ROUTERS } from './config';
import { SUPPORTED_CHAINS, GAS_CONFIGS, DEX_ROUTERS } from './config';

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
  return `${chain.explorer}/${path}/${hash}`;
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
