import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { portfolioOMS } from '@/lib/pro/oms';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get consolidated portfolio
    const portfolio = await portfolioOMS.getConsolidatedPositions(session.user.id);

    return NextResponse.json({
      success: true,
      data: portfolio
    });
  } catch (error) {
    console.error('Portfolio API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action } = body;

    if (action === 'rebalance') {
      // Get rebalancing recommendations
      const recommendations = await portfolioOMS.getRebalancingPlan(session.user.id);
      
      return NextResponse.json({
        success: true,
        data: {
          action: 'rebalance_recommendations',
          recommendations
        }
      });
    } else if (action === 'execute_rebalance') {
      // Execute rebalancing plan
      const { recommendations } = body;
      
      if (!recommendations || !Array.isArray(recommendations)) {
        return NextResponse.json(
          { error: 'Invalid recommendations data' },
          { status: 400 }
        );
      }

      // Execute in paper mode for now
      const results = await portfolioOMS.executeRebalancing(
        session.user.id, 
        recommendations, 
        true // paper mode
      );

      return NextResponse.json({
        success: true,
        data: {
          action: 'rebalance_executed',
          results
        }
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Portfolio Action Error:', error);
    return NextResponse.json(
      { error: 'Failed to execute portfolio action' },
      { status: 500 }
    );
  }
}
