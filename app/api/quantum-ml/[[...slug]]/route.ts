/**
 * AILYDIAN GLOBAL TRADER - Quantum-ML API Integration
 * Portfolio optimization and volatility prediction with quantum algorithms
 * © 2025 Emrah Şardağ - Ultra Pro Edition
 */

import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

const QUANTUM_ML_SERVICE_URL = process.env.QUANTUM_ML_SERVICE_URL || 'http://localhost:8001';

interface PortfolioOptimizationRequest {
  assets: Array<{
    symbol: string;
    prices: number[];
    timestamp: string[];
  }>;
  objective?: 'sharpe' | 'risk' | 'return' | 'sortino';
  riskTolerance?: number;
  quantumEnhanced?: boolean;
}

interface VolatilityPredictionRequest {
  symbol: string;
  prices: number[];
  timestamp: string[];
  predictionHorizon?: number;
  quantumFeatures?: boolean;
  confidenceIntervals?: boolean;
}

async function callQuantumMLService(endpoint: string, data: any): Promise<any> {
  try {
    const response = await fetch(`${QUANTUM_ML_SERVICE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Quantum-ML service error: ${response.status} - ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Quantum-ML service call failed for ${endpoint}:`, error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  const { pathname } = new URL(request.url);
  
  try {
    const body = await request.json();

    // Portfolio Optimization
    if (pathname.endsWith('/portfolio/optimize')) {
      const { assets, objective = 'sharpe', riskTolerance = 0.5, quantumEnhanced = true }: PortfolioOptimizationRequest = body;

      if (!assets || assets.length < 2) {
        return NextResponse.json(
          { error: 'At least 2 assets are required for portfolio optimization' },
          { status: 400 }
        );
      }

      // Validate asset data
      for (const asset of assets) {
        if (!asset.symbol || !asset.prices || asset.prices.length < 30) {
          return NextResponse.json(
            { error: `Invalid data for asset ${asset.symbol}. At least 30 price points required.` },
            { status: 400 }
          );
        }
      }

      const optimizationRequest = {
        assets: assets.map(asset => ({
          symbol: asset.symbol,
          prices: asset.prices,
          timestamp: asset.timestamp || Array.from({ length: asset.prices.length }, (_, i) => 
            new Date(Date.now() - (asset.prices.length - i - 1) * 24 * 60 * 60 * 1000).toISOString()
          )
        })),
        objective,
        constraints: {},
        risk_tolerance: riskTolerance,
        quantum_enhanced: quantumEnhanced
      };

      const result = await callQuantumMLService('/optimize_portfolio', optimizationRequest);
      
      return NextResponse.json({
        success: true,
        data: result,
        message: 'Portfolio optimization completed successfully'
      });
    }

    // Volatility Prediction
    if (pathname.endsWith('/volatility/predict')) {
      const { 
        symbol, 
        prices, 
        timestamp,
        predictionHorizon = 30, 
        quantumFeatures = true, 
        confidenceIntervals = true 
      }: VolatilityPredictionRequest = body;

      if (!symbol || !prices || prices.length < 30) {
        return NextResponse.json(
          { error: 'Symbol and at least 30 price points are required for volatility prediction' },
          { status: 400 }
        );
      }

      const predictionRequest = {
        asset: {
          symbol,
          prices,
          timestamp: timestamp || Array.from({ length: prices.length }, (_, i) => 
            new Date(Date.now() - (prices.length - i - 1) * 24 * 60 * 60 * 1000).toISOString()
          )
        },
        prediction_horizon: predictionHorizon,
        quantum_features: quantumFeatures,
        confidence_intervals: confidenceIntervals
      };

      const result = await callQuantumMLService('/predict_volatility', predictionRequest);
      
      return NextResponse.json({
        success: true,
        data: result,
        message: 'Volatility prediction completed successfully'
      });
    }

    // Quantum Status Check
    if (pathname.endsWith('/quantum/status')) {
      try {
        const statusResponse = await fetch(`${QUANTUM_ML_SERVICE_URL}/quantum_status`);
        
        if (statusResponse.ok) {
          const status = await statusResponse.json();
          return NextResponse.json({
            success: true,
            data: status,
            message: 'Quantum-ML service status retrieved successfully'
          });
        } else {
          return NextResponse.json({
            success: false,
            data: {
              quantum_available: false,
              service_status: 'offline',
              error: 'Service not responding'
            },
            message: 'Quantum-ML service is offline'
          });
        }
      } catch (error) {
        return NextResponse.json({
          success: false,
          data: {
            quantum_available: false,
            service_status: 'error',
            error: error.message
          },
          message: 'Failed to connect to Quantum-ML service'
        });
      }
    }

    // Health Check
    if (pathname.endsWith('/health')) {
      try {
        const healthResponse = await fetch(`${QUANTUM_ML_SERVICE_URL}/`);
        
        if (healthResponse.ok) {
          const health = await healthResponse.json();
          return NextResponse.json({
            success: true,
            data: {
              ...health,
              next_js_integration: 'healthy',
              integration_timestamp: new Date().toISOString()
            },
            message: 'Quantum-ML service is healthy'
          });
        } else {
          throw new Error('Service health check failed');
        }
      } catch (error) {
        return NextResponse.json({
          success: false,
          data: {
            service: 'Quantum-ML Microservice',
            status: 'unhealthy',
            error: error.message,
            next_js_integration: 'error',
            integration_timestamp: new Date().toISOString()
          },
          message: 'Quantum-ML service health check failed'
        }, { status: 503 });
      }
    }

    return NextResponse.json(
      { error: 'Invalid endpoint. Supported: /portfolio/optimize, /volatility/predict, /quantum/status, /health' },
      { status: 404 }
    );

  } catch (error) {
    console.error('Quantum-ML API error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Quantum-ML service error',
        message: error.message || 'An unexpected error occurred'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { pathname } = new URL(request.url);

  // Health check
  if (pathname.endsWith('/health')) {
    try {
      const healthResponse = await fetch(`${QUANTUM_ML_SERVICE_URL}/`);
      
      if (healthResponse.ok) {
        const health = await healthResponse.json();
        return NextResponse.json({
          success: true,
          data: health,
          message: 'Quantum-ML service is healthy'
        });
      } else {
        throw new Error('Service not responding');
      }
    } catch (error) {
      return NextResponse.json({
        success: false,
        data: {
          service: 'Quantum-ML Microservice',
          status: 'offline',
          error: error.message
        },
        message: 'Quantum-ML service is offline'
      }, { status: 503 });
    }
  }

  // Quantum status
  if (pathname.endsWith('/quantum/status')) {
    try {
      const statusResponse = await fetch(`${QUANTUM_ML_SERVICE_URL}/quantum_status`);
      
      if (statusResponse.ok) {
        const status = await statusResponse.json();
        return NextResponse.json({
          success: true,
          data: status,
          message: 'Quantum status retrieved successfully'
        });
      } else {
        throw new Error('Status endpoint not available');
      }
    } catch (error) {
      return NextResponse.json({
        success: false,
        data: {
          quantum_available: false,
          error: error.message
        },
        message: 'Failed to retrieve quantum status'
      }, { status: 503 });
    }
  }

  return NextResponse.json(
    { 
      service: 'AILYDIAN Quantum-ML API',
      endpoints: {
        'POST /portfolio/optimize': 'Portfolio optimization with quantum algorithms',
        'POST /volatility/predict': 'Volatility prediction with quantum features',
        'GET /quantum/status': 'Quantum computing capabilities status',
        'GET /health': 'Service health check'
      },
      documentation: 'https://ailydian.com/docs/quantum-ml'
    }
  );
}
