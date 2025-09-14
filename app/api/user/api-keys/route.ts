import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Demo API keys data
    const apiKeys = [
      {
        id: '1',
        exchange: 'BINANCE',
        name: 'Ana İşlem Anahtarı',
        isTestnet: false,
        isActive: true,
        permissions: ['spot', 'futures', 'read'],
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
      },
      {
        id: '2',
        exchange: 'BYBIT',
        name: 'Test Anahtarı',
        isTestnet: true,
        isActive: true,
        permissions: ['spot', 'read'],
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
      },
    ];

    return NextResponse.json(apiKeys);
  } catch (error) {
    console.error('API Keys GET Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate required fields
    if (!body.exchange || !body.name || !body.apiKey || !body.secretKey) {
      return NextResponse.json({ 
        error: 'Missing required fields: exchange, name, apiKey, secretKey' 
      }, { status: 400 });
    }

    // Simulate API key creation
    console.log('API key creation request:', {
      exchange: body.exchange,
      name: body.name,
      isTestnet: body.isTestnet || false,
      permissions: body.permissions || ['spot', 'read']
    });
    
    const newApiKey = {
      id: Date.now().toString(),
      exchange: body.exchange,
      name: body.name,
      isTestnet: body.isTestnet || false,
      isActive: true,
      permissions: body.permissions || ['spot', 'read'],
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json(newApiKey, { status: 201 });
  } catch (error) {
    console.error('API Keys POST Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
