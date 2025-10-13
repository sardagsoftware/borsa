/**
 * GET /api/chats
 * Returns user's chat list with recent messages
 */

import { NextResponse } from 'next/server';

export async function GET() {
  // Mock chats data matching the UI
  const chats = [
    {
      id: 'chat-001',
      userId: 'user-alice',
      userName: 'Alice Johnson',
      lastMessage: 'Hey! How are you doing?',
      timestamp: Date.now() - 900000, // 15 min ago (10:45 would be)
      unreadCount: 6,
      isOnline: true,
      isPinned: false,
      isMuted: false,
      isArchived: false,
      e2eeEnabled: true
    },
    {
      id: 'chat-002',
      userId: 'user-bob',
      userName: 'Bob Smith',
      lastMessage: "Let me know when you're free",
      timestamp: Date.now() - 840000, // 14 min ago (10:46 would be)
      unreadCount: 0,
      isOnline: false,
      isPinned: false,
      isMuted: false,
      isArchived: false,
      e2eeEnabled: true
    },
    {
      id: 'chat-003',
      userId: 'user-carol',
      userName: 'Carol Williams',
      lastMessage: 'Thanks for the help yesterday!',
      timestamp: Date.now() - 3600000 * 2, // 2 hours ago (09:51 would be)
      unreadCount: 2,
      isOnline: false,
      isPinned: false,
      isMuted: false,
      isArchived: false,
      e2eeEnabled: true
    }
  ];

  return NextResponse.json(chats);
}
