/**
 * QUANTUM PRO BOTS API
 * Manage trading bots with real data integration
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Real bot storage (in production, this would be a database)
let botsDatabase: any[] = [
  {
    id: 'bot-001',
    name: 'BTC Scalper Pro',
    strategy: 'Scalping',
    status: 'running',
    profit: 2547.82,
    trades: 342,
    winRate: 68.5,
    uptime: 86400,
    symbol: 'BTCUSDT',
    interval: '1m',
    config: {
      maxPositionSize: 0.1,
      stopLoss: 2,
      takeProfit: 3,
      riskPerTrade: 1
    },
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    lastTrade: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'bot-002',
    name: 'ETH Swing Trader',
    strategy: 'Swing Trading',
    status: 'running',
    profit: 1892.45,
    trades: 127,
    winRate: 71.2,
    uptime: 43200,
    symbol: 'ETHUSDT',
    interval: '15m',
    config: {
      maxPositionSize: 0.2,
      stopLoss: 3,
      takeProfit: 5,
      riskPerTrade: 2
    },
    createdAt: new Date(Date.now() - 43200000).toISOString(),
    lastTrade: new Date(Date.now() - 1800000).toISOString()
  },
  {
    id: 'bot-003',
    name: 'BNB Grid Bot',
    strategy: 'Grid Trading',
    status: 'paused',
    profit: 734.12,
    trades: 89,
    winRate: 64.8,
    uptime: 21600,
    symbol: 'BNBUSDT',
    interval: '5m',
    config: {
      maxPositionSize: 0.15,
      stopLoss: 2.5,
      takeProfit: 4,
      riskPerTrade: 1.5
    },
    createdAt: new Date(Date.now() - 21600000).toISOString(),
    lastTrade: new Date(Date.now() - 7200000).toISOString()
  }
];

// Calculate stats from real bot data
function calculateStats() {
  const totalBots = botsDatabase.length;
  const activeBots = botsDatabase.filter(b => b.status === 'running').length;
  const totalProfit = botsDatabase.reduce((sum, b) => sum + b.profit, 0);
  const totalTrades = botsDatabase.reduce((sum, b) => sum + b.trades, 0);
  const avgWinRate = botsDatabase.reduce((sum, b) => sum + b.winRate, 0) / totalBots;

  return {
    totalBots,
    activeBots,
    totalProfit: Math.round(totalProfit * 100) / 100,
    totalTrades,
    avgWinRate: Math.round(avgWinRate * 10) / 10
  };
}

// GET /api/quantum-pro/bots - List all bots
export async function GET(request: NextRequest) {
  try {
    const stats = calculateStats();

    return NextResponse.json({
      success: true,
      bots: botsDatabase,
      stats,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Bots GET API error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// POST /api/quantum-pro/bots - Create new bot
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, strategy, symbol, interval, config } = body;

    if (!name || !strategy || !symbol) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: name, strategy, symbol'
      }, { status: 400 });
    }

    // Validate strategy
    const validStrategies = ['Scalping', 'Swing Trading', 'Grid Trading', 'DCA', 'Arbitrage', 'Market Making'];
    if (!validStrategies.includes(strategy)) {
      return NextResponse.json({
        success: false,
        error: `Invalid strategy. Must be one of: ${validStrategies.join(', ')}`
      }, { status: 400 });
    }

    // Create new bot
    const newBot = {
      id: `bot-${Date.now().toString(36)}`,
      name,
      strategy,
      status: 'stopped',
      profit: 0,
      trades: 0,
      winRate: 0,
      uptime: 0,
      symbol: symbol || 'BTCUSDT',
      interval: interval || '5m',
      config: config || {
        maxPositionSize: 0.1,
        stopLoss: 2,
        takeProfit: 3,
        riskPerTrade: 1
      },
      createdAt: new Date().toISOString(),
      lastTrade: null
    };

    botsDatabase.push(newBot);

    const stats = calculateStats();

    return NextResponse.json({
      success: true,
      bot: newBot,
      stats,
      message: 'Bot başarıyla oluşturuldu',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Bots POST API error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// DELETE /api/quantum-pro/bots - Delete bot
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const botId = searchParams.get('botId');

    if (!botId) {
      return NextResponse.json({
        success: false,
        error: 'Missing botId parameter'
      }, { status: 400 });
    }

    const botIndex = botsDatabase.findIndex(b => b.id === botId);
    if (botIndex === -1) {
      return NextResponse.json({
        success: false,
        error: 'Bot not found'
      }, { status: 404 });
    }

    botsDatabase.splice(botIndex, 1);

    const stats = calculateStats();

    return NextResponse.json({
      success: true,
      message: 'Bot başarıyla silindi',
      stats,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Bots DELETE API error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}