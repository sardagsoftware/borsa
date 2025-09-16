import { NextResponse } from 'next/server';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { drManager } from '@/lib/pro/dr';

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
    const limit = parseInt(searchParams.get('limit') || '20');

    if (action === 'list') {
      const snapshots = await drManager.listSnapshots(limit);
      return NextResponse.json({
        success: true,
        data: snapshots
      });
    } else if (action === 'stats') {
      const stats = await drManager.getStatistics();
      return NextResponse.json({
        success: true,
        data: stats
      });
    }

    // Default: return DR overview
    const stats = await drManager.getStatistics();
    const recentSnapshots = await drManager.listSnapshots(5);

    return NextResponse.json({
      success: true,
      data: {
        stats,
        recentSnapshots
      }
    });
  } catch (error) {
    console.error('DR API Error:', error);
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

    if (action === 'create_snapshot') {
      const { options = {} } = body;
      
      const snapshot = await drManager.createSnapshot(options);
      
      return NextResponse.json({
        success: true,
        data: {
          action: 'create_snapshot',
          snapshot: {
            version: snapshot.version,
            timestamp: snapshot.timestamp,
            hash: snapshot.hash
          }
        }
      });
    } else if (action === 'restore') {
      const { snapshotId, options = {} } = body;
      
      if (!snapshotId) {
        return NextResponse.json(
          { error: 'Snapshot ID required' },
          { status: 400 }
        );
      }

      const success = await drManager.restoreFromSnapshot(snapshotId, options);
      
      return NextResponse.json({
        success: true,
        data: {
          action: 'restore',
          snapshotId,
          success
        }
      });
    } else if (action === 'cleanup') {
      const { retentionDays = 30 } = body;
      
      const cleanedCount = await drManager.cleanupSnapshots(retentionDays);
      
      return NextResponse.json({
        success: true,
        data: {
          action: 'cleanup',
          cleanedCount,
          retentionDays
        }
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('DR Action Error:', error);
    return NextResponse.json(
      { error: 'Failed to execute DR action' },
      { status: 500 }
    );
  }
}
