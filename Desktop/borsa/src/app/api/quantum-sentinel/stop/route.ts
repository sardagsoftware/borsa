/**
 * QUANTUM SENTINEL - STOP ENDPOINT
 * Safely stops the bot
 *
 * @security Authentication required
 * @method POST
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { getQuantumSentinel } from '@/services/ai/QuantumSentinelCore';

export async function POST(request: NextRequest) {
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

    // Stop the bot
    await sentinel.stop();

    return NextResponse.json({
      success: true,
      message: '🛑 Quantum Sentinel stopped successfully',
      state: sentinel.getState(),
      timestamp: Date.now()
    });

  } catch (error: any) {
    console.error('❌ Error stopping Quantum Sentinel:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Stop failed',
        message: error.message || 'Failed to stop Quantum Sentinel',
        timestamp: Date.now()
      },
      { status: 500 }
    );
  }
}