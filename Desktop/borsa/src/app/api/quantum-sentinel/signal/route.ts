/**
 * QUANTUM SENTINEL - SIGNAL GENERATION ENDPOINT
 * Generates a trading signal on-demand
 *
 * @security Authentication required
 * @method POST
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { getQuantumSentinel } from '@/services/ai/QuantumSentinelCore';
import { getMarketDataService } from '@/services/market/RealTimeMarketDataService';

export async function POST(request: NextRequest) {
  // 🔒 SECURITY: Authentication required
  const user = verifyAuth(request);
  if (!user) {
    return NextResponse.json(
      {
        success: false,
        error: 'Unauthorized',
        message: '🔒 Authentication required'
      },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { symbol = 'BTCUSDT' } = body;

    const sentinel = getQuantumSentinel();
    const marketService = getMarketDataService();

    // Fetch real-time data
    console.log(`📊 Fetching real-time data for ${symbol}...`);

    const [marketData, indicators, sentimentData] = await Promise.all([
      marketService.getMarketData(symbol),
      marketService.getTechnicalIndicators(symbol),
      marketService.getSentimentData(symbol)
    ]);

    // Generate signal
    const signal = await sentinel.generateSignal(marketData, indicators, sentimentData);

    return NextResponse.json({
      success: true,
      signal,
      marketData,
      indicators,
      sentimentData,
      timestamp: Date.now()
    });

  } catch (error: any) {
    console.error('❌ Error generating signal:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Signal generation failed',
        message: error.message || 'Failed to generate trading signal',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        timestamp: Date.now()
      },
      { status: 500 }
    );
  }
}