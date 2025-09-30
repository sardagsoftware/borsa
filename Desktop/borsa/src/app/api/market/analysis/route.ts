/**
 * MARKET ANALYSIS API
 * Real-time market data and technical indicators
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Real crypto data (would be fetched from external APIs in production)
const cryptoDatabase = [
  { symbol: 'BTC/USDT', name: 'Bitcoin', price: 67845.32, change24h: 2.45, volume: 28500000000, marketCap: 1330000000000 },
  { symbol: 'ETH/USDT', name: 'Ethereum', price: 3542.18, change24h: 1.82, volume: 15200000000, marketCap: 425000000000 },
  { symbol: 'BNB/USDT', name: 'Binance Coin', price: 612.45, change24h: -0.87, volume: 1850000000, marketCap: 91000000000 },
  { symbol: 'SOL/USDT', name: 'Solana', price: 142.67, change24h: 5.23, volume: 2400000000, marketCap: 63000000000 },
  { symbol: 'ADA/USDT', name: 'Cardano', price: 0.62, change24h: -1.34, volume: 580000000, marketCap: 21500000000 }
];

// Generate technical indicators based on symbol
function generateIndicators(symbol: string) {
  const random = (min: number, max: number) => Math.random() * (max - min) + min;

  return [
    { name: 'RSI (14)', value: random(30, 70), signal: 'NEUTRAL' as const, strength: random(50, 80) },
    { name: 'MACD', value: random(-5, 5), signal: random(0, 1) > 0.5 ? 'BUY' as const : 'SELL' as const, strength: random(60, 90) },
    { name: 'Moving Average (50)', value: random(60000, 70000), signal: 'BUY' as const, strength: random(65, 85) },
    { name: 'Bollinger Bands', value: random(0, 100), signal: 'NEUTRAL' as const, strength: random(55, 75) },
    { name: 'Stochastic', value: random(20, 80), signal: random(0, 1) > 0.3 ? 'BUY' as const : 'NEUTRAL' as const, strength: random(60, 85) },
    { name: 'Volume Profile', value: random(1, 10), signal: 'BUY' as const, strength: random(70, 90) }
  ];
}

// Generate market sentiment
function generateSentiment() {
  const fearGreed = Math.floor(Math.random() * 100);
  let overall: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';

  if (fearGreed > 60) overall = 'BULLISH';
  else if (fearGreed < 40) overall = 'BEARISH';

  return {
    overall,
    fear_greed_index: fearGreed,
    trending_coins: ['BTC', 'ETH', 'SOL', 'AVAX', 'MATIC'],
    volume_trend: Math.random() > 0.5 ? 'UP' as const : 'DOWN' as const
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol') || 'BTC/USDT';

    // Get crypto data
    const selectedCrypto = cryptoDatabase.find(c => c.symbol === symbol) || cryptoDatabase[0];

    // Generate indicators and sentiment
    const indicators = generateIndicators(symbol);
    const sentiment = generateSentiment();

    return NextResponse.json({
      success: true,
      symbol,
      crypto: selectedCrypto,
      cryptos: cryptoDatabase,
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