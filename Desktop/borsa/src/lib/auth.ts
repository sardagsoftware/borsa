/**
 * AUTHENTICATION UTILITIES
 * JWT verification and authentication helpers
 */

import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production-min-32-chars-12345678';

export interface AuthUser {
  email: string;
  role: string;
  iat: number;
  exp: number;
}

/**
 * Verify JWT token from request cookies
 * Returns user data if valid, null if invalid
 */
export function verifyAuth(request: NextRequest): AuthUser | null {
  try {
    const token = request.cookies.get('lydian-auth')?.value;

    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    return decoded;

  } catch (error) {
    return null;
  }
}

/**
 * Check if request is authenticated
 */
export function isAuthenticated(request: NextRequest): boolean {
  return verifyAuth(request) !== null;
}

/**
 * Get authenticated user from request
 */
export function getAuthUser(request: NextRequest): AuthUser | null {
  return verifyAuth(request);
}