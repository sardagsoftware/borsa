/**
 * AILYDIAN Auto-Trader AI API Route
 * Next.js API integration for auto-trader AI microservice
 * © 2025 Emrah Şardağ - Ultra Pro Edition
 */

import { NextRequest, NextResponse } from 'next/server';

const AUTO_TRADER_SERVICE_URL = process.env.AUTO_TRADER_SERVICE_URL || 'http://localhost:8004';

// Helper function to make requests to the auto-trader service
async function makeServiceRequest(endpoint: string, options: RequestInit = {}) {
  try {
    const url = `${AUTO_TRADER_SERVICE_URL}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Service request failed: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Auto-trader service request failed:', error);
    throw error;
  }
}

// Route handler
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string[] } }
) {
  try {
    const { slug } = params;
    const endpoint = `/${slug?.join('/') || ''}`;
    const searchParams = request.nextUrl.searchParams.toString();
    const fullEndpoint = searchParams ? `${endpoint}?${searchParams}` : endpoint;

    // Handle different GET endpoints
    switch (endpoint) {
      case '/health':
        const healthData = await makeServiceRequest('/health');
        return NextResponse.json(healthData);

      case '/trading-performance':
        const performanceData = await makeServiceRequest('/trading-performance');
        return NextResponse.json(performanceData);

      default:
        return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('Auto-trader API error:', error);
    return NextResponse.json(
      { 
        error: 'Auto-trader service unavailable',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 503 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string[] } }
) {
  try {
    const { slug } = params;
    const endpoint = `/${slug?.join('/') || ''}`;
    const body = await request.json();

    let responseData;

    // Handle different POST endpoints
    switch (endpoint) {
      case '/generate-signal':
        responseData = await makeServiceRequest('/generate-signal', {
          method: 'POST',
          body: JSON.stringify(body),
        });
        break;

      case '/calculate-position-size':
        responseData = await makeServiceRequest('/calculate-position-size', {
          method: 'POST',
          body: JSON.stringify(body),
        });
        break;

      case '/portfolio-risk':
        responseData = await makeServiceRequest('/portfolio-risk', {
          method: 'POST',
          body: JSON.stringify(body),
        });
        break;

      case '/backtest':
        responseData = await makeServiceRequest('/backtest', {
          method: 'POST',
          body: JSON.stringify(body),
        });
        break;

      default:
        return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 });
    }

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Auto-trader API error:', error);
    
    // Return appropriate error response
    if (error instanceof Error && error.message.includes('Service request failed')) {
      return NextResponse.json(
        { 
          error: 'Service request failed',
          message: error.message,
          timestamp: new Date().toISOString()
        },
        { status: 502 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Auto-trader service unavailable',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 503 }
    );
  }
}
