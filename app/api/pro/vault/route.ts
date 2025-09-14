import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { vault } from '@/lib/pro/vault';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Mock response for now - vault system will be integrated with database
    const mockCredentials = [
      {
        id: '1',
        exchange: 'binance',
        label: 'Main Trading Account',
        isActive: true,
        createdAt: new Date(),
        lastUsed: new Date()
      }
    ];

    return NextResponse.json({
      success: true,
      data: mockCredentials
    });
  } catch (error) {
    console.error('Vault API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { exchange, label, apiKey, secretKey, passphrase } = body;

    // Validation
    if (!exchange || !label || !apiKey || !secretKey) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Store encrypted credentials
    const credentialId = await vault.storeCredentials(
      session.user.id,
      exchange,
      label,
      { 
        apiKey, 
        secret: secretKey, 
        passphrase,
        sandbox: false 
      }
    );

    return NextResponse.json({
      success: true,
      data: { id: credentialId }
    });
  } catch (error) {
    console.error('Vault Store Error:', error);
    return NextResponse.json(
      { error: 'Failed to store credentials' },
      { status: 500 }
    );
  }
}
