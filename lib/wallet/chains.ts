export const CHAINS = {
  1: { 
    id: 1,  
    name: "Ethereum",  
    rpc: "https://rpc.ankr.com/eth",    
    symbol: "ETH",  
    explorer: "https://etherscan.io",
    nativeCurrency: { name: "Ethereum", symbol: "ETH", decimals: 18 }
  },
  56: { 
    id: 56,  
    name: "BSC",       
    rpc: "https://bsc-dataseed.binance.org", 
    symbol: "BNB", 
    explorer: "https://bscscan.com",
    nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 }
  },
  137: {
    id: 137, 
    name: "Polygon",   
    rpc: "https://polygon-rpc.com",     
    symbol: "MATIC",
    explorer: "https://polygonscan.com",
    nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 }
  },
  43114: {
    id: 43114,
    name: "Avalanche",
    rpc: "https://api.avax.network/ext/bc/C/rpc",
    symbol: "AVAX",
    explorer: "https://snowtrace.io",
    nativeCurrency: { name: "AVAX", symbol: "AVAX", decimals: 18 }
  }
} as const;

export type ChainId = keyof typeof CHAINS;

export const ENABLED_CHAIN_IDS = (process.env.EVM_ENABLED_CHAINS || "1,56,137,43114")
  .split(",")
  .map(v => Number(v))
  .filter(Boolean) as ChainId[];

export const DEFAULT_CHAIN_ID = Number(process.env.EVM_DEFAULT_CHAIN || 56) as ChainId;
