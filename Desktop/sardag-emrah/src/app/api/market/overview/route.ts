/**
 * MARKET OVERVIEW API - CoinGecko
 *
 * Free, no geo-restrictions, reliable
 * Rate limit: 50 calls/minute (generous)
 */

import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 60; // Cache for 1 min

interface MarketTicker {
  symbol: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  quoteVolume: number;
  rank: number;
}

export async function GET() {
  try {
    console.log('[Market API] Fetching from CoinGecko...');

    // CoinGecko: Top 250 coins by market cap
    const response = await fetch(
      'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=200&page=1&sparkline=false&price_change_percentage=24h',
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();

    // Format to our structure
    const tickers: MarketTicker[] = data.map((coin: any, index: number) => ({
      symbol: `${coin.symbol.toUpperCase()}USDT`, // Add USDT for consistency
      price: coin.current_price || 0,
      change24h: coin.price_change_24h || 0,
      changePercent24h: coin.price_change_percentage_24h || 0,
      high24h: coin.high_24h || coin.current_price,
      low24h: coin.low_24h || coin.current_price,
      volume24h: coin.total_volume || 0,
      quoteVolume: coin.market_cap || 0,
      rank: index + 1,
    }));

    console.log(`[Market API] ✅ Got ${tickers.length} coins from CoinGecko`);

    return NextResponse.json({
      success: true,
      data: tickers,
      timestamp: Date.now(),
      source: 'coingecko',
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    console.error('[Market API] Error:', error);

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch market data',
      data: [],
    }, {
      status: 500,
    });
  }
}
