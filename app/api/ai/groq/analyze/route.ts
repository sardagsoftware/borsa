import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getGroqService } from '@/lib/ai/groq-service';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { symbol, marketData } = body;

    if (!symbol || !marketData) {
      return NextResponse.json({ 
        error: 'Symbol and market data are required' 
      }, { status: 400 });
    }

    const groqService = getGroqService();
    const analysis = await groqService.analyzeMarket(symbol, marketData);

    // Log AI analysis request for monitoring
    console.log(`Groq Market Analysis for ${symbol} by ${session.user.email}:`, {
      sentiment: analysis.sentiment,
      confidence: analysis.confidence,
      signals: analysis.signals.length
    });

    return NextResponse.json({
      success: true,
      symbol,
      analysis,
      timestamp: new Date().toISOString(),
      model: 'groq-llama-3.1-70b'
    });

  } catch (error) {
    console.error('Groq Market Analysis Error:', error);
    return NextResponse.json({ 
      error: 'Failed to analyze market data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const symbols = searchParams.get('symbols')?.split(',') || ['BTC', 'ETH'];
    const timeframe = searchParams.get('timeframe') || '1h';

    const groqService = getGroqService();
    const signals = await groqService.generateTradingSignals(symbols, timeframe);

    return NextResponse.json({
      success: true,
      symbols,
      timeframe,
      signals,
      timestamp: new Date().toISOString(),
      model: 'groq-llama-3.1-8b-instant'
    });

  } catch (error) {
    console.error('Groq Trading Signals Error:', error);
    return NextResponse.json({ 
      error: 'Failed to generate trading signals',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
