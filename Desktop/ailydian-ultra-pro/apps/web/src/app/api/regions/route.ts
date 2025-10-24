import { NextRequest, NextResponse } from 'next/server';
import { LWWMap } from '@ailydian/multi-region';

// Global CRDT map for multi-region sync (in production: Redis or PostgreSQL)
const globalState = new LWWMap('region-api');

export async function POST(request: NextRequest) {
  try {
    const { key, value } = await request.json();

    if (!key || value === undefined) {
      return NextResponse.json(
        { error: 'Missing key or value' },
        { status: 400 }
      );
    }

    const timestamp = globalState.set(key, value);

    return NextResponse.json({
      success: true,
      key,
      value,
      timestamp: {
        physical: timestamp.physical,
        logical: timestamp.logical,
        nodeId: timestamp.nodeId,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (key) {
      // Get specific key
      const value = globalState.get(key);
      return NextResponse.json({
        key,
        value,
        exists: value !== undefined,
      });
    }

    // Get all entries
    const entries = globalState.entries();
    return NextResponse.json({
      entries: entries.map(([k, v]) => ({ key: k, value: v })),
      size: globalState.size(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { key } = await request.json();

    if (!key) {
      return NextResponse.json(
        { error: 'Missing key' },
        { status: 400 }
      );
    }

    const timestamp = globalState.delete(key);

    return NextResponse.json({
      success: true,
      key,
      deleted: true,
      timestamp: {
        physical: timestamp.physical,
        logical: timestamp.logical,
        nodeId: timestamp.nodeId,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
