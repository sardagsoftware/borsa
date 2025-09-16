/**
 * AILYDIAN GLOBAL TRADER - Health Monitoring API
 * Real-time status of all market data sources
 */

import { NextRequest, NextResponse } from 'next/server';
import { globalMarketDataClient } from '@/lib/services/global-market-data';

export async function GET(request: NextRequest) {
  try {
    const healthStatus = globalMarketDataClient.getHealthStatus();
    const sourceStats = globalMarketDataClient.getSourceStats();

    const overallHealth = Object.values(healthStatus).every(status => status);
    const totalSources = Object.keys(healthStatus).length;
    const healthySources = Object.values(healthStatus).filter(status => status).length;

    return NextResponse.json({
      timestamp: Date.now(),
      overall: {
        status: overallHealth ? 'healthy' : 'degraded',
        healthy: healthySources,
        total: totalSources,
        uptime: `${Math.round((healthySources / totalSources) * 100)}%`
      },
      sources: sourceStats,
      health: healthStatus
    });

  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      { 
        error: 'Health check failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      },
      { status: 500 }
    );
  }
}
