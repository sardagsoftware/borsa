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
    const { type, data } = body;

    if (!type || !data) {
      return NextResponse.json({ 
        error: 'Security scan type and data are required' 
      }, { status: 400 });
    }

    const groqService = getGroqService();
    
    let analysis;
    switch (type) {
      case 'transaction':
        analysis = await groqService.analyzeSecurityThreats([data], ['suspicious_activity']);
        break;
      case 'portfolio':
        analysis = await groqService.assessRisk([data], ['high_risk']);
        break;
      default:
        return NextResponse.json({ 
          error: 'Invalid security scan type. Use: transaction, portfolio' 
        }, { status: 400 });
    }

    // Log security analysis for monitoring
    console.log(`Groq Security Analysis (${type}) for ${session.user.email}:`, {
      riskLevel: analysis.riskLevel || 'unknown',
      threatsDetected: Array.isArray(analysis.threats) ? analysis.threats.length : 0,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      type,
      analysis,
      timestamp: new Date().toISOString(),
      model: 'groq-llama-3.1-70b'
    });

  } catch (error) {
    console.error('Groq Security Analysis Error:', error);
    return NextResponse.json({ 
      error: 'Failed to perform security analysis',
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
    const exchanges = searchParams.get('exchanges')?.split(',') || ['binance', 'coinbase'];
    const pairs = searchParams.get('pairs')?.split(',') || ['BTC/USDT', 'ETH/USDT'];

    const groqService = getGroqService();
    const opportunities = await groqService.detectArbitrageOpportunities(exchanges, pairs);

    return NextResponse.json({
      success: true,
      exchanges,
      pairs,
      opportunities,
      timestamp: new Date().toISOString(),
      model: 'groq-llama-3.1-8b-instant'
    });

  } catch (error) {
    console.error('Groq Arbitrage Analysis Error:', error);
    return NextResponse.json({ 
      error: 'Failed to find arbitrage opportunities',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
