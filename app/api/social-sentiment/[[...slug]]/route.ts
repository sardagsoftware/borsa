/**
 * AILYDIAN Social Sentiment Analysis API Route
 * Next.js API integration for social sentiment microservice
 * © 2025 Emrah Şardağ - Ultra Pro Edition
 */

import { NextRequest, NextResponse } from 'next/server';

const SOCIAL_SENTIMENT_SERVICE_URL = process.env.SOCIAL_SENTIMENT_SERVICE_URL || 'http://localhost:8002';

// Helper function to make requests to the social sentiment service
async function makeServiceRequest(endpoint: string, options: RequestInit = {}) {
  try {
    const url = `${SOCIAL_SENTIMENT_SERVICE_URL}${endpoint}`;
    
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
    console.error('Social sentiment service request failed:', error);
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

      default:
        return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('Social sentiment API error:', error);
    return NextResponse.json(
      { 
        error: 'Social sentiment service unavailable',
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
      case '/analyze':
        responseData = await makeServiceRequest('/analyze', {
          method: 'POST',
          body: JSON.stringify(body),
        });
        break;

      case '/analyze-bulk':
        responseData = await makeServiceRequest('/analyze-bulk', {
          method: 'POST',
          body: JSON.stringify(body),
        });
        break;

      case '/collect-social':
        responseData = await makeServiceRequest('/collect-social', {
          method: 'POST',
          body: JSON.stringify(body),
        });
        break;

      case '/sentiment-trend':
        responseData = await makeServiceRequest('/sentiment-trend', {
          method: 'POST',
          body: JSON.stringify(body),
        });
        break;

      case '/start-monitoring':
        const symbol = body.symbol || request.nextUrl.searchParams.get('symbol');
        if (!symbol) {
          return NextResponse.json({ error: 'Symbol parameter required' }, { status: 400 });
        }
        
        responseData = await makeServiceRequest(`/start-monitoring?symbol=${symbol}`, {
          method: 'POST',
        });
        break;

      default:
        return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 });
    }

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Social sentiment API error:', error);
    
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
        error: 'Social sentiment service unavailable',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 503 }
    );
  }
}
