/**
 * Dashboard API Route
 * Main trading dashboard data endpoint
 * © Emrah Şardağ. All rights reserved.
 */

import { NextRequest, NextResponse } from 'next/server';
import { applySecurityHeaders } from '@/lib/security/headers';

// GET /api/dashboard - Main dashboard data
export async function GET(request: NextRequest) {
  const response = new NextResponse();
  
  try {
    // Apply security headers
    applySecurityHeaders(response);

    // Mock dashboard data - in production this would come from database/APIs
    const dashboardData = {
      timestamp: new Date().toISOString(),
      user: {
        id: 'user-001',
        name: 'Premium Trader',
        tier: 'PREMIUM',
        balance: {
          total: 125430.50,
          available: 98220.30,
          locked: 27210.20
        }
      },
      portfolio: {
        totalValue: 125430.50,
        dayChange: 2847.30,
        dayChangePercent: 2.32,
        positions: [
          {
            symbol: 'BTC',
            amount: 2.5,
            value: 87500.00,
            change24h: 3.2,
            allocation: 69.7
          },
          {
            symbol: 'ETH',
            amount: 12.8,
            value: 25600.00,
            change24h: -1.5,
            allocation: 20.4
          },
          {
            symbol: 'BNB',
            amount: 45.2,
            value: 12330.50,
            change24h: 5.8,
            allocation: 9.9
          }
        ]
      },
      trading: {
        todayPnL: 1247.30,
        weekPnL: 5830.45,
        monthPnL: 12450.80,
        totalTrades: 156,
        winRate: 68.5,
        bestTrade: 2340.00,
        worstTrade: -890.50
      },
      market: {
        btcPrice: 67300.00,
        btcChange: 2.1,
        ethPrice: 2850.00,
        ethChange: -0.8,
        dominance: {
          btc: 52.4,
          eth: 17.2
        },
        fearGreedIndex: 72,
        totalMarketCap: 2.3e12
      },
      aiInsights: {
        signalStrength: 85,
        recommendation: 'BULLISH',
        confidence: 0.87,
        nextMove: 'BTC likely to test $70K resistance',
        riskLevel: 'MEDIUM',
        suggestions: [
          'Consider taking partial profits above $68K',
          'ETH showing accumulation patterns',
          'Alt season indicators strengthening'
        ]
      },
      alerts: [
        {
          id: 'alert-001',
          type: 'PRICE',
          title: 'BTC Target Reached',
          message: 'Bitcoin reached your target price of $67,000',
          timestamp: new Date(Date.now() - 1800000).toISOString(),
          severity: 'INFO'
        },
        {
          id: 'alert-002',
          type: 'SIGNAL',
          title: 'ETH Buy Signal',
          message: 'MACD crossed above signal line on ETH 4H chart',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          severity: 'SUCCESS'
        },
        {
          id: 'alert-003',
          type: 'RISK',
          title: 'High Volatility Warning',
          message: 'Increased volatility detected across major pairs',
          timestamp: new Date(Date.now() - 5400000).toISOString(),
          severity: 'WARNING'
        }
      ],
      quickActions: [
        {
          id: 'buy_btc',
          title: 'Buy BTC',
          description: 'Quick BTC purchase',
          icon: '🚀',
          color: 'success'
        },
        {
          id: 'sell_position',
          title: 'Take Profits',
          description: 'Close profitable positions',
          icon: '💰',
          color: 'warning'
        },
        {
          id: 'set_alert',
          title: 'Set Alert',
          description: 'Create price alert',
          icon: '🔔',
          color: 'info'
        },
        {
          id: 'ai_analysis',
          title: 'AI Analysis',
          description: 'Get premium insights',
          icon: '🧠',
          color: 'primary'
        }
      ],
      recentTrades: [
        {
          id: 'trade-001',
          symbol: 'BTC/USDT',
          type: 'BUY',
          amount: 0.5,
          price: 66800.00,
          value: 33400.00,
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          status: 'FILLED',
          pnl: 250.00
        },
        {
          id: 'trade-002',
          symbol: 'ETH/USDT',
          type: 'SELL',
          amount: 2.0,
          price: 2820.00,
          value: 5640.00,
          timestamp: new Date(Date.now() - 14400000).toISOString(),
          status: 'FILLED',
          pnl: -120.50
        }
      ]
    };

    return NextResponse.json({
      success: true,
      data: dashboardData
    }, { headers: response.headers });

  } catch (error) {
    console.error('Dashboard API error:', error);

    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? String(error) : 'Dashboard data temporarily unavailable'
      },
      { status: 500, headers: response.headers }
    );
  }
}

// POST /api/dashboard - Update dashboard preferences
export async function POST(request: NextRequest) {
  const response = new NextResponse();
  
  try {
    applySecurityHeaders(response);
    
    const body = await request.json();
    const { preferences, settings } = body;

    // In production, save to database
    const updatedPreferences = {
      theme: preferences?.theme || 'dark',
      layout: preferences?.layout || 'standard',
      notifications: preferences?.notifications || true,
      autoRefresh: preferences?.autoRefresh || 30,
      ...settings
    };

    return NextResponse.json({
      success: true,
      message: 'Dashboard preferences updated successfully',
      data: updatedPreferences
    }, { headers: response.headers });

  } catch (error) {
    console.error('Dashboard preferences update error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update preferences',
        message: process.env.NODE_ENV === 'development' ? String(error) : 'Unable to save preferences'
      },
      { status: 500, headers: response.headers }
    );
  }
}
