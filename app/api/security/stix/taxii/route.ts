import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    data: {
      taxiiServers: [],
      total: 0,
      message: 'STIX TAXII API is available'
    }
  });
}

export async function POST(request: NextRequest) {
  return NextResponse.json({
    success: true,
    data: {
      id: Date.now().toString(),
      message: 'TAXII server creation API is available'
    }
  });
}
