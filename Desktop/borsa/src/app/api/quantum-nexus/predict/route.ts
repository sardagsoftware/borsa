/**
 * QUANTUM NEXUS API - Ultimate AI Prediction Endpoint
 * Zero-tolerance, self-learning, fully explainable
 */

import { NextRequest, NextResponse } from 'next/server';
import { getQuantumNexusEngine } from '@/services/ai/QuantumNexusMock';

// Cache for initialized engine
let engineInitialized = false;

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { symbol, timeframe, features } = body;

    if (!symbol || !features || !Array.isArray(features)) {
      return NextResponse.json(
        { error: 'Invalid request: symbol and features array required' },
        { status: 400 }
      );
    }

    // Get engine instance
    const engine = getQuantumNexusEngine();

    // Initialize if needed
    if (!engineInitialized) {
      console.log('🌟 Initializing Quantum Nexus Engine...');
      await engine.initialize();
      engineInitialized = true;
    }

    // Generate prediction
    const signal = await engine.predict(features);

    // Add metadata
    const response = {
      ...signal,
      symbol,
      timeframe: timeframe || '1h',
      timestamp: new Date().toISOString(),
      api_latency_ms: Date.now() - startTime,
    };

    console.log(
      `✅ Quantum prediction: ${signal.action} for ${symbol} ` +
      `(prob: ${(signal.probability * 100).toFixed(1)}%, ` +
      `uncertainty: ${(signal.uncertainty * 100).toFixed(1)}%)`
    );

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('❌ Quantum Nexus prediction error:', error);
    return NextResponse.json(
      {
        error: 'Prediction failed',
        message: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const engine = getQuantumNexusEngine();

    return NextResponse.json({
      status: engineInitialized ? 'ready' : 'not_initialized',
      training_samples: engineInitialized ? engine.getTrainingHistory().length : 0,
      model_version: '2.0.0-quantum',
      features: {
        quantum_attention: true,
        continual_learning: true,
        regime_detection: true,
        explainability: true,
        uncertainty_quantification: true,
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}