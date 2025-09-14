import { NextRequest, NextResponse } from "next/server";
import { getDeviceContext } from "@/lib/ab/assign";

// Rate limiting map - in production, use Redis
const requestCounts = new Map<string, { count: number; resetTime: number }>();

/**
 * Simple rate limiting: max 10 requests per minute per IP
 */
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const limit = 10;
  
  const existing = requestCounts.get(ip);
  
  if (!existing || now > existing.resetTime) {
    // New window
    requestCounts.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (existing.count >= limit) {
    return false;
  }
  
  existing.count++;
  return true;
}

/**
 * UI Telemetry API endpoint
 * Tracks A/B test exposure and user interactions
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' }, 
        { status: 429 }
      );
    }
    
    // Parse request body
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: 'Invalid JSON body' }, 
        { status: 400 }
      );
    }
    
    // Extract device context
    const deviceContext = getDeviceContext(request.headers);
    
    // Get A/B variant from cookie
    const abVariant = request.cookies.get('ab-variant')?.value || 'unknown';
    
    // Validate required fields
    const { eventType, data } = body;
    if (!eventType || !data) {
      return NextResponse.json(
        { error: 'Missing eventType or data' }, 
        { status: 400 }
      );
    }
    
    // Create telemetry event
    const telemetryEvent = {
      timestamp: new Date().toISOString(),
      eventType,
      sessionId: body.sessionId || 'anonymous',
      abVariant,
      deviceContext,
      ip: ip.split(',')[0].trim(), // First IP in case of multiple
      userAgent: request.headers.get('user-agent')?.substring(0, 200), // Truncate
      path: data.path || 'unknown',
      ...data // Include all additional data
    };
    
    // Log event (in production, send to analytics service)
    console.log('📊 UI Telemetry Event:', JSON.stringify(telemetryEvent, null, 2));
    
    // Here you would typically:
    // 1. Send to your analytics service (Google Analytics, Mixpanel, etc.)
    // 2. Store in database for A/B test analysis
    // 3. Send to real-time monitoring (DataDog, etc.)
    
    // For demo purposes, we'll just return success
    return NextResponse.json({ 
      success: true, 
      eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      receivedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Telemetry API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

/**
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({ 
    status: 'healthy',
    service: 'ui-telemetry',
    timestamp: new Date().toISOString()
  });
}
