/**
 * Advanced AI Trading Signals API
 * Real-time BUY signals powered by TensorFlow LSTM + Transformer ensemble
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAIEngine } from '@/services/ai/AdvancedAIEngine';
import { getDataCollector } from '@/services/market/RealTimeDataCollector';

interface SignalRequest {
  symbols?: string[]; // If empty, analyze all top 100
  timeframe?: '1d' | '4h' | '1h' | '15m';
  minConfidence?: number; // Minimum confidence threshold (0-1)
  signalType?: 'BUY' | 'SELL' | 'HOLD' | 'ALL';
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/ai/advanced-signals
 * Generate AI trading signals for top coins
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const symbolsParam = searchParams.get('symbols');
    const timeframe = (searchParams.get('timeframe') || '1h') as '1d' | '4h' | '1h' | '15m';
    const minConfidence = parseFloat(searchParams.get('minConfidence') || '0.7');
    const signalType = (searchParams.get('signalType') || 'BUY') as 'BUY' | 'SELL' | 'HOLD' | 'ALL';

    // Get data collector and AI engine
    const dataCollector = getDataCollector();
    const aiEngine = getAIEngine();

    // Get target symbols
    let targetSymbols: string[];
    if (symbolsParam) {
      targetSymbols = symbolsParam.split(',').map(s => s.trim().toUpperCase());
    } else {
      // Analyze top 100 coins
      const topCoins = dataCollector.getTopCoins();
      targetSymbols = topCoins.slice(0, 100).map(c => c.symbol);
    }

    console.log(`🤖 Analyzing ${targetSymbols.length} coins with AI...`);

    // Generate signals for each symbol
    const signals = [];
    const errors = [];

    for (const symbol of targetSymbols) {
      try {
        const marketData = dataCollector.getMarketData(symbol);

        if (!marketData || !marketData.candles[timeframe] || marketData.candles[timeframe].length < 60) {
          errors.push({ symbol, error: 'Insufficient data' });
          continue;
        }

        // Convert OHLCV to MarketData format for AI engine
        const historicalData = marketData.candles[timeframe].map(candle => ({
          symbol,
          timestamp: candle.timestamp,
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
          volume: candle.volume,
        }));

        // Generate AI signal
        const signal = await aiEngine.generateSignal(symbol, historicalData, timeframe);

        // Filter by confidence and signal type
        if (signal.confidence >= minConfidence) {
          if (signalType === 'ALL' || signal.action === signalType) {
            signals.push({
              ...signal,
              currentPrice: marketData.currentPrice,
              timestamp: Date.now(),
            });
          }
        }

      } catch (error) {
        console.error(`Error analyzing ${symbol}:`, error);
        errors.push({ symbol, error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }

    // Sort by confidence (highest first)
    signals.sort((a, b) => b.confidence - a.confidence);

    // Calculate statistics
    const stats = {
      totalAnalyzed: targetSymbols.length,
      signalsGenerated: signals.length,
      buySignals: signals.filter(s => s.action === 'BUY').length,
      sellSignals: signals.filter(s => s.action === 'SELL').length,
      holdSignals: signals.filter(s => s.action === 'HOLD').length,
      averageConfidence: signals.length > 0
        ? signals.reduce((acc, s) => acc + s.confidence, 0) / signals.length
        : 0,
      errors: errors.length,
    };

    return NextResponse.json({
      success: true,
      timeframe,
      minConfidence,
      signals,
      stats,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: Date.now(),
    });

  } catch (error) {
    console.error('❌ AI Signal Generation Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ai/advanced-signals
 * Generate signals for specific symbols with custom parameters
 */
export async function POST(request: NextRequest) {
  try {
    const body: SignalRequest = await request.json();
    const {
      symbols = [],
      timeframe = '1h',
      minConfidence = 0.7,
      signalType = 'BUY',
    } = body;

    const dataCollector = getDataCollector();
    const aiEngine = getAIEngine();

    // Get target symbols
    let targetSymbols: string[];
    if (symbols.length > 0) {
      targetSymbols = symbols.map(s => s.toUpperCase());
    } else {
      const topCoins = dataCollector.getTopCoins();
      targetSymbols = topCoins.slice(0, 100).map(c => c.symbol);
    }

    const signals = [];
    const errors = [];

    for (const symbol of targetSymbols) {
      try {
        const marketData = dataCollector.getMarketData(symbol);

        if (!marketData || !marketData.candles[timeframe] || marketData.candles[timeframe].length < 60) {
          errors.push({ symbol, error: 'Insufficient data' });
          continue;
        }

        const historicalData = marketData.candles[timeframe].map(candle => ({
          symbol,
          timestamp: candle.timestamp,
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
          volume: candle.volume,
        }));

        const signal = await aiEngine.generateSignal(symbol, historicalData, timeframe);

        if (signal.confidence >= minConfidence) {
          if (signalType === 'ALL' || signal.action === signalType) {
            signals.push({
              ...signal,
              currentPrice: marketData.currentPrice,
              timestamp: Date.now(),
            });
          }
        }

      } catch (error) {
        errors.push({
          symbol,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    signals.sort((a, b) => b.confidence - a.confidence);

    const stats = {
      totalAnalyzed: targetSymbols.length,
      signalsGenerated: signals.length,
      buySignals: signals.filter(s => s.action === 'BUY').length,
      sellSignals: signals.filter(s => s.action === 'SELL').length,
      holdSignals: signals.filter(s => s.action === 'HOLD').length,
      averageConfidence: signals.length > 0
        ? signals.reduce((acc, s) => acc + s.confidence, 0) / signals.length
        : 0,
      errors: errors.length,
    };

    return NextResponse.json({
      success: true,
      timeframe,
      minConfidence,
      signals,
      stats,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: Date.now(),
    });

  } catch (error) {
    console.error('❌ AI Signal Generation Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}