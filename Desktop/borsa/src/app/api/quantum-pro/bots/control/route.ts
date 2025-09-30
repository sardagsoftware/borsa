/**
 * QUANTUM PRO BOTS CONTROL API
 * Start, stop, pause trading bots
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Reference to bots database (imported from parent route in production)
// For now, we'll maintain state here
const botsStateMap = new Map<string, { status: string, lastUpdate: string }>();

// POST /api/quantum-pro/bots/control - Control bot
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { botId, action } = body;

    if (!botId || !action) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameters: botId, action'
      }, { status: 400 });
    }

    const validActions = ['start', 'stop', 'pause', 'restart'];
    if (!validActions.includes(action)) {
      return NextResponse.json({
        success: false,
        error: `Invalid action. Must be one of: ${validActions.join(', ')}`
      }, { status: 400 });
    }

    // Update bot status
    let newStatus = 'stopped';
    switch (action) {
      case 'start':
      case 'restart':
        newStatus = 'running';
        break;
      case 'stop':
        newStatus = 'stopped';
        break;
      case 'pause':
        newStatus = 'paused';
        break;
    }

    botsStateMap.set(botId, {
      status: newStatus,
      lastUpdate: new Date().toISOString()
    });

    let message = '';
    switch (action) {
      case 'start':
        message = 'Bot başarıyla başlatıldı';
        break;
      case 'stop':
        message = 'Bot durduruldu';
        break;
      case 'pause':
        message = 'Bot duraklatıldı';
        break;
      case 'restart':
        message = 'Bot yeniden başlatıldı';
        break;
    }

    return NextResponse.json({
      success: true,
      botId,
      action,
      newStatus,
      message,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Bots control API error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// GET /api/quantum-pro/bots/control - Get bot status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const botId = searchParams.get('botId');

    if (!botId) {
      return NextResponse.json({
        success: false,
        error: 'Missing botId parameter'
      }, { status: 400 });
    }

    const botState = botsStateMap.get(botId);
    if (!botState) {
      return NextResponse.json({
        success: false,
        error: 'Bot not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      botId,
      status: botState.status,
      lastUpdate: botState.lastUpdate,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Bots control GET API error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}