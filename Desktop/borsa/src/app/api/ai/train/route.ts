/**
 * Model Training API
 * Endpoint for triggering model training and monitoring progress
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTrainingPipeline } from '@/services/ai/ModelTrainingPipeline';
import { getDataCollector } from '@/services/market/RealTimeDataCollector';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes timeout

interface TrainRequest {
  modelType: 'lstm' | 'transformer' | 'randomForest' | 'all';
  symbols?: string[];
  timeframe?: '1d' | '4h' | '1h' | '15m';
  epochs?: number;
  batchSize?: number;
  validationSplit?: number;
  crossValidate?: boolean;
  folds?: number;
}

/**
 * POST /api/ai/train
 * Trigger model training
 */
export async function POST(request: NextRequest) {
  try {
    const body: TrainRequest = await request.json();
    const {
      modelType = 'all',
      symbols = [],
      timeframe = '1h',
      epochs = 50,
      batchSize = 32,
      validationSplit = 0.2,
      crossValidate = false,
      folds = 5,
    } = body;

    console.log('🎓 Training request received:', {
      modelType,
      symbols: symbols.length || 'all',
      timeframe,
      epochs,
    });

    // Get training pipeline
    const pipeline = getTrainingPipeline({
      epochs,
      batchSize,
      validationSplit,
    });

    // Get data collector
    const dataCollector = getDataCollector();

    // Prepare training data
    const targetSymbols = symbols.length > 0 ? symbols : dataCollector.getTopCoins().slice(0, 20).map(c => c.symbol);

    const rawData = {
      candles: [] as any[],
      labels: [] as Array<'BUY' | 'SELL' | 'HOLD'>,
    };

    // Collect historical data for training
    for (const symbol of targetSymbols) {
      const marketData = dataCollector.getMarketData(symbol);
      if (!marketData || !marketData.candles[timeframe]) continue;

      const candles = marketData.candles[timeframe];
      for (const candle of candles) {
        rawData.candles.push({
          symbol,
          timestamp: candle.timestamp,
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
          volume: candle.volume,
        });

        // Generate label based on price movement (simplified)
        const nextIndex = candles.indexOf(candle) + 1;
        if (nextIndex < candles.length) {
          const priceChange = (candles[nextIndex].close - candle.close) / candle.close;
          if (priceChange > 0.02) {
            rawData.labels.push('BUY');
          } else if (priceChange < -0.02) {
            rawData.labels.push('SELL');
          } else {
            rawData.labels.push('HOLD');
          }
        } else {
          rawData.labels.push('HOLD');
        }
      }
    }

    if (rawData.candles.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Insufficient training data',
        },
        { status: 400 }
      );
    }

    // Prepare dataset
    const dataset = pipeline.prepareDataset(rawData);

    // Cross-validation if requested
    if (crossValidate) {
      const cvResult = await pipeline.crossValidate(dataset, folds);

      return NextResponse.json({
        success: true,
        type: 'cross-validation',
        result: cvResult,
        dataset: {
          samples: dataset.features.length,
          symbols: dataset.metadata?.symbols.length || 0,
          timeframe: dataset.metadata?.timeframe,
        },
      });
    }

    // Train models
    let trainingResults;

    if (modelType === 'all') {
      trainingResults = await pipeline.trainAll(dataset);
    } else if (modelType === 'lstm') {
      trainingResults = { lstm: await pipeline.trainLSTM(dataset) };
    } else if (modelType === 'transformer') {
      trainingResults = { transformer: await pipeline.trainTransformer(dataset) };
    } else if (modelType === 'randomForest') {
      trainingResults = { randomForest: await pipeline.trainRandomForest(dataset) };
    }

    return NextResponse.json({
      success: true,
      type: 'training',
      results: trainingResults,
      dataset: {
        samples: dataset.features.length,
        symbols: dataset.metadata?.symbols.length || 0,
        timeframe: dataset.metadata?.timeframe,
        dateRange: {
          start: dataset.metadata?.startDate,
          end: dataset.metadata?.endDate,
        },
      },
      timestamp: Date.now(),
    });

  } catch (error) {
    console.error('❌ Training error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Training failed',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ai/train
 * Get training status and history
 */
export async function GET(request: NextRequest) {
  try {
    // Mock training history (in production, store in database)
    const history = [
      {
        id: 'train_20250101_001',
        timestamp: Date.now() - 86400000,
        modelType: 'all',
        status: 'completed',
        results: {
          lstm: { accuracy: 0.89, trainTime: 245.5 },
          transformer: { accuracy: 0.87, trainTime: 312.8 },
          randomForest: { accuracy: 0.85, trainTime: 78.3 },
        },
      },
      {
        id: 'train_20250102_001',
        timestamp: Date.now() - 43200000,
        modelType: 'lstm',
        status: 'completed',
        results: {
          lstm: { accuracy: 0.91, trainTime: 198.2 },
        },
      },
    ];

    return NextResponse.json({
      success: true,
      history,
      totalTrainingSessions: history.length,
      lastTraining: history[history.length - 1],
    });

  } catch (error) {
    console.error('❌ Training history error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get training history',
      },
      { status: 500 }
    );
  }
}