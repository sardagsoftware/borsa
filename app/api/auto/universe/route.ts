// GET /api/auto/universe - Top 100 futures-supported symbols
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { universeManager } from '@/lib/auto/universe';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get universe data
    const universe = await universeManager.getUniverse();
    
    // Add real-time data enhancements (liquidity, spread, etc.)
    const enhancedUniverse = {
      ...universe,
      members: universe.members.map(member => ({
        ...member,
        // Add real-time metrics here if available
        lastUpdate: universe.lastUpdate,
        status: 'active'
      }))
    };

    return NextResponse.json({
      success: true,
      data: enhancedUniverse,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Universe API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch universe data' },
      { status: 500 }
    );
  }
}
