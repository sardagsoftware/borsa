/**
 * Trading Scenarios API
 */

import { NextRequest, NextResponse } from 'next/server';

const tradingScenarios = [
  {
    id: 'momentum_scalp',
    name: '🚀 Momentum Scalping',
    description: 'Kısa vadeli momentum fırsatlarını yakala',
    is_active: false,
    performance: {
      total_trades: 156,
      win_rate: 68.5,
      avg_return: 2.4
    }
  },
  {
    id: 'trend_following',
    name: '📈 Trend Following', 
    description: 'Güçlü trendleri takip et ve kârını maksimize et',
    is_active: false,
    performance: {
      total_trades: 89,
      win_rate: 72.1,
      avg_return: 5.8
    }
  },
  {
    id: 'ai_arbitrage',
    name: '🤖 AI Arbitraj',
    description: 'Yapay zeka destekli arbitraj fırsatları',
    is_active: false,
    performance: {
      total_trades: 234,
      win_rate: 85.2,
      avg_return: 1.2
    }
  }
];

export async function GET() {
  try {
    return NextResponse.json(tradingScenarios);
  } catch (error) {
    console.error('Trading scenarios error:', error);
    return NextResponse.json(
      { error: 'Failed to load trading scenarios' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { scenarioId, active } = await request.json();
    
    const scenario = tradingScenarios.find(s => s.id === scenarioId);
    if (scenario) {
      scenario.is_active = active;
      
      return NextResponse.json({
        success: true,
        scenario
      });
    } else {
      return NextResponse.json(
        { error: 'Scenario not found' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Toggle scenario error:', error);
    return NextResponse.json(
      { error: 'Failed to toggle scenario' },
      { status: 500 }
    );
  }
}
