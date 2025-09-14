import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Demo user profile data
    const userProfile = {
      id: '1',
      name: session.user?.name || 'Demo Kullanıcı',
      email: session.user?.email || 'demo@ailydian.com',
      riskLevel: 'MEDIUM',
      maxDailyLoss: 1000,
      twoFactorEnabled: false,
      isActive: true,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };

    return NextResponse.json(userProfile);
  } catch (error) {
    console.error('Profile API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate required fields
    if (!body.name && !body.riskLevel && !body.maxDailyLoss) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    // Simulate profile update
    console.log('Profile update request:', body);
    
    // In a real app, update the database here
    const updatedProfile = {
      id: '1',
      name: body.name || session.user?.name || 'Demo Kullanıcı',
      email: session.user?.email || 'demo@ailydian.com',
      riskLevel: body.riskLevel || 'MEDIUM',
      maxDailyLoss: body.maxDailyLoss || 1000,
      twoFactorEnabled: false,
      isActive: true,
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json(updatedProfile);
  } catch (error) {
    console.error('Profile Update API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
