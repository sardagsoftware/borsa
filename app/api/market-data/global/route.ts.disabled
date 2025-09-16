/**
 * AILYDIAN GLOBAL TRADER API - Market Data Endpoint
 * Real-time data for all global markets with fallback chain
 */

import { NextRequest, NextResponse } from 'next/server';
import { globalMarketDataClient } from '@/lib/services/global-market-data';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const symbol = searchParams.get('symbol');
    const type = searchParams.get('type') as 'stocks' | 'crypto' | 'commodities' | 'forex' | 'derivatives';
    const timeframe = searchParams.get('timeframe') || '1m';
    const limit = parseInt(searchParams.get('limit') || '100');

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol parameter is required' },
        { status: 400 }
      );
    }

    if (!type) {
      return NextResponse.json(
        { error: 'Type parameter is required (stocks, crypto, commodities, forex, derivatives)' },
        { status: 400 }
      );
    }

    // Get both ticker and OHLCV data
    const [tickerData, ohlcvData] = await Promise.allSettled([
      globalMarketDataClient.getTickerData(symbol, type),
      globalMarketDataClient.getOHLCVData(symbol, timeframe, type, limit)
    ]);

    const response = {
      symbol,
      type,
      timestamp: Date.now(),
      ticker: tickerData.status === 'fulfilled' ? tickerData.value : null,
      ohlcv: ohlcvData.status === 'fulfilled' ? ohlcvData.value : null,
      errors: {
        ticker: tickerData.status === 'rejected' ? tickerData.reason?.message : null,
        ohlcv: ohlcvData.status === 'rejected' ? ohlcvData.reason?.message : null,
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Market data API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { symbols, type, timeframe = '1m', limit = 100 } = body;

    if (!symbols || !Array.isArray(symbols)) {
      return NextResponse.json(
        { error: 'Symbols array is required' },
        { status: 400 }
      );
    }

    if (!type) {
      return NextResponse.json(
        { error: 'Type parameter is required' },
        { status: 400 }
      );
    }

    // Batch request for multiple symbols
    const results = await Promise.allSettled(
      symbols.map(async (symbol: string) => {
        const [tickerData, ohlcvData] = await Promise.allSettled([
          globalMarketDataClient.getTickerData(symbol, type),
          globalMarketDataClient.getOHLCVData(symbol, timeframe, type, limit)
        ]);

        return {
          symbol,
          ticker: tickerData.status === 'fulfilled' ? tickerData.value : null,
          ohlcv: ohlcvData.status === 'fulfilled' ? ohlcvData.value : null,
          errors: {
            ticker: tickerData.status === 'rejected' ? tickerData.reason?.message : null,
            ohlcv: ohlcvData.status === 'rejected' ? ohlcvData.reason?.message : null,
          }
        };
      })
    );

    return NextResponse.json({
      type,
      timeframe,
      limit,
      timestamp: Date.now(),
      results: results.map(result => 
        result.status === 'fulfilled' ? result.value : { error: result.reason?.message }
      )
    });

  } catch (error) {
    console.error('Batch market data API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      },
      { status: 500 }
    );
  }
}
