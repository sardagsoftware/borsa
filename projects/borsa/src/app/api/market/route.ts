import { NextRequest, NextResponse } from 'next/server';
import { GlobalExchangeRegistry } from '@/lib/exchanges/GlobalExchangeConfig';
import UniversalMarketDataEngine from '@/lib/engines/UniversalMarketDataEngine';

// Initialize global instances
let marketDataEngine: UniversalMarketDataEngine;
let initialized = false;

async function initializeEngine() {
  if (!initialized) {
    GlobalExchangeRegistry.initialize();
    marketDataEngine = new UniversalMarketDataEngine();
    initialized = true;
    console.log('🌐 Market Data Engine initialized');
  }
}

export async function GET(request: NextRequest) {
  try {
    await initializeEngine();
    
    const { searchParams } = new URL(request.url);
    const symbols = searchParams.get('symbols')?.split(',') || [];
    const exchange = searchParams.get('exchange');
    
    // Get mock market data
    const marketData = generateMockMarketData(symbols, exchange);
    
    return NextResponse.json({
      success: true,
      data: marketData,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('❌ Market data API error:', error);
    return NextResponse.json(
      { success: false, error: 'Market data fetch failed' },
      { status: 500 }
    );
  }
}

function generateMockMarketData(symbols: string[], exchange?: string | null) {
  const defaultSymbols = symbols.length > 0 ? symbols : [
    'BTC', 'ETH', 'AAPL', 'TSLA', 'MSFT', 'GOOGL', 'AMZN'
  ];

  return defaultSymbols.map(symbol => {
    const basePrice = symbol.includes('BTC') ? 43000 :
                     symbol.includes('ETH') ? 2800 :
                     symbol.includes('AAPL') ? 175 :
                     symbol.includes('TSLA') ? 240 :
                     symbol.includes('MSFT') ? 380 :
                     symbol.includes('GOOGL') ? 140 :
                     symbol.includes('AMZN') ? 145 :
                     100;

    const change = (Math.random() - 0.5) * 0.1; // ±5% change
    const currentPrice = basePrice * (1 + change);
    const changePercent = change * 100;
    const volume = Math.floor(100000 + Math.random() * 900000);

    return {
      symbol,
      exchange: exchange || (symbol.includes('BTC') || symbol.includes('ETH') ? 'binance' : 'nasdaq'),
      timestamp: Date.now(),
      price: currentPrice,
      volume,
      bid: currentPrice * 0.999,
      ask: currentPrice * 1.001,
      high24h: currentPrice * 1.05,
      low24h: currentPrice * 0.95,
      change24h: changePercent,
      changePercent24h: changePercent
    };
  });
}