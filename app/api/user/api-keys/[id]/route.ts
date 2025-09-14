import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    
    // Simulate API key deletion
    console.log('API key deletion request for ID:', id);
    
    // In a real app, delete from database here
    
    return NextResponse.json({ 
      success: true, 
      message: 'API key deleted successfully' 
    });
  } catch (error) {
    console.error('API Key DELETE Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
