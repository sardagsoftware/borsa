/**
 * AILYDIAN News Intelligence API Route
 * Next.js API integration for news intelligence microservice
 * © 2025 Emrah Şardağ - Ultra Pro Edition
 */

import { NextRequest, NextResponse } from 'next/server';

const NEWS_INTELLIGENCE_SERVICE_URL = process.env.NEWS_INTELLIGENCE_SERVICE_URL || 'http://localhost:8003';

// Helper function to make requests to the news intelligence service
async function makeServiceRequest(endpoint: string, options: RequestInit = {}) {
  try {
    const url = `${NEWS_INTELLIGENCE_SERVICE_URL}${endpoint}`;
    
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
    console.error('News intelligence service request failed:', error);
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

      case '/trust-sources':
        const trustData = await makeServiceRequest('/trust-sources');
        return NextResponse.json(trustData);

      default:
        return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('News intelligence API error:', error);
    return NextResponse.json(
      { 
        error: 'News intelligence service unavailable',
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
      case '/collect-news':
        responseData = await makeServiceRequest('/collect-news', {
          method: 'POST',
          body: JSON.stringify(body),
        });
        break;

      case '/heatmap-data':
        responseData = await makeServiceRequest('/heatmap-data', {
          method: 'POST',
          body: JSON.stringify(body),
        });
        break;

      default:
        return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 });
    }

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('News intelligence API error:', error);
    
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
        error: 'News intelligence service unavailable',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 503 }
    );
  }
}
