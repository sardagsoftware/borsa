/**
 * 🛡️ AILYDIAN — SOC++ Navigator Export API
 * 
 * MITRE ATT&CK Navigator layer export endpoint
 * - Generate Navigator layer from TTP heat map data
 * - Create signed export URLs with integrity verification
 * - Support custom color schemes and metadata
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { NavigatorLayerGenerator, NavigatorExportManager } from '@/lib/security/navigator';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ttpData, options } = body;

    // Validate input
    if (!ttpData || !Array.isArray(ttpData)) {
      return NextResponse.json(
        { error: 'TTP data is required and must be an array' },
        { status: 400 }
      );
    }

    // Initialize Navigator components
    const layerGenerator = new NavigatorLayerGenerator();
    const exportManager = new NavigatorExportManager(prisma);

    // Generate Navigator layer
    const layer = layerGenerator.generateLayer(ttpData, {
      name: options?.name || 'SOC++ Export',
      description: options?.description || `Generated layer with ${ttpData.length} techniques`,
      colorScheme: options?.colorScheme || 'heatmap',
      showAggregateScores: options?.showAggregateScores !== false,
      countUnscored: options?.countUnscored !== false
    });

    // Create signed export
    const exportResult = await exportManager.createExport(layer, {
      includeSignature: options?.includeSignature !== false,
      expirationHours: options?.expirationHours || 24
    });

    return NextResponse.json({
      success: true,
      data: {
        layer,
        exportUrl: exportResult.url,
        signature: exportResult.signature,
        expiresAt: exportResult.expiresAt,
        metadata: {
          techniqueCount: ttpData.length,
          layerVersion: layer.versions || '1.0.0',
          generatedAt: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    console.error('Navigator export error:', error);
    return NextResponse.json(
      { 
        error: 'Export failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const exportId = searchParams.get('id');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    const exportManager = new NavigatorExportManager(prisma);

    if (exportId) {
      // Get specific export
      const exportData = await exportManager.getExport(exportId);
      
      if (!exportData) {
        return NextResponse.json(
          { error: 'Export not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: exportData
      });
    } else {
      // List recent exports
      const exports = await exportManager.listExports({ limit, offset });
      
      return NextResponse.json({
        success: true,
        data: exports,
        pagination: { limit, offset, total: exports.length }
      });
    }

  } catch (error) {
    console.error('Navigator export list error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to retrieve exports', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
