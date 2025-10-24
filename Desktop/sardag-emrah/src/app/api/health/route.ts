/**
 * HEALTH CHECK API
 *
 * Checks the health of all critical services:
 * - Binance API
 * - Groq API
 * - Scanner API
 *
 * Returns:
 * - 200: All services healthy
 * - 207: Some services degraded
 * - 503: Critical services unhealthy
 */

import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30; // 30 seconds max for health check

interface ServiceStatus {
  status: 'up' | 'down' | 'degraded';
  responseTime?: number;
  error?: string;
  lastCheck?: number;
}

interface HealthCheck {
  timestamp: number;
  status: 'healthy' | 'degraded' | 'unhealthy';
  services: {
    binance?: ServiceStatus;
    groq?: ServiceStatus;
    scanner?: ServiceStatus;
  };
  uptime: number;
}

const startTime = Date.now();

export async function GET() {
  const checkStartTime = Date.now();

  const checks: HealthCheck = {
    timestamp: checkStartTime,
    status: 'healthy',
    services: {},
    uptime: checkStartTime - startTime
  };

  // Check Binance API
  try {
    const binanceStart = Date.now();
    const response = await fetch('https://fapi.binance.com/fapi/v1/ping', {
      signal: AbortSignal.timeout(5000)
    });
    const binanceTime = Date.now() - binanceStart;

    checks.services.binance = {
      status: response.ok ? 'up' : 'down',
      responseTime: binanceTime,
      lastCheck: Date.now()
    };

    if (!response.ok) {
      checks.status = 'degraded';
    }
  } catch (error) {
    checks.services.binance = {
      status: 'down',
      error: error instanceof Error ? error.message : String(error),
      lastCheck: Date.now()
    };
    checks.status = 'degraded';
  }

  // Check Groq API
  try {
    const groqStart = Date.now();
    const response = await fetch('https://api.groq.com/openai/v1/models', {
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(5000)
    });
    const groqTime = Date.now() - groqStart;

    checks.services.groq = {
      status: response.ok ? 'up' : 'down',
      responseTime: groqTime,
      lastCheck: Date.now()
    };

    if (!response.ok) {
      checks.status = 'degraded';
    }
  } catch (error) {
    checks.services.groq = {
      status: 'down',
      error: error instanceof Error ? error.message : String(error),
      lastCheck: Date.now()
    };
    checks.status = 'degraded';
  }

  // Check Scanner API (lightweight test)
  try {
    const scannerStart = Date.now();
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';

    const response = await fetch(`${baseUrl}/api/scanner/signals?limit=5`, {
      signal: AbortSignal.timeout(10000)
    });
    const scannerTime = Date.now() - scannerStart;

    if (response.ok) {
      const data = await response.json();
      checks.services.scanner = {
        status: data.success ? 'up' : 'degraded',
        responseTime: scannerTime,
        lastCheck: Date.now()
      };

      if (!data.success) {
        checks.status = 'degraded';
      }
    } else {
      checks.services.scanner = {
        status: 'down',
        responseTime: scannerTime,
        lastCheck: Date.now()
      };
      checks.status = 'unhealthy';
    }
  } catch (error) {
    checks.services.scanner = {
      status: 'down',
      error: error instanceof Error ? error.message : String(error),
      lastCheck: Date.now()
    };
    checks.status = 'unhealthy';
  }

  // Determine final status code
  const statusCode =
    checks.status === 'healthy' ? 200 :
    checks.status === 'degraded' ? 207 :
    503;

  return NextResponse.json(checks, {
    status: statusCode,
    headers: {
      'Cache-Control': 'no-store, must-revalidate',
      'X-Health-Status': checks.status
    }
  });
}
