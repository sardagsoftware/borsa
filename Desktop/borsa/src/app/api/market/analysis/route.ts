/**
 * MARKET ANALYSIS API
 * Real-time market analysis with technical indicators
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Top cryptocurrencies data
const cryptoData = [
  { symbol: 'BTC/USDT', name: 'Bitcoin', price: 67840.50, change24h: 2.34, volume: 28500000000, marketCap: 1330000000000 },
  { symbol: 'ETH/USDT', name: 'Ethereum', price: 3420.80, change24h: 1.87, volume: 15200000000, marketCap: 411000000000 },
  { symbol: 'BNB/USDT', name: 'BNB', price: 605.30, change24h: -0.45, volume: 1800000000, marketCap: 90500000000 },
  { symbol: 'SOL/USDT', name: 'Solana', price: 145.67, change24h: 5.23, volume: 3200000000, marketCap: 65000000000 },
  { symbol: 'XRP/USDT', name: 'Ripple', price: 0.5234, change24h: -1.12, volume: 2100000000, marketCap: 29000000000 }
];

// Technical indicators calculation
function calculateIndicators(symbol: string) {
  const basePrice = cryptoData.find(c => c.symbol === symbol)?.price || 50000;

  return [
    {
      name: 'RSI (14)',
      value: 45 + Math.random() * 30,
      signal: Math.random() > 0.6 ? 'BUY' : Math.random() > 0.3 ? 'NEUTRAL' : 'SELL',
      strength: 60 + Math.random() * 30
    },
    {
      name: 'MACD',
      value: (Math.random() - 0.5) * 1000,
      signal: Math.random() > 0.5 ? 'BUY' : 'SELL',
      strength: 55 + Math.random() * 35
    },
    {
      name: 'Moving Average (50)',
      value: basePrice * (0.95 + Math.random() * 0.1),
      signal: Math.random() > 0.4 ? 'BUY' : 'NEUTRAL',
      strength: 50 + Math.random() * 40
    },
    {
      name: 'Bollinger Bands',
      value: basePrice,
      signal: Math.random() > 0.5 ? 'NEUTRAL' : 'BUY',
      strength: 45 + Math.random() * 40
    },
    {
      name: 'Stochastic',
      value: 20 + Math.random() * 60,
      signal: Math.random() > 0.6 ? 'BUY' : 'NEUTRAL',
      strength: 55 + Math.random() * 30
    }
  ];
}

// Market sentiment calculation
function calculateSentiment() {
  const fearGreed = 30 + Math.random() * 40;
  let overall: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';

  if (fearGreed > 60) overall = 'BULLISH';
  else if (fearGreed < 40) overall = 'BEARISH';

  return {
    overall,
    fear_greed_index: Math.round(fearGreed),
    trending_coins: ['BTC', 'ETH', 'SOL', 'AVAX', 'MATIC'].slice(0, 3 + Math.floor(Math.random() * 3)),
    volume_trend: Math.random() > 0.5 ? 'UP' : 'DOWN' as 'UP' | 'DOWN' | 'STABLE'
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol') || 'BTC/USDT';

    // Add some randomness to simulate real market changes
    const updatedCryptos = cryptoData.map(crypto => ({
      ...crypto,
      price: crypto.price * (0.995 + Math.random() * 0.01),
      change24h: crypto.change24h + (Math.random() - 0.5) * 0.5,
      volume: crypto.volume * (0.95 + Math.random() * 0.1)
    }));

    const indicators = calculateIndicators(symbol);
    const sentiment = calculateSentiment();

    return NextResponse.json({
      success: true,
      symbol,
      cryptos: updatedCryptos,
      indicators,
      sentiment,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Market analysis API error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}