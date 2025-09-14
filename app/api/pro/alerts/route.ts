import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { alertsEngine } from '@/lib/pro/alerts';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Mock alert rules for now
    const mockAlerts = [
      {
        id: '1',
        name: 'High Error Rate',
        condition: 'error_rate > 5',
        isActive: true,
        channel: 'slack',
        severity: 'critical',
        createdAt: new Date(),
        triggerCount: 3
      },
      {
        id: '2',
        name: 'Portfolio Loss Alert',
        condition: 'portfolio_loss > 10',
        isActive: true,
        channel: 'telegram',
        severity: 'warning',
        createdAt: new Date(),
        triggerCount: 0
      }
    ];

    return NextResponse.json({
      success: true,
      data: mockAlerts
    });
  } catch (error) {
    console.error('Alerts API Error:', error);
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
    const { name, condition, threshold, channel, severity } = body;

    // Validation
    if (!name || !condition || threshold === undefined || !channel || !severity) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create alert rule (mock for now)
    const alertId = Math.random().toString(36).substring(2, 15);

    return NextResponse.json({
      success: true,
      data: {
        id: alertId,
        name,
        condition: condition.replace('threshold', threshold.toString()),
        isActive: true,
        channel,
        severity,
        createdAt: new Date(),
        triggerCount: 0
      }
    });
  } catch (error) {
    console.error('Create Alert Error:', error);
    return NextResponse.json(
      { error: 'Failed to create alert' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, action } = body;

    if (!id || !action) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (action === 'toggle') {
      const { isActive } = body;
      
      return NextResponse.json({
        success: true,
        data: {
          id,
          action: 'toggled',
          isActive
        }
      });
    } else if (action === 'test') {
      // Test alert (mock implementation)
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay
      
      return NextResponse.json({
        success: true,
        data: {
          id,
          action: 'test',
          result: 'success',
          message: 'Test alert sent successfully'
        }
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Alert Action Error:', error);
    return NextResponse.json(
      { error: 'Failed to execute alert action' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Missing alert ID' },
        { status: 400 }
      );
    }

    // Delete alert (mock for now)
    return NextResponse.json({
      success: true,
      data: {
        id,
        action: 'deleted'
      }
    });
  } catch (error) {
    console.error('Delete Alert Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete alert' },
      { status: 500 }
    );
  }
}
