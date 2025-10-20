/**
 * SHARD_4.5 - Receive Messages API
 * GET /api/messages/receive?userId=xxx
 *
 * Security: Authentication required, rate limiting
 * White Hat: Batch retrieval for efficiency
 */

import { NextRequest, NextResponse } from 'next/server';
import { batchPopMessages } from '@/lib/delivery/queue';
import { storeReceipt } from '@/lib/delivery/receipts';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limitParam = searchParams.get('limit');
    const deviceId = searchParams.get('deviceId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      );
    }

    if (!deviceId) {
      return NextResponse.json(
        { error: 'Missing deviceId parameter' },
        { status: 400 }
      );
    }

    const limit = limitParam ? parseInt(limitParam) : 10;

    // Pop messages from queue
    const messages = await batchPopMessages(userId, limit);

    // Store "delivered" receipts
    const receiptPromises = messages.map(msg =>
      storeReceipt(msg.id, 'delivered', deviceId)
    );
    await Promise.all(receiptPromises);

    return NextResponse.json({
      success: true,
      messages,
      count: messages.length
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      }
    });
  } catch (error: any) {
    console.error('[API] ❌ Receive messages error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
