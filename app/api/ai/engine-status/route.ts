/**
 * Auto Trading Engine Status API
 */

import { NextRequest, NextResponse } from 'next/server';

// Global trading engine instance (in real app, this would be in a service)
let engineStatus = {
  is_running: false,
  active_scenarios: 0,
  total_scenarios: 3,
  active_signals: 0,
  monitored_symbols: 6
};

export async function GET() {
  try {
    return NextResponse.json(engineStatus);
  } catch (error) {
    console.error('Engine status error:', error);
    return NextResponse.json(
      { error: 'Failed to get engine status' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { start } = await request.json();
    
    engineStatus.is_running = start;
    
    if (start) {
      // Simulate starting scenarios
      engineStatus.active_scenarios = Math.min(3, engineStatus.total_scenarios);
      engineStatus.active_signals = Math.floor(Math.random() * 5);
    } else {
      engineStatus.active_scenarios = 0;
      engineStatus.active_signals = 0;
    }

    return NextResponse.json({
      success: true,
      status: engineStatus
    });
  } catch (error) {
    console.error('Engine toggle error:', error);
    return NextResponse.json(
      { error: 'Failed to toggle engine' },
      { status: 500 }
    );
  }
}
