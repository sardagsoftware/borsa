/**
 * BACKGROUND SCANNER API - STRONG BUY SIGNALS
 *
 * Scans all 570 USDT perpetual futures for STRONG_BUY signals
 * Returns list of coins with active strong buy signals
 * Used for browser notifications
 */

import { NextResponse } from 'next/server';
import { analyzeSymbol } from '@/lib/strategy-aggregator';
import { getScannerLimiter, getClientIP } from '@/lib/rate-limiter';
import { sanitizeNumber, sanitizeString } from '@/lib/security';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 seconds max

interface SignalResult {
  symbol: string;
  signal: 'STRONG_BUY' | 'BUY';
  confidence: number;
  strategies: number;
  price: number;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  timestamp: number;
}

export async function GET(request: Request) {
  try {
    // Rate limiting check
    const clientIP = getClientIP(request);
    const limiter = getScannerLimiter();
    const { allowed, remaining, resetAt, retryAfter } = limiter.check(clientIP);

    // If rate limit exceeded, return 429
    if (!allowed) {
      console.warn(`[Scanner API] Rate limit exceeded for IP: ${clientIP}`);

      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded. Please try again later.',
          retryAfter
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': new Date(resetAt).toISOString(),
            'Retry-After': retryAfter?.toString() || '300'
          }
        }
      );
    }

    const { searchParams } = new URL(request.url);

    // ✅ SECURITY: Sanitize and validate inputs
    const limitRaw = searchParams.get('limit') || '20';
    const limit = sanitizeNumber(limitRaw, 1, 100, 20); // Min: 1, Max: 100, Default: 20

    const signalTypeRaw = searchParams.get('type') || 'STRONG_BUY';
    const signalType = sanitizeString(signalTypeRaw).toUpperCase() === 'BUY' ? 'BUY' : 'STRONG_BUY';

    console.log(`[Scanner API] 🔍 Scanning for ${signalType} signals (limit: ${limit})... [IP: ${clientIP}, Remaining: ${remaining}]`);

    // Get market overview to get top coins by volume
    const marketResponse = await fetch('https://fapi.binance.com/fapi/v1/ticker/24hr');

    if (!marketResponse.ok) {
      throw new Error('Failed to fetch market data');
    }

    const allTickers = await marketResponse.json();

    // Filter USDT perpetuals and sort by volume
    const usdtTickers = allTickers
      .filter((t: any) => t.symbol.endsWith('USDT') && !t.symbol.includes('_'))
      .sort((a: any, b: any) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume))
      .slice(0, limit); // Only scan top N coins

    console.log(`[Scanner API] Analyzing ${usdtTickers.length} coins...`);

    const signals: SignalResult[] = [];
    let scannedCount = 0;

    // Scan each coin
    for (const ticker of usdtTickers) {
      try {
        scannedCount++;

        // Quick analysis
        const analysis = await analyzeSymbol(ticker.symbol, '4h');

        if (!analysis) continue;

        // Check if signal matches requested type
        const matchesType =
          signalType === 'STRONG_BUY'
            ? analysis.overall === 'STRONG_BUY'
            : analysis.overall === 'STRONG_BUY' || analysis.overall === 'BUY';

        if (matchesType) {
          signals.push({
            symbol: ticker.symbol,
            signal: analysis.overall as 'STRONG_BUY' | 'BUY',
            confidence: analysis.finalConfidence || analysis.confidenceScore,
            strategies: analysis.agreementCount,
            price: parseFloat(ticker.lastPrice),
            entryPrice: analysis.entryPrice,
            stopLoss: analysis.suggestedStopLoss,
            takeProfit: analysis.suggestedTakeProfit,
            timestamp: Date.now(),
          });

          console.log(
            `[Scanner API] ✅ ${ticker.symbol}: ${analysis.overall} (${analysis.agreementCount}/6 strategies, ${(analysis.finalConfidence || analysis.confidenceScore).toFixed(1)}%)`
          );
        }

        // Rate limiting: 100ms between requests
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`[Scanner API] Error analyzing ${ticker.symbol}:`, error);
        // Continue scanning even if one fails
      }
    }

    console.log(
      `[Scanner API] ✅ Scan complete: ${signals.length} signals found from ${scannedCount} coins`
    );

    return NextResponse.json(
      {
        success: true,
        scanned: scannedCount,
        found: signals.length,
        signals,
        timestamp: Date.now(),
        type: signalType,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600', // 5 min cache
          'X-RateLimit-Limit': '10',
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': new Date(resetAt).toISOString(),
        },
      }
    );
  } catch (error) {
    console.error('[Scanner API] Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to scan for signals',
        signals: [],
      },
      {
        status: 500,
      }
    );
  }
}
