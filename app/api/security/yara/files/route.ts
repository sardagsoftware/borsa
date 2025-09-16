/**

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'; * 🛡️ AILYDIAN — SOC++ YARA Files API
 * 
 * YARA file scanning and analysis
 * - Upload and scan files against YARA rules
 * - Batch file processing
 * - Scan result management
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { yaraScanner } from '@/lib/security/yara';
import crypto from 'crypto';
import fs from 'fs';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const action = formData.get('action') as string || 'scan';

    switch (action) {
      case 'scan':
        return handleFileScan(formData);
        
      case 'batch_scan':
        return handleBatchScan(formData);
        
      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported: scan, batch_scan' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('YARA files error:', error);
    return NextResponse.json(
      { 
        error: 'File processing failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const scanId = searchParams.get('scanId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (scanId) {
      return handleGetScanResults(scanId);
    }

    // List scan history
    const where: Record<string, unknown> = {};
    if (status) {
      where.status = status;
    }

    const scans = await prisma.yaraScan.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset
    });

    const totalCount = await prisma.yaraScan.count({ where });

    return NextResponse.json({
      success: true,
      data: {
        scans: scans.map((scan: { 
          id: string; 
          target: string; 
          targetType: string; 
          sizeMb: number | null; 
          status: string; 
          timestamp: Date; 
          matches: unknown; 
          scanTime: number | null; 
          ruleCount: number; 
        }) => ({
          id: scan.id,
          target: scan.target,
          targetType: scan.targetType,
          sizeMb: scan.sizeMb,
          status: scan.status,
          timestamp: scan.timestamp,
          matchCount: Array.isArray(scan.matches) ? scan.matches.length : 0,
          scanTime: scan.scanTime,
          ruleCount: scan.ruleCount
        })),
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount
        }
      }
    });

  } catch (error) {
    console.error('YARA files GET error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to retrieve scans', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

/**
 * Handle single file scan
 */
async function handleFileScan(formData: FormData) {
  const file = formData.get('file') as File;
  const options = formData.get('options') as string;

  if (!file) {
    return NextResponse.json(
      { error: 'File is required' },
      { status: 400 }
    );
  }

  // Validate file size (max 100MB)
  if (file.size > 100 * 1024 * 1024) {
    return NextResponse.json(
      { error: 'File too large. Maximum size is 100MB.' },
      { status: 400 }
    );
  }

  try {
    // Read file contents
    const fileBuffer = await file.arrayBuffer();
    const fileContent = new Uint8Array(fileBuffer);

    // Parse options
    const scanOptions = options ? JSON.parse(options) : {};

    // Calculate file hash and size
    const fileHash = crypto.createHash('sha256').update(fileContent).digest('hex');
    const sizeMb = file.size / (1024 * 1024);

    const startTime = Date.now();

    // Create scan record
    const scan = await prisma.yaraScan.create({
      data: {
        timestamp: new Date(),
        target: `file:${file.name}:${fileHash}`,
        targetType: 'file',
        sizeMb,
        status: 'pending',
        matches: [],
        ruleCount: 0
      }
    });

    try {
      // Create a temporary file for scanning (YARA scanner expects file path)
      const tempFileName = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const tempFilePath = `/tmp/${tempFileName}`;
      
      // Write file content to temporary file
      fs.writeFileSync(tempFilePath, fileContent);

      // Perform scan using YARA library
      const scanResults = await yaraScanner.scanFile(tempFilePath, scanOptions);
      const scanTime = (Date.now() - startTime) / 1000;

      // Clean up temporary file
      fs.unlinkSync(tempFilePath);

      // Extract matches from scan results
      const allMatches = scanResults.flatMap(result => result.matches || []);
      const totalRules = scanResults.length;

      // Update scan with results
      await prisma.yaraScan.update({
        where: { id: scan.id },
        data: {
          status: 'completed',
          matches: JSON.parse(JSON.stringify(allMatches)),
          scanTime,
          ruleCount: totalRules
        }
      });

      return NextResponse.json({
        success: true,
        data: {
          scanId: scan.id,
          fileName: file.name,
          fileSize: file.size,
          fileHash,
          matchCount: allMatches.length,
          matches: allMatches,
          results: scanResults,
          status: 'completed',
          scanTime
        }
      });

    } catch (scanError) {
      // Update scan with error status
      await prisma.yaraScan.update({
        where: { id: scan.id },
        data: {
          status: 'failed',
          matches: [],
          scanTime: (Date.now() - startTime) / 1000
        }
      });

      throw scanError;
    }

  } catch (error) {
    console.error('File scan error:', error);
    return NextResponse.json(
      { 
        error: 'File scan failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

/**
 * Handle batch file scan
 */
async function handleBatchScan(formData: FormData) {
  const files = formData.getAll('files') as File[];
  const options = formData.get('options') as string;

  if (!files || files.length === 0) {
    return NextResponse.json(
      { error: 'At least one file is required' },
      { status: 400 }
    );
  }

  // Validate batch size
  if (files.length > 20) {
    return NextResponse.json(
      { error: 'Maximum 20 files allowed per batch' },
      { status: 400 }
    );
  }

  const scanOptions = options ? JSON.parse(options) : {};
  const results = [];
  const errors = [];

  for (const file of files) {
    try {
      // Validate individual file size
      if (file.size > 100 * 1024 * 1024) {
        errors.push({
          fileName: file.name,
          error: 'File too large (max 100MB)'
        });
        continue;
      }

      // Read file contents
      const fileBuffer = await file.arrayBuffer();
      const fileContent = new Uint8Array(fileBuffer);

      // Calculate file hash
      const fileHash = crypto.createHash('sha256').update(fileContent).digest('hex');
      const sizeMb = file.size / (1024 * 1024);

      const startTime = Date.now();

      // Create scan record
      const scan = await prisma.yaraScan.create({
        data: {
          timestamp: new Date(),
          target: `file:${file.name}:${fileHash}`,
          targetType: 'file',
          sizeMb,
          status: 'pending',
          matches: [],
          ruleCount: 0
        }
      });

      try {
        // Create temporary file for batch scanning
        const tempFileName = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const tempFilePath = `/tmp/${tempFileName}`;
        
        // Write file content to temporary file
        fs.writeFileSync(tempFilePath, fileContent);

        // Perform scan
        const scanResults = await yaraScanner.scanFile(tempFilePath, scanOptions);
        const scanTime = (Date.now() - startTime) / 1000;

        // Clean up temporary file
        fs.unlinkSync(tempFilePath);

        // Extract matches from scan results
        const allMatches = scanResults.flatMap(result => result.matches || []);
        const totalRules = scanResults.length;

        // Update scan with results
        await prisma.yaraScan.update({
          where: { id: scan.id },
          data: {
            status: 'completed',
            matches: JSON.parse(JSON.stringify(allMatches)),
            scanTime,
            ruleCount: totalRules
          }
        });

        results.push({
          scanId: scan.id,
          fileName: file.name,
          fileSize: file.size,
          fileHash,
          matchCount: allMatches.length,
          status: 'completed',
          scanTime,
          matches: allMatches.slice(0, 5) // Limited for batch response
        });

      } catch (scanError) {
        // Update scan with error
        await prisma.yaraScan.update({
          where: { id: scan.id },
          data: {
            status: 'failed',
            matches: [],
            scanTime: (Date.now() - startTime) / 1000
          }
        });

        errors.push({
          fileName: file.name,
          scanId: scan.id,
          error: scanError instanceof Error ? scanError.message : 'Scan failed'
        });
      }

    } catch (fileError) {
      errors.push({
        fileName: file.name,
        error: fileError instanceof Error ? fileError.message : 'File processing failed'
      });
    }
  }

  return NextResponse.json({
    success: true,
    data: {
      totalFiles: files.length,
      processedFiles: results.length,
      failedFiles: errors.length,
      results,
      errors: errors.length > 0 ? errors : undefined,
      summary: {
        totalMatches: results.reduce((sum, r) => sum + r.matchCount, 0),
        filesWithMatches: results.filter(r => r.matchCount > 0).length
      }
    }
  });
}

/**
 * Handle get scan results
 */
async function handleGetScanResults(scanId: string) {
  const scan = await prisma.yaraScan.findUnique({
    where: { id: scanId }
  });

  if (!scan) {
    return NextResponse.json(
      { error: 'Scan not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      scan: {
        id: scan.id,
        target: scan.target,
        targetType: scan.targetType,
        sizeMb: scan.sizeMb,
        status: scan.status,
        timestamp: scan.timestamp,
        scanTime: scan.scanTime,
        ruleCount: scan.ruleCount
      },
      matches: Array.isArray(scan.matches) ? scan.matches : [],
      summary: {
        totalMatches: Array.isArray(scan.matches) ? scan.matches.length : 0,
        scanStatus: scan.status,
        scanDuration: scan.scanTime
      }
    }
  });
}
