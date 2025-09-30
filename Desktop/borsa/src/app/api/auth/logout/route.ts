/**
 * SECURE LOGOUT API
 * Clears authentication cookies securely
 */

import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: 'Çıkış başarılı'
  });

  // Clear auth cookie
  response.cookies.set('lydian-auth', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0, // Expire immediately
    path: '/'
  });

  return response;
}

export async function GET() {
  return POST();
}