/**
 * Toggle Engine API
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { start } = await request.json();
    
    console.log(`Auto Trading Engine ${start ? 'started' : 'stopped'}`);
    
    // In real implementation, this would start/stop the actual trading engine
    
    return NextResponse.json({
      success: true,
      is_running: start,
      message: `Engine ${start ? 'started' : 'stopped'} successfully`
    });
  } catch (error) {
    console.error('Toggle engine error:', error);
    return NextResponse.json(
      { error: 'Failed to toggle engine' },
      { status: 500 }
    );
  }
}
