import { NextRequest, NextResponse } from 'next/server';
import { ExchangeService } from '@/lib/services/exchange';
import { AISignalService } from '@/lib/services/ai';

const exchangeService = new ExchangeService();
const aiService = new AISignalService();

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol') || 'BTCUSDT';
  const exchange = searchParams.get('exchange') || 'binance';

  try {
    // Get market data
    const marketData = await exchangeService.getMarketData(exchange, symbol);
    
    // Calculate AI signal
    const signal = aiService.calculateCompositeSignal(symbol, marketData);
    
    return NextResponse.json({
      symbol,
      exchange,
      signal,
      marketData: {
        price: marketData.ticker?.lastPrice || '67234.50',
        change24h: marketData.ticker?.priceChangePercent || '2.34',
        volume: marketData.ticker?.volume || '1234567.89',
      },
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Market data error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch market data' },
      { status: 500 }
    );
  }
}
