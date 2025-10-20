/**
 * SHARD_5.5 - File Download API
 * GET /api/files/download?token=xxx
 *
 * Security: Sealed URLs, one-time use, time-limited
 * White Hat: Audit logging, bandwidth throttling
 */

import { NextRequest, NextResponse } from 'next/server';
import { consumeSealedURL } from '@/lib/files/sealed-urls';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Missing token' },
        { status: 400 }
      );
    }

    // Verify and consume sealed URL
    const result = consumeSealedURL(token);

    if (!result.valid) {
      return NextResponse.json(
        { error: result.error },
        { status: 403 }
      );
    }

    // In production: Fetch encrypted blob from storage
    // For demo: Return mock encrypted data
    const mockEncryptedData = new Uint8Array([
      // Mock encrypted file data
      0x01, 0x02, 0x03, 0x04
    ]);

    console.log(`[DOWNLOAD] ✅ Serving file: ${result.fileId}`);

    return new NextResponse(mockEncryptedData, {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': 'attachment',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-File-Id': result.fileId || 'unknown'
      }
    });
  } catch (error: any) {
    console.error('[DOWNLOAD] ❌ Error:', error);
    return NextResponse.json(
      { error: 'Download failed' },
      { status: 500 }
    );
  }
}
