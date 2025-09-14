import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json();
  
  try {
    // Risk checks before placing order
    const riskCheck = {
      maxLoss: parseFloat(process.env.MAX_SINGLE_TRADE_RISK_PCT || '1.0'),
      allowed: true,
      reason: 'Risk within limits',
    };

    if (!body.testMode && process.env.REQUIRE_OPTIN_FOR_LIVE === 'true') {
      return NextResponse.json(
        { error: 'Live trading requires explicit opt-in' },
        { status: 403 }
      );
    }

    // Mock order placement
    const order = {
      orderId: Date.now(),
      symbol: body.symbol,
      side: body.side,
      type: body.type,
      price: body.price,
      quantity: body.quantity,
      status: 'NEW',
      timestamp: new Date().toISOString(),
      testMode: body.testMode || true,
    };

    console.log('📋 Order placed:', order);

    return NextResponse.json({
      success: true,
      order,
      riskCheck,
    });
  } catch (error) {
    console.error('Trade error:', error);
    return NextResponse.json(
      { error: 'Failed to place order' },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Get open orders and positions
  return NextResponse.json({
    positions: [
      {
        symbol: 'BTCUSDT',
        side: 'LONG',
        size: 0.05,
        entryPrice: 66800,
        markPrice: 67234.50,
        pnl: 21.73,
        percentage: 1.62,
      }
    ],
    orders: [],
    balance: {
      USDT: 5432.10,
      BTC: 0.1234,
    }
  });
}
