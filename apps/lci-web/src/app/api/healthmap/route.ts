// 🏥 HEALTHMAP API ROUTE - Next.js App Router
// Real-time health check for all monitored targets

import { NextResponse } from 'next/server';
import type { HealthSnapshot, HealthRow } from '@/types/health';

const HEALTH_TARGETS = [
  // Modules Group
  { name: 'Chat', url: '/chat.html', group: 'Modules' },
  { name: 'LydianIQ', url: '/lydian-iq.html', group: 'Modules' },
  { name: 'Medical', url: '/medical-expert.html', group: 'Modules' },
  { name: 'Legal', url: '/lydian-legal-search.html', group: 'Modules' },
  { name: 'AIAdvisor', url: '/ai-advisor-hub.html', group: 'Modules' },

  // Developers Group
  { name: 'API', url: '/api.html', group: 'Developers' },
  { name: 'Docs', url: '/docs.html', group: 'Developers' },
  { name: 'Console', url: '/console.html', group: 'Developers' },
  { name: 'Dashboard', url: '/dashboard.html', group: 'Developers' },

  // Company Group
  { name: 'About', url: '/about.html', group: 'Company' },
  { name: 'Careers', url: '/careers.html', group: 'Company' },
  { name: 'Contact', url: '/contact.html', group: 'Company' },
  { name: 'Blog', url: '/blog.html', group: 'Company' },
  { name: 'Help', url: '/help.html', group: 'Company' },
  { name: 'Status', url: '/status.html', group: 'Company' },
  { name: 'Privacy', url: '/privacy.html', group: 'Company' },
];

/**
 * Classify health status based on HTTP code
 */
function classifyStatus(code: number): 'up' | 'warn' | 'down' {
  if (code >= 200 && code < 300) return 'up';
  if (code >= 300 && code < 400) return 'warn';
  return 'down';
}

/**
 * Check single target health
 */
async function checkTarget(
  name: string,
  url: string,
  baseUrl: string
): Promise<HealthRow> {
  const fullUrl = `${baseUrl}${url}`;
  const startTime = Date.now();

  try {
    const response = await fetch(fullUrl, {
      method: 'HEAD',
      cache: 'no-store',
      signal: AbortSignal.timeout(5000), // 5s timeout
    });

    const ms = Date.now() - startTime;
    const status = classifyStatus(response.status);

    return {
      name,
      url,
      code: response.status,
      ms,
      status,
      err: null,
    };
  } catch (error) {
    const ms = Date.now() - startTime;
    const errorMessage =
      error instanceof Error ? error.message : 'Network error';

    return {
      name,
      url,
      code: 0,
      ms,
      status: 'down',
      err: errorMessage,
    };
  }
}

/**
 * GET /api/healthmap - Fetch health status for all targets
 */
export async function GET(request: Request) {
  try {
    // Get base URL from request or env
    const { searchParams } = new URL(request.url);
    const baseUrl =
      searchParams.get('baseUrl') ||
      process.env.NEXT_PUBLIC_BASE_URL ||
      'http://localhost:3100';

    const ts = Date.now();

    // Check all targets in parallel
    const items = await Promise.all(
      HEALTH_TARGETS.map(target =>
        checkTarget(target.name, target.url, baseUrl)
      )
    );

    const snapshot: HealthSnapshot = {
      ts,
      items,
    };

    return NextResponse.json(snapshot, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Healthmap API error:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch health data',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS /api/healthmap - CORS preflight
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
