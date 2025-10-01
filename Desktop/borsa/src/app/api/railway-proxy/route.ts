export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const RAILWAY_URL = process.env.RAILWAY_PUBLIC_URL || '';

export async function GET(request: Request) {
  if (!RAILWAY_URL) {
    return new Response(JSON.stringify({
      error: 'Railway URL not configured',
      hint: 'Set RAILWAY_PUBLIC_URL environment variable'
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const { searchParams } = new URL(request.url);
  const path = searchParams.get('path') || 'health';

  try {
    const response = await fetch(`${RAILWAY_URL}/${path}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(30000) // 30s timeout
    });

    return new Response(response.body, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
  } catch (error: any) {
    console.error('Railway proxy error:', error.message);
    return new Response(JSON.stringify({
      error: 'Railway service unavailable',
      details: error.message
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function POST(request: Request) {
  if (!RAILWAY_URL) {
    return new Response(JSON.stringify({
      error: 'Railway URL not configured',
      hint: 'Set RAILWAY_PUBLIC_URL environment variable'
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const { searchParams } = new URL(request.url);
  const path = searchParams.get('path') || 'v1/process';

  try {
    const body = await request.text();

    const response = await fetch(`${RAILWAY_URL}/${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body,
      signal: AbortSignal.timeout(30000) // 30s timeout
    });

    return new Response(response.body, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
  } catch (error: any) {
    console.error('Railway proxy error:', error.message);
    return new Response(JSON.stringify({
      error: 'Railway service unavailable',
      details: error.message
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
