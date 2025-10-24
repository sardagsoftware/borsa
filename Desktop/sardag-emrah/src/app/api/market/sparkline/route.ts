/**
 * SPARKLINE DATA API - CoinGecko
 *
 * 7-day price history for mini charts
 */

import { NextResponse } from 'next/server';
import { sanitizeSymbol } from '@/lib/security';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 300; // 5 min cache

// CoinGecko coin ID mapping (most popular)
const COIN_IDS: Record<string, string> = {
  'BTCUSDT': 'bitcoin',
  'ETHUSDT': 'ethereum',
  'BNBUSDT': 'binancecoin',
  'SOLUSDT': 'solana',
  'XRPUSDT': 'ripple',
  'ADAUSDT': 'cardano',
  'DOGEUSDT': 'dogecoin',
  'MATICUSDT': 'matic-network',
  'DOTUSDT': 'polkadot',
  'LTCUSDT': 'litecoin',
  'LINKUSDT': 'chainlink',
  'UNIUSDT': 'uniswap',
  'ATOMUSDT': 'cosmos',
  'XMRUSDT': 'monero',
  'ETCUSDT': 'ethereum-classic',
  'XLMUSDT': 'stellar',
  'ALGOUSDT': 'algorand',
  'TRXUSDT': 'tron',
  'AVAXUSDT': 'avalanche-2',
  'FILUSDT': 'filecoin',
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbols = searchParams.get('symbols');

    if (!symbols) {
      return NextResponse.json({
        success: false,
        error: 'Missing symbols parameter',
      }, { status: 400 });
    }

    // ✅ SECURITY: Sanitize symbol list
    const symbolList = symbols
      .split(',')
      .slice(0, 20) // Max 20 symbols
      .map(s => sanitizeSymbol(s.trim()))
      .filter(s => s.length > 0); // Remove empty strings
    console.log(`[Sparkline API] Fetching for ${symbolList.length} symbols...`);

    const sparklineData: Record<string, any> = {};

    // Fetch sparklines in parallel (only for known coins)
    await Promise.all(
      symbolList.map(async (symbol) => {
        const coinId = COIN_IDS[symbol];
        if (!coinId) {
          // Generate dummy sparkline for unknown coins
          sparklineData[symbol] = {
            symbol,
            prices: Array(42).fill(0),
            timestamps: [],
            change7d: 0,
            changePercent7d: 0,
          };
          return;
        }

        try {
          const response = await fetch(
            `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=7&interval=daily`
          );

          if (!response.ok) return;

          const data = await response.json();
          const prices = data.prices?.map((p: any) => p[1]) || [];
          const timestamps = data.prices?.map((p: any) => p[0]) || [];

          const firstPrice = prices[0] || 0;
          const lastPrice = prices[prices.length - 1] || 0;
          const change7d = lastPrice - firstPrice;
          const changePercent7d = firstPrice > 0 ? (change7d / firstPrice) * 100 : 0;

          sparklineData[symbol] = {
            symbol,
            prices,
            timestamps,
            change7d,
            changePercent7d,
          };
        } catch (err) {
          console.error(`[Sparkline API] Error for ${symbol}:`, err);
        }
      })
    );

    console.log(`[Sparkline API] ✅ Got ${Object.keys(sparklineData).length} sparklines`);

    return NextResponse.json({
      success: true,
      data: sparklineData,
      timestamp: Date.now(),
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('[Sparkline API] Error:', error);

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch sparkline data',
      data: {},
    }, { status: 500 });
  }
}
