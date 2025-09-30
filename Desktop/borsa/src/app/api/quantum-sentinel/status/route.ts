/**
 * QUANTUM SENTINEL - STATUS ENDPOINT
 * Returns current bot status and performance metrics
 *
 * @security Authentication required
 * @method GET
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { getQuantumSentinel } from '@/services/ai/QuantumSentinelCore';

export async function GET(request: NextRequest) {
  // 🔒 SECURITY: Authentication required
  const user = verifyAuth(request);
  if (!user) {
    return NextResponse.json(
      {
        success: false,
        error: 'Unauthorized',
        message: '🔒 Authentication required'
      },
      { status: 401 }
    );
  }

  try {
    const sentinel = getQuantumSentinel();
    const state = sentinel.getState();
    const performance = sentinel.getPerformanceStats();

    return NextResponse.json({
      success: true,
      state,
      performance,
      timestamp: Date.now()
    });

  } catch (error: any) {
    console.error('❌ Error getting status:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Status fetch failed',
        message: error.message || 'Failed to get status',
        timestamp: Date.now()
      },
      { status: 500 }
    );
  }
}