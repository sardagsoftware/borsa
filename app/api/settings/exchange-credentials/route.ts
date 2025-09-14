import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { encrypt, decrypt } from '@/lib/security/encryption';

// Exchange credentials interface
interface ApiCredentials {
  id?: string;
  userId: string;
  exchangeId: string;
  apiKey: string;
  apiSecret: string;
  passphrase?: string;
  testnet: boolean;
  enabled: boolean;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}

// In-memory storage for demo (use database in production)
const credentialsStore: Map<string, ApiCredentials[]> = new Map();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userCredentials = credentialsStore.get(session.user.email) || [];
    
    // Decrypt and return credentials (without sensitive data)
    const safeCredentials = userCredentials.map(cred => ({
      exchangeId: cred.exchangeId,
      apiKey: cred.apiKey ? '***' + cred.apiKey.slice(-4) : '',
      testnet: cred.testnet,
      enabled: cred.enabled,
      permissions: cred.permissions,
      updatedAt: cred.updatedAt
    }));

    return NextResponse.json(safeCredentials);
  } catch (error) {
    console.error('Failed to get credentials:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { exchangeId, apiKey, apiSecret, passphrase, testnet, enabled, permissions } = body;

    // Validate required fields
    if (!exchangeId || !apiKey || !apiSecret) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Encrypt sensitive data
    const encryptedApiKey = await encrypt(apiKey);
    const encryptedApiSecret = await encrypt(apiSecret);
    const encryptedPassphrase = passphrase ? await encrypt(passphrase) : undefined;

    const userCredentials = credentialsStore.get(session.user.email) || [];
    
    // Remove existing credentials for this exchange
    const filteredCredentials = userCredentials.filter(cred => cred.exchangeId !== exchangeId);
    
    // Add new credentials
    const newCredentials: ApiCredentials = {
      id: `${exchangeId}_${Date.now()}`,
      userId: session.user.email,
      exchangeId,
      apiKey: encryptedApiKey,
      apiSecret: encryptedApiSecret,
      passphrase: encryptedPassphrase,
      testnet: testnet || false,
      enabled: enabled || false,
      permissions: permissions || [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    filteredCredentials.push(newCredentials);
    credentialsStore.set(session.user.email, filteredCredentials);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to save credentials:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const exchangeId = url.pathname.split('/').pop();

    if (!exchangeId) {
      return NextResponse.json({ error: 'Exchange ID required' }, { status: 400 });
    }

    const userCredentials = credentialsStore.get(session.user.email) || [];
    const filteredCredentials = userCredentials.filter(cred => cred.exchangeId !== exchangeId);
    
    credentialsStore.set(session.user.email, filteredCredentials);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete credentials:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
