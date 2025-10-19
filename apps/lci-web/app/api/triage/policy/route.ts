import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const flagsPath = path.join(process.cwd(), 'public/data/flags.json');
    const triagePath = path.join(process.cwd(), 'public/data/triage.json');

    const flags = JSON.parse(fs.readFileSync(flagsPath, 'utf-8'));
    const triage = JSON.parse(fs.readFileSync(triagePath, 'utf-8'));

    return NextResponse.json({
      flags,
      triage,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Failed to load triage policy:', error);
    return NextResponse.json(
      { error: 'Failed to load triage policy' },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
