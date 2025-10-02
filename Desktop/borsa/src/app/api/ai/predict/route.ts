import { NextRequest, NextResponse } from 'next/server';

// AI Models servisi (Python Flask)
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5003';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { symbol, timeframe = '1h', model = 'ensemble' } = body;

    if (!symbol) {
      return NextResponse.json(
        { success: false, error: 'Symbol is required' },
        { status: 400 }
      );
    }

    // Python AI service'e istek gönder
    const response = await fetch(`${AI_SERVICE_URL}/predict/single`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        symbol,
        timeframe,
        model,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.error || 'AI prediction failed' },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      prediction: data.prediction,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('❌ AI Prediction Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}
