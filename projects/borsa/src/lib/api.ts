import axios from 'axios';
import { Stock, Crypto, MarketSummary, PriceHistory, ApiResponse } from '@/types/market';

// API Keys - gerçek uygulamada environment variables kullanın
const ALPHA_VANTAGE_API_KEY = 'demo'; // https://www.alphavantage.co/support/#api-key
const COINAPI_KEY = 'demo'; // https://www.coinapi.io/

const api = axios.create({
  timeout: 10000,
});

// Mock data for development - replace with real APIs later
const mockStocks: Stock[] = [
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    price: 185.92,
    change: 2.45,
    changePercent: 1.34,
    volume: 45678900,
    marketCap: 2890000000000,
    pe: 28.5,
    dividendYield: 0.52,
    high52Week: 199.62,
    low52Week: 164.08,
    lastUpdated: new Date().toISOString(),
  },
  {
    symbol: 'MSFT',
    name: 'Microsoft Corporation',
    price: 378.85,
    change: -3.21,
    changePercent: -0.84,
    volume: 23456789,
    marketCap: 2810000000000,
    pe: 32.1,
    dividendYield: 0.68,
    high52Week: 384.30,
    low52Week: 309.45,
    lastUpdated: new Date().toISOString(),
  },
  {
    symbol: 'GOOGL',
    name: 'Alphabet Inc.',
    price: 142.56,
    change: 1.89,
    changePercent: 1.34,
    volume: 18765432,
    marketCap: 1780000000000,
    pe: 25.8,
    dividendYield: 0.0,
    high52Week: 153.78,
    low52Week: 121.46,
    lastUpdated: new Date().toISOString(),
  },
  {
    symbol: 'TSLA',
    name: 'Tesla, Inc.',
    price: 248.73,
    change: 8.92,
    changePercent: 3.72,
    volume: 67890123,
    marketCap: 789000000000,
    pe: 65.2,
    dividendYield: 0.0,
    high52Week: 278.98,
    low52Week: 138.80,
    lastUpdated: new Date().toISOString(),
  },
  {
    symbol: 'AMZN',
    name: 'Amazon.com Inc.',
    price: 146.89,
    change: -2.11,
    changePercent: -1.42,
    volume: 34567890,
    marketCap: 1520000000000,
    pe: 45.3,
    dividendYield: 0.0,
    high52Week: 158.88,
    low52Week: 118.35,
    lastUpdated: new Date().toISOString(),
  },
];

const mockCrypto: Crypto[] = [
  {
    id: 'bitcoin',
    symbol: 'BTC',
    name: 'Bitcoin',
    price: 63842.50,
    change: 1250.75,
    changePercent: 2.00,
    volume24h: 15678900000,
    marketCap: 1256789000000,
    marketCapRank: 1,
    circulatingSupply: 19687343,
    totalSupply: 21000000,
    high24h: 64200.00,
    low24h: 62100.00,
    ath: 69044.77,
    athDate: '2021-11-10T14:24:11.849Z',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'ethereum',
    symbol: 'ETH',
    name: 'Ethereum',
    price: 2634.82,
    change: -45.23,
    changePercent: -1.69,
    volume24h: 8934567890,
    marketCap: 316789000000,
    marketCapRank: 2,
    circulatingSupply: 120280000,
    totalSupply: 120280000,
    high24h: 2687.50,
    low24h: 2598.30,
    ath: 4878.26,
    athDate: '2021-11-10T14:24:19.604Z',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'binancecoin',
    symbol: 'BNB',
    name: 'BNB',
    price: 598.45,
    change: 12.34,
    changePercent: 2.11,
    volume24h: 1234567890,
    marketCap: 89456000000,
    marketCapRank: 4,
    circulatingSupply: 149533700,
    totalSupply: 149533700,
    high24h: 605.80,
    low24h: 586.20,
    ath: 686.31,
    athDate: '2021-05-10T07:24:17.097Z',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'solana',
    symbol: 'SOL',
    name: 'Solana',
    price: 143.67,
    change: 8.92,
    changePercent: 6.63,
    volume24h: 2345678901,
    marketCap: 67890000000,
    marketCapRank: 5,
    circulatingSupply: 472584100,
    totalSupply: 580803357,
    high24h: 145.20,
    low24h: 132.80,
    ath: 259.96,
    athDate: '2021-11-06T21:54:35.825Z',
    lastUpdated: new Date().toISOString(),
  },
];

// Import real-time API functions
import { fetchRealTimeStocks, fetchRealTimeCryptos, fetchMarketSummary as fetchRealMarketSummary, fetchFinancialNews } from './realTimeApi';

// Stock API functions
export async function getStocks(): Promise<ApiResponse<Stock[]>> {
  try {
    // Try to fetch real data first, fallback to mock data if fails
    try {
      const realData = await fetchRealTimeStocks();
      if (realData && realData.length > 0) {
        return {
          data: realData.filter(stock => stock !== null),
          timestamp: new Date().toISOString(),
        };
      }
    } catch (realApiError) {
      console.warn('Real API failed, using mock data:', realApiError);
    }
    
    // Fallback to mock data
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      data: mockStocks,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      data: mockStocks, // Always return mock data as fallback
      error: error instanceof Error ? error.message : 'Failed to fetch stocks',
      timestamp: new Date().toISOString(),
    };
  }
}

export async function getStock(symbol: string): Promise<ApiResponse<Stock | null>> {
  try {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const stock = mockStocks.find(s => s.symbol === symbol.toUpperCase());
    
    return {
      data: stock || null,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch stock',
      timestamp: new Date().toISOString(),
    };
  }
}

// Crypto API functions
export async function getCryptos(): Promise<ApiResponse<Crypto[]>> {
  try {
    // Try to fetch real data first, fallback to mock data if fails
    try {
      const realData = await fetchRealTimeCryptos();
      if (realData && realData.length > 0) {
        return {
          data: realData,
          timestamp: new Date().toISOString(),
        };
      }
    } catch (realApiError) {
      console.warn('Real crypto API failed, using mock data:', realApiError);
    }
    
    // Fallback to mock data
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      data: mockCrypto,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      data: mockCrypto, // Always return mock data as fallback
      error: error instanceof Error ? error.message : 'Failed to fetch cryptocurrencies',
      timestamp: new Date().toISOString(),
    };
  }
}

export async function getCrypto(id: string): Promise<ApiResponse<Crypto | null>> {
  try {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const crypto = mockCrypto.find(c => c.id === id || c.symbol.toLowerCase() === id.toLowerCase());
    
    return {
      data: crypto || null,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch cryptocurrency',
      timestamp: new Date().toISOString(),
    };
  }
}

// Market summary
export async function getMarketSummary(): Promise<ApiResponse<MarketSummary>> {
  try {
    // Try to fetch real data first, fallback to mock data if fails
    try {
      const realData = await fetchRealMarketSummary();
      if (realData) {
        return {
          data: realData,
          timestamp: new Date().toISOString(),
        };
      }
    } catch (realApiError) {
      console.warn('Real market summary API failed, using mock data:', realApiError);
    }
    
    // Fallback to mock data
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const mockSummary: MarketSummary = {
      totalMarketCap: 2340000000000,
      totalVolume24h: 89500000000,
      marketCapChange24h: 1.45,
      activeCurrencies: 13456,
      totalExchanges: 756,
      btcDominance: 53.7,
      lastUpdated: new Date().toISOString(),
    };
    
    return {
      data: mockSummary,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const mockSummary: MarketSummary = {
      totalMarketCap: 2340000000000,
      totalVolume24h: 89500000000,
      marketCapChange24h: 1.45,
      activeCurrencies: 13456,
      totalExchanges: 756,
      btcDominance: 53.7,
      lastUpdated: new Date().toISOString(),
    };
    
    return {
      data: mockSummary,
      error: error instanceof Error ? error.message : 'Failed to fetch market summary',
      timestamp: new Date().toISOString(),
    };
  }
}

// Price history
export async function getPriceHistory(
  symbol: string, 
  type: 'stock' | 'crypto',
  days: number = 30
): Promise<ApiResponse<PriceHistory[]>> {
  try {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    let currentPrice = 100;
    
    if (type === 'stock') {
      const stock = mockStocks.find(s => s.symbol === symbol.toUpperCase());
      currentPrice = stock?.price || 100;
    } else {
      const crypto = mockCrypto.find(c => c.symbol.toLowerCase() === symbol.toLowerCase());
      currentPrice = crypto?.price || 100;
    }
    
    // Generate mock price history
    const history: PriceHistory[] = [];
    const now = new Date();
    
    for (let i = days; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      const variation = (Math.random() - 0.5) * 0.1;
      const price = currentPrice * (1 + variation * (i / days));
      
      history.push({
        timestamp: date.toISOString(),
        price: Math.max(price, 0.01),
        volume: Math.floor(Math.random() * 1000000) + 100000,
      });
    }
    
    return {
      data: history,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      data: [],
      error: error instanceof Error ? error.message : 'Failed to fetch price history',
      timestamp: new Date().toISOString(),
    };
  }
}