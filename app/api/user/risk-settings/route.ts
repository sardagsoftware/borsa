import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Demo risk settings
    const riskSettings = {
      maxDailyLoss: 1000,
      maxPositionSize: 500,
      maxLeverage: 10,
      stopLossPercent: 2.0,
      takeProfitPercent: 5.0,
      maxPositions: 5,
      maxCorrelation: 0.7,
      aiTradingEnabled: true,
      minAiConfidence: 0.75,
    };

    return NextResponse.json(riskSettings);
  } catch (error) {
    console.error('Risk Settings GET Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate risk settings
    const validSettings = {
      maxDailyLoss: body.maxDailyLoss || 1000,
      maxPositionSize: body.maxPositionSize || 500,
      maxLeverage: Math.min(Math.max(body.maxLeverage || 10, 1), 125),
      stopLossPercent: Math.min(Math.max(body.stopLossPercent || 2.0, 0.1), 50),
      takeProfitPercent: Math.min(Math.max(body.takeProfitPercent || 5.0, 0.1), 100),
      maxPositions: Math.min(Math.max(body.maxPositions || 5, 1), 50),
      maxCorrelation: Math.min(Math.max(body.maxCorrelation || 0.7, 0.1), 1),
      aiTradingEnabled: body.aiTradingEnabled === true,
      minAiConfidence: Math.min(Math.max(body.minAiConfidence || 0.75, 0.1), 1),
    };

    // Simulate risk settings update
    console.log('Risk settings update:', validSettings);
    
    return NextResponse.json({
      ...validSettings,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Risk Settings PUT Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
