/**
 * Market Insights API - AI Generated Market Analysis
 */

import { NextRequest, NextResponse } from 'next/server';

let marketInsights = [
  {
    symbol: 'BTC',
    action: 'BUY',
    confidence: 78,
    reasoning: 'RSI 30 seviyesinde, hacim artışı var, MA20 destek seviyesi tuttu',
    risk_level: 'MEDIUM'
  },
  {
    symbol: 'ETH', 
    action: 'HOLD',
    confidence: 65,
    reasoning: 'Yatay seyirde, büyük hareket bekleniyor, pozisyon almak için erken',
    risk_level: 'LOW'
  },
  {
    symbol: 'SOL',
    action: 'SELL',
    confidence: 82,
    reasoning: 'RSI 75 üzerinde, hacim azalışı, direnç seviyesinde satış baskısı',
    risk_level: 'HIGH'
  }
];

export async function GET() {
  try {
    // Simulate real-time updates
    updateMarketInsights();
    
    return NextResponse.json(marketInsights);
  } catch (error) {
    console.error('Market insights error:', error);
    return NextResponse.json(
      { error: 'Failed to load market insights' },
      { status: 500 }
    );
  }
}

function updateMarketInsights() {
  marketInsights = marketInsights.map(insight => ({
    ...insight,
    confidence: Math.max(50, Math.min(90, insight.confidence + (Math.random() - 0.5) * 10)),
    // Occasionally change action based on confidence
    action: insight.confidence > 75 ? (Math.random() > 0.5 ? 'BUY' : 'SELL') : 'HOLD'
  }));
  
  // Randomly update risk levels
  marketInsights.forEach(insight => {
    if (Math.random() > 0.8) {
      const risks = ['LOW', 'MEDIUM', 'HIGH'];
      insight.risk_level = risks[Math.floor(Math.random() * risks.length)];
    }
  });
}
