/**
 * GET /api/contacts
 * Returns user's contact list
 */

import { NextResponse } from 'next/server';

export async function GET() {
  // Mock contacts data
  const contacts = [
    {
      id: 'user-alice',
      username: 'alice.johnson',
      displayName: 'Alice Johnson',
      avatar: null,
      status: 'online',
      lastSeen: Date.now(),
      e2eeEnabled: true
    },
    {
      id: 'user-bob',
      username: 'bob.smith',
      displayName: 'Bob Smith',
      avatar: null,
      status: 'away',
      lastSeen: Date.now() - 300000, // 5 min ago
      e2eeEnabled: true
    },
    {
      id: 'user-carol',
      username: 'carol.williams',
      displayName: 'Carol Williams',
      avatar: null,
      status: 'offline',
      lastSeen: Date.now() - 7200000, // 2 hours ago
      e2eeEnabled: true
    }
  ];

  return NextResponse.json(contacts);
}
