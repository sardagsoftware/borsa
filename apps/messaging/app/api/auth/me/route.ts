/**
 * GET /api/auth/me
 * Returns current user information
 */

import { NextResponse } from 'next/server';

export async function GET() {
  // Mock user data for demo
  const user = {
    id: 'user-001',
    username: 'you',
    displayName: 'You',
    email: 'user@ailydian.com',
    avatar: null,
    status: 'online',
    lastSeen: Date.now(),
    e2eeEnabled: true,
    createdAt: Date.now() - 86400000 * 30 // 30 days ago
  };

  return NextResponse.json(user);
}
