/**
 * CoinMarketCap Top 100 API Endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { coinMarketCapService } from '@/services/market/CoinMarketCapService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const limit = parseInt(searchParams.get('limit') || '100');
    const query = searchParams.get('query');
    const tag = searchParams.get('tag');
    const symbols = searchParams.get('symbols')?.split(',');

    // Handle different actions
    switch (action) {
      case 'trending':
        const trending = await coinMarketCapService.getTrendingCoins(limit);
        return NextResponse.json({
          success: true,
          count: trending.length,
          data: trending,
        });

      case 'gainers':
        const gainers = await coinMarketCapService.getTopGainers(limit);
        return NextResponse.json({
          success: true,
          count: gainers.length,
          data: gainers,
        });

      case 'losers':
        const losers = await coinMarketCapService.getTopLosers(limit);
        return NextResponse.json({
          success: true,
          count: losers.length,
          data: losers,
        });

      case 'search':
        if (!query) {
          return NextResponse.json(
            { success: false, error: 'Query parameter required' },
            { status: 400 }
          );
        }
        const searchResults = await coinMarketCapService.searchCoins(query);
        return NextResponse.json({
          success: true,
          count: searchResults.length,
          data: searchResults,
        });

      case 'by-tag':
        if (!tag) {
          return NextResponse.json(
            { success: false, error: 'Tag parameter required' },
            { status: 400 }
          );
        }
        const tagResults = await coinMarketCapService.getCoinsByTag(tag);
        return NextResponse.json({
          success: true,
          count: tagResults.length,
          data: tagResults,
        });

      case 'by-symbols':
        if (!symbols || symbols.length === 0) {
          return NextResponse.json(
            { success: false, error: 'Symbols parameter required' },
            { status: 400 }
          );
        }
        const symbolResults = await coinMarketCapService.getCoinsBySymbols(symbols);
        return NextResponse.json({
          success: true,
          count: symbolResults.length,
          data: symbolResults,
        });

      default:
        // Default: Return Top 100
        const top100 = await coinMarketCapService.getTop100();
        return NextResponse.json({
          success: true,
          count: top100.length,
          data: top100.slice(0, limit),
          metadata: {
            totalMarketCap: top100.reduce((sum, coin) => sum + coin.marketCap, 0),
            totalVolume24h: top100.reduce((sum, coin) => sum + coin.volume24h, 0),
            btcDominance: top100.find(c => c.symbol === 'BTC')?.marketCapDominance || 0,
            timestamp: new Date().toISOString(),
          },
        });
    }
  } catch (error: any) {
    console.error('Top 100 API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}
