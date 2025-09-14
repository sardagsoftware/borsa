// POST /api/auto/decide - Signal to Policy Decision
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { policyEngine } from '@/lib/auto/policy';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface DecisionRequest {
  symbol: string;
  signal: {
    score: number;
    confidence: number;
    quality: number;
    dominantStrategy: string;
  };
  features: any;
  regime: any;
  leadLag: any;
  currentPrice: number;
  mode: 'semi' | 'auto' | 'off';
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body: DecisionRequest = await request.json();
    const { symbol, signal, features, regime, leadLag, currentPrice, mode } = body;

    // Validate input
    if (!symbol || !signal || !currentPrice) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get user's risk settings
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        riskSettings: true,
        portfolios: true,
        trades: {
          where: {
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Calculate account info
    const dailyPnl = user.trades
      .filter(trade => trade.pnl !== null)
      .reduce((sum, trade) => sum + (trade.pnl || 0), 0);

    const openPositions = user.portfolios
      .filter(p => Math.abs(p.quantity) > 0.001)
      .map(p => ({
        symbol: p.symbol,
        side: p.side as 'LONG' | 'SHORT',
        size: p.quantity * p.avgPrice,
        entryPrice: p.avgPrice,
        currentPrice: p.currentPrice || p.avgPrice,
        unrealizedPnl: p.pnl || 0,
        leverage: p.leverage
      }));

    const accountInfo = {
      balance: 10000, // Mock balance - should come from exchange
      equity: 10000 + dailyPnl,
      margin: openPositions.reduce((sum, pos) => sum + Math.abs(pos.size) / pos.leverage, 0),
      dailyPnl,
      positions: openPositions
    };

    // Update policy engine with user's risk limits
    if (user.riskSettings.length > 0) {
      const riskSettings = user.riskSettings[0];
      policyEngine.updateRiskLimits({
        maxDailyLossUsd: riskSettings.maxDailyLoss,
        maxSingleTradeRiskPct: 2.0, // 2% default
        maxConcurrentPositions: riskSettings.maxPositions,
        maxLeverage: riskSettings.maxLeverage
      });
    }

    // Make trading decision
    const decision = policyEngine.makeDecision(
      symbol,
      {
        score: signal.score,
        confidence: signal.confidence,
        quality: signal.quality,
        trendScore: 0,
        meanReversionScore: 0,
        breakoutScore: 0,
        microflowScore: 0,
        regimeScore: 0,
        trendWeight: 0,
        meanRevWeight: 0,
        breakoutWeight: 0,
        microflowWeight: 0,
        regimeWeight: 0,
        dominantStrategy: signal.dominantStrategy,
        riskAdjustment: 1,
        leadLagAdjustment: 1
      },
      features,
      regime,
      leadLag,
      accountInfo,
      mode,
      currentPrice
    );

    // Save decision to database
    const botDecision = await prisma.botDecision.create({
      data: {
        symbol,
        action: decision.action,
        rationale: decision.reasoning.join('; '),
        risk: 1 - decision.confidence,
        policy: {
          positionSize: decision.positionSize,
          leverage: decision.leverage,
          stopLoss: decision.stopLoss,
          takeProfit: decision.takeProfit,
          orderType: decision.orderType,
          urgency: decision.urgency
        },
        plan: {
          executionType: 'SIMPLE', // Could be TWAP, ICEBERG, etc.
          timeInForce: decision.timeInForce,
          maxSlippage: decision.maxSlippage,
          cooldown: decision.cooldown
        },
        mode
      }
    });

    // Return decision with database ID for tracking
    const response = {
      success: true,
      data: {
        ...decision,
        decisionId: botDecision.id,
        userId: session.user.id,
        accountInfo: {
          balance: accountInfo.balance,
          equity: accountInfo.equity,
          dailyPnl: accountInfo.dailyPnl,
          openPositions: accountInfo.positions.length
        }
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Decision API error:', error);
    return NextResponse.json(
      { error: 'Decision making failed' },
      { status: 500 }
    );
  }
}
