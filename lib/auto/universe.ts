// Universe selection - CoinGecko Top 100 + Futures mapping
import CoinGecko from 'coingecko-api';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const coinGecko = new CoinGecko();

export interface UniverseMember {
  symbol: string;
  name: string;
  rank: number;
  price: number;
  volume24h: number;
  marketCap: number;
  change24h: number;
  futuresSupported: boolean;
  liquidity: number;
  spread: number;
  beta: number;
}

export interface UniverseData {
  members: UniverseMember[];
  lastUpdate: Date;
  supportedSymbols: string[];
}

// Binance Futures supported symbols (cached)
const BINANCE_FUTURES_SYMBOLS = [
  'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'DOTUSDT', 'XRPUSDT', 
  'LTCUSDT', 'LINKUSDT', 'BCHUSDT', 'XLMUSDT', 'UNIUSDT', 'VETUSDT',
  'FILUSDT', 'TRXUSDT', 'ETCUSDT', 'EOSUSDT', 'AAVEUSDT', 'MKRUSDT',
  'SUSHIUSDT', 'YFIUSDT', 'ALGOUSDT', 'ATOMUSDT', 'COMPUSDT', 'DASHUSDT',
  'NEOUSDT', 'ONTUSDT', 'QTUMUSDT', 'ICXUSDT', 'ZECUSDT', 'OMGUSDT',
  'BATUSDT', 'ZRXUSDT', 'ENJUSDT', 'KNCUSDT', 'MANAUSDT', 'SANDUSDT',
  'AXSUSDT', 'CHZUSDT', 'GALAUSDT', 'RUNEUSDT', 'NEARUSDT', 'AVAXUSDT',
  'LUNAUSDT', 'MATICUSDT', 'FTMUSDT', 'HBARUSDT', 'EGLDUSDT', 'SOLUSDT',
  'DOGEUSDT', 'SHIBUSDT', 'APTUSDT', 'OPUSDT', 'ARBUSDT'
];

export class UniverseManager {
  private cache: UniverseData | null = null;
  private lastRefresh = 0;
  
  constructor(private refreshInterval = 60 * 60 * 1000) {} // 1 hour default
  
  async getUniverse(): Promise<UniverseData> {
    const now = Date.now();
    
    if (this.cache && (now - this.lastRefresh) < this.refreshInterval) {
      return this.cache;
    }
    
    try {
      console.log('🔄 Refreshing universe data...');
      
      // Get Top N from CoinGecko
      const topN = parseInt(process.env.COINGECKO_TOP_N || '100');
      
      // Mock data for now since we don't have actual CoinGecko API access
      const mockData = [
        {
          id: 'bitcoin',
          symbol: 'btc',
          name: 'Bitcoin',
          market_cap: 821000000000,
          current_price: 42350.75,
          price_change_percentage_24h: 2.47,
          total_volume: 18500000000
        },
        {
          id: 'ethereum',
          symbol: 'eth', 
          name: 'Ethereum',
          market_cap: 289000000000,
          current_price: 2587.45,
          price_change_percentage_24h: 1.89,
          total_volume: 12300000000
        },
        {
          id: 'binancecoin',
          symbol: 'bnb',
          name: 'BNB',
          market_cap: 45600000000,
          current_price: 312.89,
          price_change_percentage_24h: -0.76,
          total_volume: 1850000000
        }
      ];
      
      const members: UniverseMember[] = [];
      
      for (const coin of mockData) {
        const symbol = this.normalizeSymbol(coin.symbol);
        const futuresSymbol = `${symbol}USDT`;
        
        // Check if supported in futures
        const futuresSupported = BINANCE_FUTURES_SYMBOLS.includes(futuresSymbol);
        
        if (futuresSupported) {
          members.push({
            symbol: futuresSymbol,
            name: coin.name,
            rank: members.length + 1, // Use index as rank
            price: coin.current_price || 0,
            volume24h: coin.total_volume || 0,
            marketCap: coin.market_cap || 0,
            change24h: coin.price_change_percentage_24h || 0,
            futuresSupported: true,
            liquidity: this.calculateLiquidity(coin),
            spread: 0, // Will be updated by real-time data
            beta: 0   // Will be calculated by lead-lag module
          });
        }
      }
      
      // Sort by liquidity and market cap
      members.sort((a, b) => b.liquidity - a.liquidity);
      
      this.cache = {
        members,
        lastUpdate: new Date(),
        supportedSymbols: members.map(m => m.symbol)
      };
      
      this.lastRefresh = now;
      
      // Save snapshot to DB
      await this.saveSnapshot();
      
      console.log(`✅ Universe updated: ${members.length} futures-supported symbols`);
      
      return this.cache;
      
    } catch (error) {
      console.error('❌ Universe refresh failed:', error);
      
      // Return cached data if available
      if (this.cache) {
        console.log('📋 Using cached universe data');
        return this.cache;
      }
      
      // Fallback to top symbols
      return this.getFallbackUniverse();
    }
  }
  
  private normalizeSymbol(symbol: string): string {
    return symbol.toUpperCase();
  }
  
  private calculateLiquidity(coin: any): number {
    // Simple liquidity score based on volume and market cap
    const volume = coin.total_volume || 0;
    const marketCap = coin.market_cap || 0;
    
    return Math.log(volume + 1) * Math.log(marketCap + 1);
  }
  
  private async saveSnapshot(): Promise<void> {
    if (!this.cache) return;
    
    try {
      await prisma.universeSnapshot.create({
        data: {
          members: this.cache.members as any,
          meta: {
            totalMembers: this.cache.members.length,
            lastRefresh: this.lastRefresh,
            source: 'coingecko'
          }
        }
      });
    } catch (error) {
      console.error('Failed to save universe snapshot:', error);
    }
  }
  
  private getFallbackUniverse(): UniverseData {
    const fallbackSymbols = [
      'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'DOTUSDT',
      'XRPUSDT', 'LTCUSDT', 'LINKUSDT', 'BCHUSDT', 'XLMUSDT'
    ];
    
    const members: UniverseMember[] = fallbackSymbols.map((symbol, index) => ({
      symbol,
      name: symbol.replace('USDT', ''),
      rank: index + 1,
      price: 0,
      volume24h: 0,
      marketCap: 0,
      change24h: 0,
      futuresSupported: true,
      liquidity: 100 - index,
      spread: 0,
      beta: 0
    }));
    
    return {
      members,
      lastUpdate: new Date(),
      supportedSymbols: fallbackSymbols
    };
  }
  
  async getSymbolInfo(symbol: string): Promise<UniverseMember | null> {
    const universe = await this.getUniverse();
    return universe.members.find(m => m.symbol === symbol) || null;
  }
  
  async getSupportedSymbols(): Promise<string[]> {
    const universe = await this.getUniverse();
    return universe.supportedSymbols;
  }
}

// Singleton instance
export const universeManager = new UniverseManager();
