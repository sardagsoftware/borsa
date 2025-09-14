import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { deploymentManager } from '@/lib/pro/canary';
import { featureFlags } from '@/lib/pro/flags';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'status') {
      const status = deploymentManager.getDeploymentStatus();
      return NextResponse.json({
        success: true,
        data: status
      });
    } else if (action === 'flags') {
      const flags = await featureFlags.getAllFlags();
      return NextResponse.json({
        success: true,
        data: flags
      });
    }

    // Default: return deployment overview
    const status = deploymentManager.getDeploymentStatus();
    const flags = await featureFlags.getAllFlags();

    return NextResponse.json({
      success: true,
      data: {
        deployment: {
          strategy: status.strategy.type,
          isDeploying: status.isDeploying,
          canaryActive: status.canaryStatus.isActive,
          canaryPercent: status.canaryStatus.percent
        },
        flags: Object.keys(flags).length,
        activeFlags: Object.values(flags).filter(Boolean).length
      }
    });
  } catch (error) {
    console.error('Deployment API Error:', error);
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

    if (action === 'deploy') {
      const { version, options = {} } = body;
      
      if (!version) {
        return NextResponse.json(
          { error: 'Version required' },
          { status: 400 }
        );
      }

      const success = await deploymentManager.startDeployment(version, options);
      
      return NextResponse.json({
        success: true,
        data: {
          action: 'deploy',
          version,
          success,
          status: deploymentManager.getDeploymentStatus()
        }
      });
    } else if (action === 'rollback') {
      const { reason } = body;
      
      if (!reason) {
        return NextResponse.json(
          { error: 'Rollback reason required' },
          { status: 400 }
        );
      }

      const success = await deploymentManager.emergencyRollback(reason);
      
      return NextResponse.json({
        success: true,
        data: {
          action: 'rollback',
          success,
          reason
        }
      });
    } else if (action === 'flag') {
      const { flagName, value } = body;
      
      if (!flagName) {
        return NextResponse.json(
          { error: 'Flag name required' },
          { status: 400 }
        );
      }

      await featureFlags.setFlag(flagName, value);
      
      return NextResponse.json({
        success: true,
        data: {
          action: 'flag',
          flagName,
          value
        }
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Deployment Action Error:', error);
    return NextResponse.json(
      { error: 'Failed to execute deployment action' },
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
    const { flags } = body;

    if (!flags || typeof flags !== 'object') {
      return NextResponse.json(
        { error: 'Invalid flags data' },
        { status: 400 }
      );
    }

    // Bulk update flags - individual updates for now
    for (const [flagName, value] of Object.entries(flags)) {
      await featureFlags.setFlag(flagName, Boolean(value));
    }

    return NextResponse.json({
      success: true,
      data: {
        action: 'bulk_update',
        updated: Object.keys(flags).length
      }
    });
  } catch (error) {
    console.error('Bulk Flag Update Error:', error);
    return NextResponse.json(
      { error: 'Failed to update flags' },
      { status: 500 }
    );
  }
}
