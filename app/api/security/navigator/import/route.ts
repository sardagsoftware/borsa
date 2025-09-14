/**
 * 🛡️ AILYDIAN — SOC++ Navigator Import API
 * 
 * MITRE ATT&CK Navigator layer import endpoint
 * - Import Navigator layers from JSON/URLs
 * - Validate layer structure and integrity
 * - Support layer merging and analysis
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { NavigatorLayerGenerator, NavigatorExportManager } from '@/lib/security/navigator';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { source, data, options } = body;

    // Validate input
    if (!source || !['json', 'url', 'file'].includes(source)) {
      return NextResponse.json(
        { error: 'Source must be one of: json, url, file' },
        { status: 400 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Data is required' },
        { status: 400 }
      );
    }

    // Initialize Navigator components
    const layerGenerator = new NavigatorLayerGenerator();
    const exportManager = new NavigatorExportManager(prisma);

    let layerData;

    // Handle different import sources
    switch (source) {
      case 'json':
        layerData = typeof data === 'string' ? JSON.parse(data) : data;
        break;
        
      case 'url':
        const response = await fetch(data);
        if (!response.ok) {
          throw new Error(`Failed to fetch layer from URL: ${response.statusText}`);
        }
        layerData = await response.json();
        break;
        
      case 'file':
        // Assuming data is base64 encoded file content
        const fileContent = Buffer.from(data, 'base64').toString('utf8');
        layerData = JSON.parse(fileContent);
        break;
        
      default:
        throw new Error('Unsupported import source');
    }

    // Validate layer structure
    const validationResult = layerGenerator.validateLayer(layerData);
    
    if (!validationResult.isValid) {
      return NextResponse.json(
        { 
          error: 'Invalid layer structure', 
          details: validationResult.errors 
        },
        { status: 400 }
      );
    }

    // Verify signature if present
    let signatureValid = false;
    if (layerData.metadata?.signature && options?.verifySignature !== false) {
      signatureValid = exportManager.verifySignature(layerData, layerData.metadata.signature);
    }

    // Process and analyze layer
    const analysis = layerGenerator.analyzeLayer(layerData);
    
    // Save imported layer if requested
    let importId = null;
    if (options?.saveImport !== false) {
      const exportResult = await exportManager.createExport(layerData, {
        includeSignature: false,
        metadata: {
          importSource: source,
          importedAt: new Date().toISOString(),
          signatureVerified: signatureValid
        }
      });
      importId = exportResult.id;
    }

    return NextResponse.json({
      success: true,
      data: {
        layer: layerData,
        analysis,
        validation: validationResult,
        signatureValid,
        importId,
        metadata: {
          importSource: source,
          techniqueCount: analysis.techniqueCount,
          tacticsCovered: analysis.tacticsCoverage,
          importedAt: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    console.error('Navigator import error:', error);
    return NextResponse.json(
      { 
        error: 'Import failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
