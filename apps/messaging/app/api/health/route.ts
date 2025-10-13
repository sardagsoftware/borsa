import { NextResponse } from 'next/server';

export async function GET() {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'ailydian-messaging',
    version: '1.0.0',
    e2ee: 'active',
    components: {
      crypto: 'ready',
      delivery: 'ready',
      webrtc: 'ready',
      storage: 'ready'
    }
  };

  return NextResponse.json(health, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'X-Robots-Tag': 'noindex, nofollow, noarchive'
    }
  });
}
