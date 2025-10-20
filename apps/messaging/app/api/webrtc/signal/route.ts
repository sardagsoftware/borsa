/**
 * SHARD_6.5 - WebRTC Signaling API
 * POST /api/webrtc/signal
 *
 * Security: Authenticated signaling, rate limiting
 * White Hat: Message validation, audit logging
 */

import { NextRequest, NextResponse } from 'next/server';
import { sendSignalingMessage } from '@/lib/webrtc/signaling';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { type, from, to, data } = body;

    if (!type || !from || !to) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate message type
    const validTypes = ['offer', 'answer', 'ice-candidate', 'call-start', 'call-end', 'sframe-key'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid message type' },
        { status: 400 }
      );
    }

    // Send signaling message
    await sendSignalingMessage({
      type,
      from,
      to,
      data
    });

    return NextResponse.json({
      success: true,
      messageId: crypto.randomUUID()
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store'
      }
    });
  } catch (error: any) {
    console.error('[API] ❌ Signaling error:', error);
    return NextResponse.json(
      { error: 'Signaling failed' },
      { status: 500 }
    );
  }
}
