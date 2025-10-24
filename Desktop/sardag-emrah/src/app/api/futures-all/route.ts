/**
 * BINANCE FUTURES - ALL USDT PAIRS
 *
 * Tüm USDT perpetual futures pairlerini getir
 * Real-time, filtered, sorted by volume
 */

import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 300; // 5 dakika cache

interface FuturesPair {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  price: number;
  volume24h: number;
  changePercent24h: number;
  high24h: number;
  low24h: number;
}

export async function GET() {
  try {
    console.log('[Futures API] Fetching all USDT pairs from Binance...');

    // 1. Get exchange info (all active symbols)
    const exchangeResponse = await fetch('https://fapi.binance.com/fapi/v1/exchangeInfo');

    if (!exchangeResponse.ok) {
      throw new Error(`Exchange info failed: ${exchangeResponse.status}`);
    }

    const exchangeData = await exchangeResponse.json();

    // Filter only USDT perpetual contracts that are TRADING
    const usdtSymbols = exchangeData.symbols
      .filter((s: any) =>
        s.quoteAsset === 'USDT' &&
        s.contractType === 'PERPETUAL' &&
        s.status === 'TRADING'
      )
      .map((s: any) => s.symbol);

    console.log(`[Futures API] Found ${usdtSymbols.length} active USDT perpetual pairs`);

    // 2. Get 24h ticker data for all symbols
    const tickerResponse = await fetch('https://fapi.binance.com/fapi/v1/ticker/24hr');

    if (!tickerResponse.ok) {
      throw new Error(`Ticker data failed: ${tickerResponse.status}`);
    }

    const tickerData = await tickerResponse.json();

    // 3. Filter and format
    const pairs: FuturesPair[] = tickerData
      .filter((t: any) => usdtSymbols.includes(t.symbol))
      .map((t: any) => ({
        symbol: t.symbol,
        baseAsset: t.symbol.replace('USDT', ''),
        quoteAsset: 'USDT',
        price: parseFloat(t.lastPrice),
        volume24h: parseFloat(t.quoteVolume),
        changePercent24h: parseFloat(t.priceChangePercent),
        high24h: parseFloat(t.highPrice),
        low24h: parseFloat(t.lowPrice),
      }))
      // Sort by 24h volume (descending)
      .sort((a: FuturesPair, b: FuturesPair) => b.volume24h - a.volume24h);

    console.log(`[Futures API] ✅ Returning ${pairs.length} USDT futures pairs`);

    return NextResponse.json({
      success: true,
      count: pairs.length,
      data: pairs,
      timestamp: Date.now(),
      source: 'binance-futures',
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });

  } catch (error) {
    console.error('[Futures API] Error:', error);

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch futures pairs',
      data: [],
    }, {
      status: 500,
    });
  }
}
