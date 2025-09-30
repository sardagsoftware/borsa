/**
 * API AUTHENTICATION MIDDLEWARE
 * Protects API routes - requires valid JWT token
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';

/**
 * Middleware to protect API routes
 * Returns 401 if not authenticated
 */
export function withAuth(handler: (req: NextRequest, user: any) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    const user = verifyAuth(request);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
          message: 'Authentication required. Please login.'
        },
        { status: 401 }
      );
    }

    // Call the original handler with authenticated user
    return handler(request, user);
  };
}

/**
 * Optional auth - doesn't block if not authenticated
 * But provides user data if available
 */
export function withOptionalAuth(handler: (req: NextRequest, user: any | null) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    const user = verifyAuth(request);
    return handler(request, user);
  };
}