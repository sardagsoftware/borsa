import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    data: {
      packages: [],
      total: 0,
      message: 'STIX packages API is available'
    }
  });
}

export async function POST(request: NextRequest) {
  return NextResponse.json({
    success: true,
    data: {
      id: Date.now().toString(),
      message: 'Package creation API is available'
    }
  });
}
