/**
 * Get ICE servers configuration
 * GET /api/webrtc/ice-servers
 */

import { NextResponse } from 'next/server';

export async function GET() {
  // Default ICE servers configuration
  const iceServers = [
    // Public STUN servers
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },

    // In production: Add your TURN servers here
    // {
    //   urls: 'turn:turn.example.com:3478',
    //   username: process.env.TURN_USERNAME,
    //   credential: process.env.TURN_CREDENTIAL
    // }
  ];

  return NextResponse.json({
    iceServers
  }, {
    status: 200,
    headers: {
      'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
    }
  });
}
