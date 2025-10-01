/**
 * AI Trading Signal API Route
 *
 * GET /api/ai/signal?symbol=BTCUSDT&timeframe=1h
 *
 * Production-Grade Vercel → Railway Integration
 *
 * Features:
 * - Server-side Railway API calls (HMAC-authenticated)
 * - Request validation (Zod schemas)
 * - Response caching (5 minutes)
 * - Error handling with user-friendly messages
 * - Rate limiting (delegated to Railway)
 * - CORS headers for frontend
 *
 * White-hat compliant: Ethical AI, transparent predictions
 */

import { NextRequest, NextResponse } from 'next/server';
import { railwayClient } from '@/lib/railway-client';
import { z } from 'zod';

// ============================================================================
// REQUEST VALIDATION SCHEMA
// ============================================================================

const SignalQuerySchema = z.object({
  symbol: z.string()
    .min(6, 'Symbol must be at least 6 characters')
    .max(12, 'Symbol must be at most 12 characters')
    .regex(/^[A-Z]+$/, 'Symbol must be uppercase letters only')
    .transform(val => val.toUpperCase()),
  timeframe: z.enum(['1m', '5m', '15m', '1h', '4h', '1d'])
    .default('1h')
});

// ============================================================================
// CACHE CONFIGURATION
// ============================================================================

// Next.js 15 Route Handler caching
export const dynamic = 'force-dynamic'; // Disable static generation
export const revalidate = 300; // Revalidate every 5 minutes

// ============================================================================
// GET HANDLER - Generate Trading Signal
// ============================================================================

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const timeframe = searchParams.get('timeframe') || '1h';

    // Validate input
    if (!symbol) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameter: symbol',
          code: 'MISSING_SYMBOL'
        },
        { status: 400 }
      );
    }

    const validatedParams = SignalQuerySchema.parse({ symbol, timeframe });

    // Call Railway AI service
    console.info('Requesting AI signal from Railway:', validatedParams);

    const response = await railwayClient.generateSignal({
      symbol: validatedParams.symbol,
      timeframe: validatedParams.timeframe
    });

    if (!response.success || !response.signal) {
      throw new Error(response.error || 'Failed to generate signal');
    }

    // Add processing metadata
    const processingTime = Date.now() - startTime;

    // Return successful response
    return NextResponse.json(
      {
        success: true,
        signal: response.signal,
        metadata: {
          ...response.signal.metadata,
          vercelProcessingTime: processingTime,
          totalProcessingTime: processingTime + response.signal.metadata.processingTime,
          cachedUntil: Date.now() + (5 * 60 * 1000) // 5 minutes
        }
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          'X-Processing-Time': processingTime.toString(),
          'X-AI-Source': 'railway-microservice'
        }
      }
    );

  } catch (error) {
    console.error('AI signal API error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      url: request.url
    });

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request parameters',
          code: 'VALIDATION_ERROR',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        },
        { status: 400 }
      );
    }

    // Handle Railway API errors
    if (error instanceof Error && error.message.includes('Railway API')) {
      return NextResponse.json(
        {
          success: false,
          error: 'AI service temporarily unavailable',
          code: 'SERVICE_UNAVAILABLE',
          message: process.env.NODE_ENV === 'development' ? error.message : undefined
        },
        { status: 503 }
      );
    }

    // Generic error response
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate trading signal',
        code: 'INTERNAL_ERROR',
        message: process.env.NODE_ENV === 'development'
          ? (error instanceof Error ? error.message : 'Unknown error')
          : undefined
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// OPTIONS HANDLER - CORS Preflight
// ============================================================================

export async function OPTIONS(request: NextRequest) {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400'
      }
    }
  );
}
