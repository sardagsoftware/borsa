/**
 * Top 10 Crypto Exchanges Configuration
 * High-volume exchanges with real-time data
 */

export interface ExchangeConfig {
  id: string;
  name: string;
  logo: string;
  apiEndpoint: string;
  websocketEndpoint: string;
  supportedPairs: string[];
  volume24h: number; // in USD
  trustScore: number; // 1-10
  features: {
    spot: boolean;
    futures: boolean;
    margin: boolean;
    staking: boolean;
  };
}

export const TOP_EXCHANGES: ExchangeConfig[] = [
  {
    id: 'binance',
    name: 'Binance',
    logo: '/exchanges/binance.svg',
    apiEndpoint: 'https://api.binance.com/api/v3',
    websocketEndpoint: 'wss://stream.binance.com:9443/ws',
    supportedPairs: ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT'],
    volume24h: 76000000000,
    trustScore: 10,
    features: {
      spot: true,
      futures: true,
      margin: true,
      staking: true
    }
  },
  {
    id: 'coinbase',
    name: 'Coinbase',
    logo: '/exchanges/coinbase.svg',
    apiEndpoint: 'https://api.exchange.coinbase.com',
    websocketEndpoint: 'wss://ws-feed.exchange.coinbase.com',
    supportedPairs: ['BTC-USD', 'ETH-USD', 'SOL-USD', 'ADA-USD'],
    volume24h: 14000000000,
    trustScore: 10,
    features: {
      spot: true,
      futures: false,
      margin: true,
      staking: true
    }
  },
  {
    id: 'kraken',
    name: 'Kraken',
    logo: '/exchanges/kraken.svg',
    apiEndpoint: 'https://api.kraken.com/0/public',
    websocketEndpoint: 'wss://ws.kraken.com',
    supportedPairs: ['XBTUSD', 'ETHUSD', 'SOLUSD', 'ADAUSD'],
    volume24h: 8000000000,
    trustScore: 9,
    features: {
      spot: true,
      futures: true,
      margin: true,
      staking: true
    }
  },
  {
    id: 'bybit',
    name: 'Bybit',
    logo: '/exchanges/bybit.svg',
    apiEndpoint: 'https://api.bybit.com/v5',
    websocketEndpoint: 'wss://stream.bybit.com/v5/public/spot',
    supportedPairs: ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'],
    volume24h: 45000000000,
    trustScore: 9,
    features: {
      spot: true,
      futures: true,
      margin: true,
      staking: false
    }
  },
  {
    id: 'okx',
    name: 'OKX',
    logo: '/exchanges/okx.svg',
    apiEndpoint: 'https://www.okx.com/api/v5',
    websocketEndpoint: 'wss://ws.okx.com:8443/ws/v5/public',
    supportedPairs: ['BTC-USDT', 'ETH-USDT', 'SOL-USDT'],
    volume24h: 32000000000,
    trustScore: 9,
    features: {
      spot: true,
      futures: true,
      margin: true,
      staking: true
    }
  },
  {
    id: 'huobi',
    name: 'Huobi Global',
    logo: '/exchanges/huobi.svg',
    apiEndpoint: 'https://api.huobi.pro',
    websocketEndpoint: 'wss://api.huobi.pro/ws',
    supportedPairs: ['btcusdt', 'ethusdt', 'solusdt'],
    volume24h: 12000000000,
    trustScore: 8,
    features: {
      spot: true,
      futures: true,
      margin: true,
      staking: true
    }
  },
  {
    id: 'kucoin',
    name: 'KuCoin',
    logo: '/exchanges/kucoin.svg',
    apiEndpoint: 'https://api.kucoin.com/api/v1',
    websocketEndpoint: 'wss://ws-api.kucoin.com/endpoint',
    supportedPairs: ['BTC-USDT', 'ETH-USDT', 'SOL-USDT'],
    volume24h: 9000000000,
    trustScore: 8,
    features: {
      spot: true,
      futures: true,
      margin: true,
      staking: true
    }
  },
  {
    id: 'gateio',
    name: 'Gate.io',
    logo: '/exchanges/gateio.svg',
    apiEndpoint: 'https://api.gateio.ws/api/v4',
    websocketEndpoint: 'wss://api.gateio.ws/ws/v4/',
    supportedPairs: ['BTC_USDT', 'ETH_USDT', 'SOL_USDT'],
    volume24h: 7500000000,
    trustScore: 8,
    features: {
      spot: true,
      futures: true,
      margin: true,
      staking: true
    }
  },
  {
    id: 'bitfinex',
    name: 'Bitfinex',
    logo: '/exchanges/bitfinex.svg',
    apiEndpoint: 'https://api-pub.bitfinex.com/v2',
    websocketEndpoint: 'wss://api-pub.bitfinex.com/ws/2',
    supportedPairs: ['tBTCUSD', 'tETHUSD', 'tSOLUSD'],
    volume24h: 5000000000,
    trustScore: 8,
    features: {
      spot: true,
      futures: false,
      margin: true,
      staking: false
    }
  },
  {
    id: 'mexc',
    name: 'MEXC',
    logo: '/exchanges/mexc.svg',
    apiEndpoint: 'https://api.mexc.com/api/v3',
    websocketEndpoint: 'wss://wbs.mexc.com/ws',
    supportedPairs: ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'],
    volume24h: 6000000000,
    trustScore: 7,
    features: {
      spot: true,
      futures: true,
      margin: true,
      staking: false
    }
  }
];

export function getExchangeById(id: string): ExchangeConfig | undefined {
  return TOP_EXCHANGES.find(ex => ex.id === id);
}

export function getExchangesByVolume(): ExchangeConfig[] {
  return [...TOP_EXCHANGES].sort((a, b) => b.volume24h - a.volume24h);
}

export function getSupportedExchanges(): string[] {
  return TOP_EXCHANGES.map(ex => ex.id);
}