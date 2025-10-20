/**
 * Queue Stats API
 * GET /api/messages/stats?userId=xxx
 */

import { NextRequest, NextResponse } from 'next/server';
import { getQueueStats } from '@/lib/delivery/queue';
import { checkRedisHealth } from '@/lib/delivery/redis-client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      );
    }

    // Get queue stats
    const stats = await getQueueStats(userId);

    // Check Redis health
    const health = await checkRedisHealth();

    return NextResponse.json({
      success: true,
      stats,
      redis: health
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      }
    });
  } catch (error: any) {
    console.error('[API] ❌ Stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
