import { NextResponse } from 'next/server';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { adminTools } from '@/lib/pro/admin';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin (you might want to implement proper role checking)
    // For now, we'll allow all authenticated users

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'health') {
      const health = await adminTools.performHealthCheck();
      return NextResponse.json({
        success: true,
        data: health
      });
    } else if (action === 'stats') {
      const stats = await adminTools.getSystemStats();
      return NextResponse.json({
        success: true,
        data: stats
      });
    } else if (action === 'config') {
      const config = await adminTools.exportConfig();
      return NextResponse.json({
        success: true,
        data: config
      });
    }

    // Default: return system overview
    const health = await adminTools.performHealthCheck();
    const stats = await adminTools.getSystemStats();

    return NextResponse.json({
      success: true,
      data: {
        health: health.overall,
        services: Object.keys(health.services).length,
        healthyServices: Object.values(health.services).filter(s => s.status === 'healthy').length,
        uptime: stats.uptime,
        version: stats.version
      }
    });
  } catch (error) {
    console.error('Admin API Error:', error);
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

    if (!action) {
      return NextResponse.json(
        { error: 'Missing action' },
        { status: 400 }
      );
    }

    if (action === 'autofix') {
      const results = await adminTools.autoFix();
      return NextResponse.json({
        success: true,
        data: {
          action: 'autofix',
          results
        }
      });
    } else if (action === 'setup') {
      const setupResults = await adminTools.runSetupWizard();
      return NextResponse.json({
        success: true,
        data: {
          action: 'setup',
          results: setupResults
        }
      });
    } else if (action === 'maintenance') {
      const { enable, reason } = body;
      
      if (enable) {
        if (!reason) {
          return NextResponse.json(
            { error: 'Maintenance reason required' },
            { status: 400 }
          );
        }
        await adminTools.enableMaintenanceMode(reason);
      } else {
        await adminTools.disableMaintenanceMode();
      }

      return NextResponse.json({
        success: true,
        data: {
          action: 'maintenance',
          enabled: enable,
          reason
        }
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Admin Action Error:', error);
    return NextResponse.json(
      { error: 'Failed to execute admin action' },
      { status: 500 }
    );
  }
}
