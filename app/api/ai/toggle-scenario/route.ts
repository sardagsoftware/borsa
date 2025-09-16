/**
 * Toggle Scenario API
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { scenarioId, active } = await request.json();
    
    console.log(`Scenario ${scenarioId} ${active ? 'activated' : 'deactivated'}`);
    
    // In real implementation, this would update the trading engine
    
    return NextResponse.json({
      success: true,
      scenarioId,
      active
    });
  } catch (error) {
    console.error('Toggle scenario error:', error);
    return NextResponse.json(
      { error: 'Failed to toggle scenario' },
      { status: 500 }
    );
  }
}
