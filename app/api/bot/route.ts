import { NextRequest, NextResponse } from 'next/server';

// SSE endpoint for bot signals
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol') || 'BTCUSDT';

  // Create SSE stream
  const stream = new ReadableStream({
    start(controller) {
      // Mock bot signal generation
      const sendSignal = () => {
        const signal = Math.random() * 200 - 100; // -100 to +100
        const regime = signal > 30 ? 'bullish' : signal < -30 ? 'bearish' : 'neutral';
        
        const data = JSON.stringify({
          symbol,
          signal: parseFloat(signal.toFixed(1)),
          regime,
          timestamp: Date.now(),
          features: {
            rsi: Math.random() * 100,
            volume: Math.random() * 1000000,
            orderFlowRatio: Math.random(),
          }
        });

        controller.enqueue(`data: ${data}\n\n`);
      };

      // Send initial signal
      sendSignal();
      
      // Send signal every 5 seconds
      const interval = setInterval(sendSignal, 5000);
      
      // Cleanup on close
      request.signal.addEventListener('abort', () => {
        clearInterval(interval);
        controller.close();
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  
  // Bot trading logic
  if (body.action === 'auto_trade') {
    const signal = body.signal;
    const botMode = body.mode || 'semi';
    
    if (botMode === 'off') {
      return NextResponse.json({ message: 'Bot is disabled' });
    }
    
    // Check signal strength
    if (Math.abs(signal) > 50) {
      const action = signal > 0 ? 'BUY' : 'SELL';
      
      console.log(`🤖 Bot signal: ${action} (${signal.toFixed(1)})`);
      
      // In semi mode, return recommendation
      if (botMode === 'semi') {
        return NextResponse.json({
          recommendation: action,
          signal,
          confidence: Math.abs(signal),
          reason: `Strong ${action.toLowerCase()} signal detected`,
          requiresApproval: true,
        });
      }
      
      // In auto mode, place order (with guards)
      if (botMode === 'auto') {
        // Risk checks and guardrails
        const riskOk = Math.abs(signal) > 60; // Higher threshold for auto
        
        if (riskOk) {
          return NextResponse.json({
            action: 'ORDER_PLACED',
            order: {
              symbol: body.symbol || 'BTCUSDT',
              side: action,
              quantity: 0.001,
              type: 'MARKET',
              timestamp: Date.now(),
            }
          });
        }
      }
    }
    
    return NextResponse.json({ 
      message: 'No action taken',
      signal,
      reason: 'Signal below threshold or risk limits' 
    });
  }
  
  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
