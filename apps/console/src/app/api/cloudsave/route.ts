/**
 * CloudSave API - Persist game state
 * GET  /api/cloudsave → { save: SaveBlob | null }
 * POST /api/cloudsave → { ok: boolean }
 *
 * Note: This is a stub implementation that returns null/ok
 * to trigger localStorage fallback on the client side.
 * For production, integrate with a proper database.
 */

import { NextRequest, NextResponse } from 'next/server';

type SaveBlob = {
  version: number;
  at: number;
  checkpoint: string;
  doorOpen: boolean;
  pos?: [number, number, number];
  puzzleColumns?: number[];
};

// In-memory storage for demo purposes (resets on server restart)
const memoryStore = new Map<string, SaveBlob>();

export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id') || 'guest';

  // Return save from memory store
  const save = memoryStore.get(userId) || null;
  return NextResponse.json({ save });
}

export async function POST(req: NextRequest) {
  const userId = req.headers.get('x-user-id') || 'guest';

  try {
    const blob: SaveBlob = await req.json();
    if (!blob || typeof blob !== 'object') {
      return NextResponse.json({ error: 'Invalid save data' }, { status: 400 });
    }

    // Save to memory store
    memoryStore.set(userId, blob);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('CloudSave POST parsing error:', err);
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
