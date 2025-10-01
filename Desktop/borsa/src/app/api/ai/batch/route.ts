/**
 * AI Batch Trading Signals API Route
 *
 * POST /api/ai/batch
 * Body: { symbols: string[], timeframe?: string }
 *
 * Production-Grade Batch Signal Generation
 *
 * Features:
 * - Batch processing for multiple symbols
 * - Request validation (max 50 symbols)
 * - Server-side Railway API calls (HMAC-authenticated)
 * - Response caching (5 minutes)
 * - Error handling with partial success support
 *
 * White-hat compliant: Ethical AI, transparent predictions
 */

import { NextRequest, NextResponse } from 'next/server';
import { railwayClient } from '@/lib/railway-client';
import { z } from 'zod';

// ============================================================================
// REQUEST VALIDATION SCHEMA
// ============================================================================

const BatchSignalRequestSchema = z.object({
  symbols: z.array(
    z.string()
      .min(6, 'Symbol must be at least 6 characters')
      .max(12, 'Symbol must be at most 12 characters')
      .regex(/^[A-Z]+$/, 'Symbol must be uppercase letters only')
  )
    .min(1, 'At least one symbol is required')
    .max(50, 'Maximum 50 symbols per batch request'),
  timeframe: z.enum(['1m', '5m', '15m', '1h', '4h', '1d'])
    .default('1h')
});

// ============================================================================
// CACHE CONFIGURATION
// ============================================================================

export const dynamic = 'force-dynamic';
export const revalidate = 300; // 5 minutes

// ============================================================================
// POST HANDLER - Generate Batch Trading Signals
// ============================================================================

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Parse request body
    const body = await request.json();

    // Validate input
    const validatedRequest = BatchSignalRequestSchema.parse(body);

    // Normalize symbols to uppercase
    const normalizedSymbols = validatedRequest.symbols.map(s => s.toUpperCase());

    // Call Railway AI service
    console.info('Requesting batch AI signals from Railway:', {
      count: normalizedSymbols.length,
      symbols: normalizedSymbols.slice(0, 5).join(', ') + (normalizedSymbols.length > 5 ? '...' : ''),
      timeframe: validatedRequest.timeframe
    });

    const response = await railwayClient.generateBatchSignals(
      normalizedSymbols,
      validatedRequest.timeframe
    );

    if (!response.success) {
      throw new Error('Batch signal generation failed');
    }

    // Calculate success rate
    const successCount = response.results.filter((r: any) => r.success !== false).length;
    const failureCount = response.results.length - successCount;

    // Add processing metadata
    const processingTime = Date.now() - startTime;

    // Return successful response
    return NextResponse.json(
      {
        success: true,
        results: response.results,
        summary: {
          total: response.count,
          successful: successCount,
          failed: failureCount,
          timeframe: validatedRequest.timeframe
        },
        metadata: {
          vercelProcessingTime: processingTime,
          cachedUntil: Date.now() + (5 * 60 * 1000) // 5 minutes
        }
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          'X-Processing-Time': processingTime.toString(),
          'X-AI-Source': 'railway-microservice',
          'X-Batch-Size': normalizedSymbols.length.toString()
        }
      }
    );

  } catch (error) {
    console.error('AI batch signal API error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      url: request.url
    });

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request body',
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
        error: 'Failed to generate batch trading signals',
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
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400'
      }
    }
  );
}
