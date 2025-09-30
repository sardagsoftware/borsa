/**
 * QUANTUM SENTINEL - START ENDPOINT
 * Activates the bot with a single button press
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
        message: '🔒 Authentication required to control Quantum Sentinel'
      },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { symbol = 'BTCUSDT' } = body;

    const sentinel = getQuantumSentinel();

    // Check if already running
    const state = sentinel.getState();
    if (state.isRunning) {
      return NextResponse.json({
        success: false,
        error: 'Already running',
        message: '⚠️ Quantum Sentinel is already active',
        state
      });
    }

    // Start the bot
    await sentinel.start(symbol);

    return NextResponse.json({
      success: true,
      message: '🚀 Quantum Sentinel activated successfully',
      state: sentinel.getState(),
      timestamp: Date.now()
    });

  } catch (error: any) {
    console.error('❌ Error starting Quantum Sentinel:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Start failed',
        message: error.message || 'Failed to start Quantum Sentinel',
        timestamp: Date.now()
      },
      { status: 500 }
    );
  }
}