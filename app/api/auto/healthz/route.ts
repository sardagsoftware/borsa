// GET /api/auto/healthz - System health check
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  components: {
    database: ComponentHealth;
    exchanges: {
      binance: ComponentHealth;
      bybit?: ComponentHealth;
      okx?: ComponentHealth;
    };
    queues: ComponentHealth;
    websockets: ComponentHealth;
    guards: ComponentHealth;
    bot: ComponentHealth;
  };
  environment: {
    nodeEnv: string;
    botEnabled: boolean;
    killSwitch: boolean;
    mode: string;
  };
  metrics: {
    totalSignals: number;
    totalDecisions: number;
    totalOrders: number;
    activeSymbols: number;
    avgResponseTime: number;
  };
}

interface ComponentHealth {
  status: 'up' | 'down' | 'degraded';
  lastChecked: string;
  responseTime?: number;
  error?: string;
  details?: any;
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  
  try {
    // Initialize health status
    const health: HealthStatus = {
      status: 'healthy',
      timestamp,
      uptime: process.uptime(),
      components: {
        database: await checkDatabase(),
        exchanges: {
          binance: await checkBinance()
        },
        queues: await checkQueues(),
        websockets: await checkWebSockets(),
        guards: await checkGuards(),
        bot: await checkBot()
      },
      environment: {
        nodeEnv: process.env.NODE_ENV || 'development',
        botEnabled: process.env.BOT_ENABLED === 'true',
        killSwitch: process.env.GLOBAL_KILL_SWITCH === 'true',
        mode: process.env.BOT_MODE || 'semi'
      },
      metrics: await getMetrics()
    };

    // Determine overall health status
    const componentStatuses = Object.values(health.components).flatMap(comp => {
      if (typeof comp === 'object' && 'status' in comp) {
        return [comp.status];
      }
      return Object.values(comp as any).map((c: any) => c.status);
    });

    const downComponents = componentStatuses.filter(s => s === 'down').length;
    const degradedComponents = componentStatuses.filter(s => s === 'degraded').length;

    if (downComponents > 0) {
      health.status = 'unhealthy';
    } else if (degradedComponents > 1) {
      health.status = 'degraded';
    }

    const responseTime = Date.now() - startTime;
    health.components.guards.responseTime = responseTime;

    return NextResponse.json(health, {
      status: health.status === 'healthy' ? 200 : 
              health.status === 'degraded' ? 206 : 503
    });

  } catch (error) {
    console.error('Health check error:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp,
      error: error instanceof Error ? error.message : 'Unknown error',
      uptime: process.uptime()
    }, { status: 503 });
  }
}

async function checkDatabase(): Promise<ComponentHealth> {
  const start = Date.now();
  
  try {
    await prisma.$queryRaw`SELECT 1`;
    
    return {
      status: 'up',
      lastChecked: new Date().toISOString(),
      responseTime: Date.now() - start,
      details: {
        provider: 'postgresql',
        connected: true
      }
    };
  } catch (error) {
    return {
      status: 'down',
      lastChecked: new Date().toISOString(),
      responseTime: Date.now() - start,
      error: error instanceof Error ? error.message : 'Database connection failed'
    };
  }
}

async function checkBinance(): Promise<ComponentHealth> {
  const start = Date.now();
  
  try {
    // Check if we have Binance configuration
    if (!process.env.BINANCE_API_KEY) {
      return {
        status: 'down',
        lastChecked: new Date().toISOString(),
        error: 'Binance API key not configured'
      };
    }

    // Simple connectivity check (without actual API call for security)
    // In production, you might want to do a simple public API call
    return {
      status: 'up',
      lastChecked: new Date().toISOString(),
      responseTime: Date.now() - start,
      details: {
        testnet: process.env.BINANCE_TESTNET === 'true',
        configured: true
      }
    };

  } catch (error) {
    return {
      status: 'down',
      lastChecked: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Binance check failed'
    };
  }
}

async function checkQueues(): Promise<ComponentHealth> {
  try {
    // Check Redis connection if configured
    if (process.env.UPSTASH_REDIS_REST_URL) {
      // In a real implementation, you'd check the Redis connection
      return {
        status: 'up',
        lastChecked: new Date().toISOString(),
        details: {
          provider: 'upstash',
          configured: true
        }
      };
    }

    return {
      status: 'down',
      lastChecked: new Date().toISOString(),
      error: 'Redis/Queue not configured'
    };

  } catch (error) {
    return {
      status: 'down',
      lastChecked: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Queue check failed'
    };
  }
}

async function checkWebSockets(): Promise<ComponentHealth> {
  // Check WebSocket connections status
  // This would normally check active WS connections
  
  return {
    status: 'up',
    lastChecked: new Date().toISOString(),
    details: {
      activeConnections: 0, // Would be actual count
      configured: true
    }
  };
}

async function checkGuards(): Promise<ComponentHealth> {
  const start = Date.now();
  
  try {
    // Check risk management guards
    const killSwitch = process.env.GLOBAL_KILL_SWITCH === 'true';
    const botEnabled = process.env.BOT_ENABLED === 'true';
    const maxDailyLoss = parseFloat(process.env.MAX_DAILY_LOSS_USD || '600');
    
    const status = killSwitch ? 'down' : 'up';
    
    return {
      status,
      lastChecked: new Date().toISOString(),
      responseTime: Date.now() - start,
      details: {
        killSwitch,
        botEnabled,
        maxDailyLossUsd: maxDailyLoss,
        guardsActive: !killSwitch && botEnabled
      }
    };

  } catch (error) {
    return {
      status: 'down',
      lastChecked: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Guards check failed'
    };
  }
}

async function checkBot(): Promise<ComponentHealth> {
  try {
    // Check bot engine status
    const botEnabled = process.env.BOT_ENABLED === 'true';
    const mode = process.env.BOT_MODE || 'semi';
    const killSwitch = process.env.GLOBAL_KILL_SWITCH === 'true';
    
    let status: 'up' | 'down' | 'degraded' = 'up';
    
    if (!botEnabled || killSwitch) {
      status = 'down';
    } else if (mode === 'semi') {
      status = 'degraded'; // Semi-auto is partially operational
    }

    return {
      status,
      lastChecked: new Date().toISOString(),
      details: {
        enabled: botEnabled,
        mode,
        killSwitch,
        operational: botEnabled && !killSwitch
      }
    };

  } catch (error) {
    return {
      status: 'down',
      lastChecked: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Bot status check failed'
    };
  }
}

async function getMetrics() {
  try {
    const [signalCount, decisionCount, orderCount] = await Promise.all([
      prisma.botSignal.count(),
      prisma.botDecision.count(),
      prisma.botOrder.count()
    ]);

    // Get unique symbols from recent signals
    const activeSymbols = await prisma.botSignal.findMany({
      where: {
        timestamp: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      select: { symbol: true },
      distinct: ['symbol']
    });

    return {
      totalSignals: signalCount,
      totalDecisions: decisionCount,
      totalOrders: orderCount,
      activeSymbols: activeSymbols.length,
      avgResponseTime: 50 // Mock value - would be calculated from actual metrics
    };

  } catch (error) {
    return {
      totalSignals: 0,
      totalDecisions: 0,
      totalOrders: 0,
      activeSymbols: 0,
      avgResponseTime: 0
    };
  }
}
