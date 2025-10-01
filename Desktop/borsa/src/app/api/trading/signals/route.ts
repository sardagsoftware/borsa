/**
 * TRADING SIGNALS GENERATOR API
 * Generate BUY/SELL/HOLD signals with confidence scores
 * GET /api/trading/signals?symbol=BTC
 * GET /api/trading/signals?top=10 (for Top N coins)
 */

import { NextRequest, NextResponse } from 'next/server';
import { masterIntegrationService } from '@/services/integration/MasterIntegrationService';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const top = searchParams.get('top');

    // Single symbol signal
    if (symbol) {
      console.log(`🎯 Generating signal for ${symbol}`);

      const signal = await masterIntegrationService.generateTradingSignal(symbol);

      if (!signal) {
        return NextResponse.json(
          { success: false, error: `Failed to generate signal for ${symbol}` },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        symbol,
        signal,
        timestamp: Date.now(),
      });
    }

    // Top N coins signals
    if (top) {
      const limit = Math.min(parseInt(top), 50);
      console.log(`🎯 Generating signals for Top ${limit} coins`);

      const startTime = Date.now();

      // Get Top 100 comprehensive data
      const comprehensiveData = await masterIntegrationService.getTop100ComprehensiveData('1h', limit);

      // Generate signals for each
      const signalsPromises = comprehensiveData.map(async (data) => {
        try {
          const signal = await masterIntegrationService.generateTradingSignal(data.coin.symbol);
          return {
            symbol: data.coin.symbol,
            name: data.coin.name,
            price: data.coin.price,
            signal,
          };
        } catch (error) {
          return null;
        }
      });

      const signals = (await Promise.all(signalsPromises)).filter(s => s !== null);

      const processingTime = Date.now() - startTime;

      console.log(`✅ Generated ${signals.length} signals in ${processingTime}ms`);

      // Sort by confidence (highest first)
      signals.sort((a, b) => (b?.signal?.confidence || 0) - (a?.signal?.confidence || 0));

      return NextResponse.json({
        success: true,
        limit,
        count: signals.length,
        signals,
        processingTime,
        timestamp: Date.now(),
      });
    }

    return NextResponse.json(
      { success: false, error: 'Either symbol or top parameter is required' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('❌ Error in signals API:', error.message);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
