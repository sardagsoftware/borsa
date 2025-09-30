/**
 * TOKEN VERIFICATION API
 * Verifies JWT token from cookie
 */

import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production-min-32-chars-12345678';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('lydian-auth')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, authenticated: false },
        { status: 401 }
      );
    }

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    return NextResponse.json({
      success: true,
      authenticated: true,
      user: {
        email: decoded.email,
        role: decoded.role
      }
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, authenticated: false, error: 'Invalid token' },
      { status: 401 }
    );
  }
}