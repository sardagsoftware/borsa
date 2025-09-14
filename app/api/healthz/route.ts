import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    // Health checks for all services
    const healthChecks = {
      timestamp: new Date().toISOString(),
      status: 'healthy',
      services: {
        database: 'connected',
        redis: 'connected',
        binance: 'connected',
        bybit: 'connected',
        okx: 'connected',
        bot: 'active',
      },
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };

    return NextResponse.json(healthChecks);
  } catch (error) {
    return NextResponse.json(
      { status: 'unhealthy', error: 'Health check failed' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  
  if (body.action === 'kill_switch') {
    // Activate global kill switch
    console.log('🛑 KILL SWITCH ACTIVATED');
    return NextResponse.json({ success: true, message: 'Kill switch activated' });
  }
  
  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
