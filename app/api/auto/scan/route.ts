// POST /api/auto/scan - Multi-symbol technical analysis scan
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { featureEngine } from '@/lib/auto/features';
import { microAnalyzer } from '@/lib/auto/micro';
import { regimeDetector } from '@/lib/auto/regimes';
import { leadLagAnalyzer } from '@/lib/auto/leadlag';
import { squeezeDetector } from '@/lib/auto/squeeze';
import { ensembleEngine } from '@/lib/auto/ensemble';

interface ScanRequest {
  symbols: string[];
  timeframe: string; // 1m, 5m, 15m, 1h, 4h, 1d
  includeLeadLag?: boolean;
}

interface ScanResult {
  symbol: string;
  timestamp: string;
  features?: any;
  micro?: any;
  regime?: any;
  leadLag?: any;
  squeeze?: any;
  signal?: any;
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body: ScanRequest = await request.json();
    const { symbols, timeframe, includeLeadLag = true } = body;

    // Validate input
    if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
      return NextResponse.json(
        { error: 'Symbols array is required' },
        { status: 400 }
      );
    }

    if (symbols.length > 50) {
      return NextResponse.json(
        { error: 'Maximum 50 symbols allowed per scan' },
        { status: 400 }
      );
    }

    const validTimeframes = ['1m', '5m', '15m', '1h', '4h', '1d'];
    if (!validTimeframes.includes(timeframe)) {
      return NextResponse.json(
        { error: 'Invalid timeframe' },
        { status: 400 }
      );
    }

    // Scan results
    const results: ScanResult[] = [];
    
    // Get lead assets data first (BTC/ETH)
    let btcData: any = null;
    let ethData: any = null;
    
    if (includeLeadLag) {
      try {
        btcData = await getSymbolData('BTCUSDT', timeframe);
        ethData = await getSymbolData('ETHUSDT', timeframe);
      } catch (error) {
        console.warn('Failed to fetch lead asset data:', error);
      }
    }

    // Process each symbol
    for (const symbol of symbols) {
      try {
        // Get price data (mock for now - replace with real data source)
        const priceData = await getSymbolData(symbol, timeframe);
        
        if (!priceData || priceData.length < 100) {
          results.push({
            symbol,
            timestamp: new Date().toISOString(),
            error: 'Insufficient data'
          });
          continue;
        }

        // Calculate features
        const features = featureEngine.calculateFeatures(priceData, timeframe);
        if (!features) {
          results.push({
            symbol,
            timestamp: new Date().toISOString(),
            error: 'Feature calculation failed'
          });
          continue;
        }

        // Micro structure analysis
        const micro = microAnalyzer.analyzeMicroStructure(priceData.slice(-20));

        // Regime detection
        const regime = regimeDetector.detectRegime(priceData, features, micro);

        // Lead-lag analysis
        let leadLag = null;
        if (includeLeadLag && btcData && ethData) {
          const btcFeatures = featureEngine.calculateFeatures(btcData, timeframe);
          const ethFeatures = featureEngine.calculateFeatures(ethData, timeframe);
          
          if (btcFeatures && ethFeatures) {
            const btcRegime = regimeDetector.detectRegime(btcData, btcFeatures, micro);
            const ethRegime = regimeDetector.detectRegime(ethData, ethFeatures, micro);
            
            leadLag = leadLagAnalyzer.analyzeLead(
              symbol, priceData, features, regime.regime,
              { symbol: 'BTCUSDT', data: btcData, features: btcFeatures, regime: btcRegime.regime },
              { symbol: 'ETHUSDT', data: ethData, features: ethFeatures, regime: ethRegime.regime }
            );
          }
        }

        // Squeeze analysis
        const squeeze = squeezeDetector.analyzeSqueezeAndBreakout(
          symbol, priceData, features, micro
        );

        // Composite signal (only if we have all components)
        let signal = null;
        if (leadLag) {
          signal = ensembleEngine.generateCompositeSignal(
            symbol, priceData, features, micro, regime, leadLag, squeeze
          );
        }

        results.push({
          symbol,
          timestamp: new Date().toISOString(),
          features: {
            trend: features.trendStrength,
            momentum: features.momentumScore,
            meanReversion: features.meanReversionScore,
            volatility: features.volatilityScore,
            rsi: features.rsi,
            macd: features.macdHistogram,
            bbPercentB: features.bbPercentB,
            adx: features.adx
          },
          micro: {
            microTrend: micro.microTrendScore,
            velocityScore: micro.velocityScore,
            momentumShift: micro.momentumShift,
            volBurst: micro.volBurstScore,
            priceJumps: micro.priceJumpScore
          },
          regime: {
            regime: regime.regime,
            confidence: regime.confidence,
            strength: regime.strength,
            duration: regime.duration,
            transition: regime.transition
          },
          leadLag: leadLag ? {
            btcBeta: leadLag.btcBeta,
            ethBeta: leadLag.ethBeta,
            riskOnOff: leadLag.riskOnOff,
            divergenceRisk: leadLag.divergenceRisk
          } : undefined,
          squeeze: {
            isSqueezing: squeeze.isSqueezing,
            intensity: squeeze.squeezeIntensity,
            preBreakout: squeeze.preBreakoutScore,
            direction: squeeze.breakoutDirection,
            target: squeeze.breakoutTarget
          },
          signal: signal ? {
            score: signal.score,
            confidence: signal.confidence,
            quality: signal.quality,
            dominantStrategy: signal.dominantStrategy
          } : undefined
        });

      } catch (error) {
        console.error(`Scan error for ${symbol}:`, error);
        results.push({
          symbol,
          timestamp: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        timeframe,
        scannedAt: new Date().toISOString(),
        results,
        summary: {
          total: symbols.length,
          successful: results.filter(r => !r.error).length,
          failed: results.filter(r => r.error).length
        }
      }
    });

  } catch (error) {
    console.error('Scan API error:', error);
    return NextResponse.json(
      { error: 'Scan failed' },
      { status: 500 }
    );
  }
}

// Mock function - replace with real data source
async function getSymbolData(symbol: string, timeframe: string) {
  // This would normally fetch from Binance API or database
  // For now, return mock data
  const data = [];
  const basePrice = 50000; // Mock BTC price
  const now = Date.now();
  
  for (let i = 100; i >= 0; i--) {
    const timestamp = now - (i * 60 * 1000); // 1 minute intervals
    const price = basePrice + (Math.random() - 0.5) * 1000;
    const volume = 1000 + Math.random() * 2000;
    
    data.push({
      timestamp,
      open: price,
      high: price * 1.002,
      low: price * 0.998,
      close: price,
      volume
    });
  }
  
  return data;
}
