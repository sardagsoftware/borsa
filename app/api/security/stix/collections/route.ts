import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    data: {
      collections: [],
      total: 0,
      message: 'STIX collections API is available'
    }
  });
}

export async function POST(request: NextRequest) {
  return NextResponse.json({
    success: true,
    data: {
      id: Date.now().toString(),
      message: 'Collection creation API is available'
    }
  });
}
