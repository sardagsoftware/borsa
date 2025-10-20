/**
 * TRADITIONAL MARKETS ANALYSIS API
 *
 * Apply ALL 9 trading strategies + Groq AI to traditional markets
 * Supports: Gold, Silver, Platinum, BIST100, Forex
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUniversalCandles } from '@/lib/adapters/universal-candles';
import { analyzeSymbol } from '@/lib/strategy-aggregator';
import { getMarketConfig } from '@/types/traditional-markets';
import { sanitizeString } from '@/lib/security';

// Changed from 'edge' to 'nodejs' for crypto module support (security sanitization)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/traditional-markets/analyze?symbol=SILVER
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // ✅ SECURITY: Sanitize inputs
    const friendlySymbolRaw = searchParams.get('symbol');
    if (!friendlySymbolRaw) {
      return NextResponse.json(
        { success: false, error: 'Symbol parameter required' },
        { status: 400 }
      );
    }

    const friendlySymbol = sanitizeString(friendlySymbolRaw).toUpperCase();
    const timeframeRaw = searchParams.get('timeframe') || '4h';
    const timeframe = sanitizeString(timeframeRaw).toLowerCase();

    console.log(`[Traditional Markets Analyze] 🔍 ${friendlySymbol} (${timeframe})`);

    // Get market config to find the data source symbol
    const config = getMarketConfig(friendlySymbol);
    if (!config) {
      return NextResponse.json(
        { success: false, error: `Unknown symbol: ${friendlySymbol}` },
        { status: 404 }
      );
    }

    const dataSymbol = config.binanceSymbol; // This is the symbol for data APIs

    // Fetch candles using universal adapter
    const candles = await getUniversalCandles(dataSymbol, timeframe, 200);

    if (!candles || candles.length < 50) {
      return NextResponse.json(
        {
          success: false,
          error: 'Insufficient historical data',
          message: `Need at least 50 candles, got ${candles?.length || 0}`,
        },
        { status: 500 }
      );
    }

    console.log(`[Traditional Markets Analyze] ✅ Fetched ${candles.length} candles`);

    // Run strategy aggregator (includes Groq AI if available)
    // NOTE: We pass the original friendly symbol for display
    const analysis = await analyzeSymbol(friendlySymbol, timeframe);

    if (!analysis) {
      return NextResponse.json(
        { success: false, error: 'Analysis failed' },
        { status: 500 }
      );
    }

    console.log(
      `[Traditional Markets Analyze] ✅ ${friendlySymbol}: ${analysis.overall} (${analysis.confidenceScore}%)`
    );

    return NextResponse.json({
      success: true,
      symbol: friendlySymbol,
      dataSource: dataSymbol,
      marketType: config.type,
      category: config.category,
      analysis: analysis,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('[Traditional Markets Analyze] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
