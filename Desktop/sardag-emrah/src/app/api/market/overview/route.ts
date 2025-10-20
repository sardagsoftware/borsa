/**
 * MARKET OVERVIEW API - Binance Futures (ALL USDT Perpetuals)
 *
 * Direct from Binance Futures API
 * Real-time data for ALL USDT perpetual contracts
 * No rate limits, free, reliable
 */

import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 30; // Cache for 30 sec (real-time)

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
    console.log('[Market API] Fetching ALL USDT perpetuals from Binance Futures...');

    // Get 24h ticker data for ALL symbols
    const tickerResponse = await fetch(
      'https://fapi.binance.com/fapi/v1/ticker/24hr',
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!tickerResponse.ok) {
      throw new Error(`Binance API error: ${tickerResponse.status}`);
    }

    const allTickers = await tickerResponse.json();

    // Filter only USDT perpetual futures (exclude delivery contracts)
    const usdtTickers = allTickers.filter((t: any) =>
      t.symbol.endsWith('USDT') &&
      !t.symbol.includes('_') // Exclude delivery contracts (BTCUSDT_251227)
    );

    console.log(`[Market API] Filtered ${usdtTickers.length} USDT perpetuals from ${allTickers.length} total`);

    // Format to our structure and sort by volume
    const tickers: MarketTicker[] = usdtTickers
      .map((ticker: any) => ({
        symbol: ticker.symbol,
        price: parseFloat(ticker.lastPrice),
        change24h: parseFloat(ticker.priceChange),
        changePercent24h: parseFloat(ticker.priceChangePercent),
        high24h: parseFloat(ticker.highPrice),
        low24h: parseFloat(ticker.lowPrice),
        volume24h: parseFloat(ticker.volume),
        quoteVolume: parseFloat(ticker.quoteVolume),
        rank: 0, // Will be set after sorting
      }))
      .sort((a: MarketTicker, b: MarketTicker) => b.quoteVolume - a.quoteVolume) // Sort by volume
      .map((ticker: MarketTicker, index: number) => ({
        ...ticker,
        rank: index + 1,
      }));

    console.log(`[Market API] ✅ Got ${tickers.length} USDT perpetuals from Binance Futures`);
    console.log(`[Market API] Top 5: ${tickers.slice(0, 5).map(t => t.symbol).join(', ')}`);

    return NextResponse.json({
      success: true,
      data: tickers,
      timestamp: Date.now(),
      source: 'binance-futures',
      total: tickers.length,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
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
