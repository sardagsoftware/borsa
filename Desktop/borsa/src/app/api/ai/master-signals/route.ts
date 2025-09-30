/**
 * Master AI Signals API
 * Orchestrates all 4 AI models: LSTM + Transformer + Random Forest + DQN RL
 * Production endpoint with comprehensive analysis
 */

import { NextRequest, NextResponse } from 'next/server';
import { getMasterOrchestrator } from '@/services/ai/MasterAIOrchestrator';
import { getDataCollector } from '@/services/market/RealTimeDataCollector';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface MasterSignalRequest {
  symbols?: string[];
  timeframe?: '1d' | '4h' | '1h' | '15m';
  minConfidence?: number;
  minConsensus?: number;
  includePerformanceMetrics?: boolean;
}

/**
 * GET /api/ai/master-signals
 * Generate master signals with all 4 AI models
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const symbolsParam = searchParams.get('symbols');
    const timeframe = (searchParams.get('timeframe') || '1h') as '1d' | '4h' | '1h' | '15m';
    const minConfidence = parseFloat(searchParams.get('minConfidence') || '0.7');
    const minConsensus = parseFloat(searchParams.get('minConsensus') || '0.6');
    const includePerformance = searchParams.get('includePerformanceMetrics') === 'true';

    console.log(`\n🎯 Master AI Signal Request`);
    console.log(`   Symbols: ${symbolsParam || 'Top 100'}`);
    console.log(`   Timeframe: ${timeframe}`);
    console.log(`   Min Confidence: ${minConfidence}`);
    console.log(`   Min Consensus: ${minConsensus}\n`);

    // Get target symbols
    const dataCollector = getDataCollector();
    let targetSymbols: string[];

    if (symbolsParam) {
      targetSymbols = symbolsParam.split(',').map(s => s.trim().toUpperCase());
    } else {
      const topCoins = dataCollector.getTopCoins();
      targetSymbols = topCoins.slice(0, 10).map(c => c.symbol); // Top 10 for demo
    }

    // Initialize Master Orchestrator
    const orchestrator = getMasterOrchestrator({
      enableLSTM: true,
      enableTransformer: true,
      enableRandomForest: true,
      enableRL: true,
      minConsensus,
    });

    // Generate signals
    const signals = [];
    const errors = [];
    const startTime = performance.now();

    for (const symbol of targetSymbols) {
      try {
        console.log(`🔍 Analyzing ${symbol}...`);

        const signal = await orchestrator.generateMasterSignal(symbol, timeframe);

        // Filter by confidence and consensus
        if (signal.confidence >= minConfidence && signal.consensus.agreement >= minConsensus) {
          signals.push({
            ...signal,
            // Remove attention weights if not needed (large data)
            models: {
              ...signal.models,
              transformer: {
                ...signal.models.transformer,
                attentionWeights: includePerformance ? signal.models.transformer.attentionWeights : undefined,
              },
            },
          });

          console.log(
            `   ✅ ${symbol}: ${signal.action} (${(signal.confidence * 100).toFixed(1)}% confidence, ` +
            `${(signal.consensus.agreement * 100).toFixed(0)}% consensus)`
          );
        } else {
          console.log(
            `   ⚠️ ${symbol}: Filtered out (confidence: ${(signal.confidence * 100).toFixed(1)}%, ` +
            `consensus: ${(signal.consensus.agreement * 100).toFixed(0)}%)`
          );
        }

      } catch (error) {
        console.error(`   ❌ ${symbol}: Error -`, error);
        errors.push({
          symbol,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const endTime = performance.now();

    // Sort by confidence
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
      averageConsensus: signals.length > 0
        ? signals.reduce((acc, s) => acc + s.consensus.agreement, 0) / signals.length
        : 0,
      totalInferenceTime: endTime - startTime,
      averageInferenceTime: signals.length > 0
        ? (endTime - startTime) / signals.length
        : 0,
      errors: errors.length,
    };

    console.log(`\n📊 Master AI Analysis Complete`);
    console.log(`   Signals generated: ${signals.length}/${targetSymbols.length}`);
    console.log(`   Average confidence: ${(stats.averageConfidence * 100).toFixed(1)}%`);
    console.log(`   Average consensus: ${(stats.averageConsensus * 100).toFixed(1)}%`);
    console.log(`   Total time: ${stats.totalInferenceTime.toFixed(2)} ms`);
    console.log(`   Avg time per symbol: ${stats.averageInferenceTime.toFixed(2)} ms\n`);

    return NextResponse.json({
      success: true,
      timeframe,
      minConfidence,
      minConsensus,
      signals,
      stats,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: Date.now(),
      metadata: {
        models: {
          lstm: { enabled: true, weight: 0.30 },
          transformer: { enabled: true, weight: 0.25 },
          randomForest: { enabled: true, weight: 0.25 },
          reinforcementLearning: { enabled: true, weight: 0.20 },
        },
        dataSource: 'Binance WebSocket + CoinGecko API',
        version: '1.0.0',
      },
    });

  } catch (error) {
    console.error('❌ Master AI Signal Generation Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ai/master-signals
 * Generate master signals with custom configuration
 */
export async function POST(request: NextRequest) {
  try {
    const body: MasterSignalRequest = await request.json();
    const {
      symbols = [],
      timeframe = '1h',
      minConfidence = 0.7,
      minConsensus = 0.6,
      includePerformanceMetrics = false,
    } = body;

    const dataCollector = getDataCollector();
    let targetSymbols: string[];

    if (symbols.length > 0) {
      targetSymbols = symbols.map(s => s.toUpperCase());
    } else {
      const topCoins = dataCollector.getTopCoins();
      targetSymbols = topCoins.slice(0, 10).map(c => c.symbol);
    }

    const orchestrator = getMasterOrchestrator({ minConsensus });
    const signals = [];
    const errors = [];
    const startTime = performance.now();

    for (const symbol of targetSymbols) {
      try {
        const signal = await orchestrator.generateMasterSignal(symbol, timeframe);

        if (signal.confidence >= minConfidence && signal.consensus.agreement >= minConsensus) {
          signals.push({
            ...signal,
            models: {
              ...signal.models,
              transformer: {
                ...signal.models.transformer,
                attentionWeights: includePerformanceMetrics ? signal.models.transformer.attentionWeights : undefined,
              },
            },
          });
        }

      } catch (error) {
        errors.push({
          symbol,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const endTime = performance.now();

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
      averageConsensus: signals.length > 0
        ? signals.reduce((acc, s) => acc + s.consensus.agreement, 0) / signals.length
        : 0,
      totalInferenceTime: endTime - startTime,
      averageInferenceTime: signals.length > 0
        ? (endTime - startTime) / signals.length
        : 0,
      errors: errors.length,
    };

    return NextResponse.json({
      success: true,
      timeframe,
      minConfidence,
      minConsensus,
      signals,
      stats,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: Date.now(),
      metadata: {
        models: {
          lstm: { enabled: true, weight: 0.30 },
          transformer: { enabled: true, weight: 0.25 },
          randomForest: { enabled: true, weight: 0.25 },
          reinforcementLearning: { enabled: true, weight: 0.20 },
        },
        dataSource: 'Binance WebSocket + CoinGecko API',
        version: '1.0.0',
      },
    });

  } catch (error) {
    console.error('❌ Master AI Signal Generation Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}