/**
 * Nirvana TF Bot - Health Check API
 */

import { NextResponse } from 'next/server';

export async function GET() {
  const uptime = process.uptime();

  return NextResponse.json({
    status: 'healthy',
    service: 'Nirvana TF Bot',
    version: '2.0.0',
    engine: 'TypeScript/Next.js',
    tensorflow: 'Technical Indicators',
    uptimeSeconds: Math.floor(uptime),
    timestamp: new Date().toISOString(),
    features: {
      indicators: ['RSI', 'MACD', 'Bollinger Bands', 'EMA', 'ATR'],
      timeframes: ['15m', '1h', '4h', '1d'],
      dataSource: 'Binance Public API',
    }
  });
}