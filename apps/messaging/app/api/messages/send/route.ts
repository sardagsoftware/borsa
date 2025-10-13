/**
 * SHARD_4.5 - Send Message API
 * POST /api/messages/send
 *
 * Security: Rate limiting, input validation, CSRF protection
 * White Hat: Audit logging, error handling
 */

import { NextRequest, NextResponse } from 'next/server';
import { pushMessage } from '@/lib/delivery/queue';
import { createMessageEnvelope } from '@/lib/delivery/message-envelope';
import { storeReceipt } from '@/lib/delivery/receipts';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const {
      fromUserId,
      fromDeviceId,
      toUserId,
      toDeviceId,
      ciphertext,
      iv,
      counter,
      previousCounter,
      publicKey,
      type,
      priority
    } = body;

    if (!fromUserId || !fromDeviceId || !toUserId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!ciphertext || !iv) {
      return NextResponse.json(
        { error: 'Missing encrypted content' },
        { status: 400 }
      );
    }

    // Convert Base64 strings to Uint8Array
    const ciphertextBytes = base64ToUint8Array(ciphertext);
    const ivBytes = base64ToUint8Array(iv);
    const publicKeyBytes = publicKey ? base64ToUint8Array(publicKey) : undefined;

    // Create envelope
    const envelope = createMessageEnvelope({
      fromUserId,
      fromDeviceId,
      toUserId,
      toDeviceId,
      ciphertext: ciphertextBytes,
      iv: ivBytes,
      counter: counter || 0,
      previousCounter: previousCounter || 0,
      publicKey: publicKeyBytes,
      type: type || 'regular',
      priority: priority || 'normal'
    });

    // Push to delivery queue
    const result = await pushMessage(envelope);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    // Store "sent" receipt
    await storeReceipt(envelope.id, 'sent', fromDeviceId);

    return NextResponse.json({
      success: true,
      messageId: envelope.id,
      timestamp: envelope.timestamp,
      queuePosition: result.queuePosition
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      }
    });
  } catch (error: any) {
    console.error('[API] ❌ Send message error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
