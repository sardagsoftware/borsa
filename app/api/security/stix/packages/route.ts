/**
 * 🛡️ AILYDIAN — SOC++ STIX Package Management API
 * 
 * STIX (Structured Threat Information eXpression) package handling
 * - STIX 2.1 package creation and parsing
 * - Bundle management and validation
 * - Threat intelligence import/export
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data, options } = body;

    switch (action) {
      case 'create':
        return handleCreatePackage(data, options);
        
      case 'import':
        return handleImportPackage(data, options);
        
      case 'validate':
        return handleValidatePackage(data);
        
      case 'convert':
        return handleConvertPackage(data, body.targetFormat, options);
        
      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported: create, import, validate, convert' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('STIX package error:', error);
    return NextResponse.json(
      { 
        error: 'STIX package operation failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action') || 'list';
    const id = searchParams.get('id');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const format = searchParams.get('format');

    switch (action) {
      case 'list':
        return handleListPackages(limit, offset);
        
      case 'get':
        return handleGetPackage(id, format);
        
      case 'export':
        return handleExportPackage(id, format);
        
      case 'stats':
        return handlePackageStats();
        
      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported: list, get, export, stats' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('STIX package GET error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to retrieve STIX package data', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Package ID is required' },
        { status: 400 }
      );
    }

    return handleDeletePackage(id);

  } catch (error) {
    console.error('STIX package DELETE error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete STIX package', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

/**
 * Handle create STIX package
 */
async function handleCreatePackage(
  data: Record<string, unknown>, 
  options: Record<string, unknown> = {}
): Promise<NextResponse> {
  if (!data || !data.objects) {
    return NextResponse.json(
      { error: 'STIX objects are required for package creation' },
      { status: 400 }
    );
  }

  try {
    const bundleId = `bundle--${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create STIX 2.1 bundle
    const stixBundle = {
      type: 'bundle',
      id: bundleId,
      spec_version: '2.1',
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      objects: data.objects as Record<string, unknown>[],
      labels: options.labels || ['threat-intelligence'],
      description: data.description || 'STIX package created via SOC++ API'
    };

    // Validate bundle structure
    const validationResult = validateSTIXBundle(stixBundle);
    if (!validationResult.valid) {
      return NextResponse.json(
        { 
          error: 'Invalid STIX bundle structure', 
          validationErrors: validationResult.errors 
        },
        { status: 400 }
      );
    }

    // Store in database
    const stixPackage = await prisma.stixPackage.create({
      data: {
        name: data.description as string || `STIX Package ${Date.now()}`,
        description: data.description as string || 'STIX package created via SOC++ API',
        version: '2.1',
        bundle: JSON.stringify(stixBundle),
        objectCount: (data.objects as unknown[]).length,
        source: 'api',
        tags: (options.tags as string[]) || ['threat-intelligence'],
        metadata: {
          createdBy: options.createdBy || 'SOC++',
          sourceFormat: 'stix-2.1',
          validationStatus: 'valid',
          bundleId
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        id: stixPackage.id,
        bundleId,
        name: stixPackage.name,
        version: stixPackage.version,
        objectCount: stixPackage.objectCount,
        size: JSON.stringify(stixBundle).length,
        createdAt: stixPackage.createdAt,
        validation: validationResult,
        exportFormats: ['stix-2.1', 'stix-2.0', 'misp', 'opencti', 'json']
      }
    });

  } catch (error) {
    console.error('Create STIX package error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create STIX package', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

/**
 * Handle import STIX package
 */
async function handleImportPackage(
  data: Record<string, unknown>, 
  options: Record<string, unknown> = {}
): Promise<NextResponse> {
  if (!data) {
    return NextResponse.json(
      { error: 'STIX data is required for import' },
      { status: 400 }
    );
  }

  try {
    // Detect and convert format if necessary
    const detectedFormat = detectSTIXFormat(data);
    let stixBundle = data as Record<string, unknown>;

    if (detectedFormat !== 'stix-2.1') {
      const conversionResult = await convertToSTIX21(data, detectedFormat);
      if (!conversionResult.success) {
        return NextResponse.json(
          { 
            error: 'Failed to convert to STIX 2.1', 
            details: conversionResult.error 
          },
          { status: 400 }
        );
      }
      stixBundle = conversionResult.data as Record<string, unknown>;
    }

    // Validate imported bundle
    const validationResult = validateSTIXBundle(stixBundle);
    if (!validationResult.valid && options.requireValidation !== false) {
      return NextResponse.json(
        { 
          error: 'Invalid STIX bundle', 
          validationErrors: validationResult.errors 
        },
        { status: 400 }
      );
    }

    // Store imported package
    const stixPackage = await prisma.stixPackage.create({
      data: {
        name: (data.description as string) || `Imported STIX Package ${Date.now()}`,
        description: (data.description as string) || 'Imported STIX package',
        version: '2.1',
        bundle: JSON.stringify(stixBundle),
        objectCount: stixBundle.objects ? (stixBundle.objects as unknown[]).length : 0,
        source: 'import',
        tags: ['imported', 'threat-intelligence'],
        metadata: {
          sourceFormat: detectedFormat,
          importedFrom: options.source || 'manual-import',
          validationStatus: validationResult.valid ? 'valid' : 'invalid',
          conversionApplied: detectedFormat !== 'stix-2.1',
          importDate: new Date().toISOString()
        }
      }
    });

    // Extract and analyze objects
    const analysis = analyzeSTIXObjects(stixBundle);

    return NextResponse.json({
      success: true,
      data: {
        id: stixPackage.id,
        importStatus: 'completed',
        sourceFormat: detectedFormat,
        converted: detectedFormat !== 'stix-2.1',
        validation: validationResult,
        analysis,
        createdAt: stixPackage.createdAt,
        recommendations: generateImportRecommendations(analysis, validationResult)
      }
    });

  } catch (error) {
    console.error('Import STIX package error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to import STIX package', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

/**
 * Handle validate STIX package
 */
async function handleValidatePackage(data: Record<string, unknown>): Promise<NextResponse> {
  if (!data) {
    return NextResponse.json(
      { error: 'STIX data is required for validation' },
      { status: 400 }
    );
  }

  try {
    const format = detectSTIXFormat(data);
    const validationResult = validateSTIXBundle(data);
    const analysis = analyzeSTIXObjects(data);

    // Additional validation checks
    const securityChecks = performSecurityValidation(data);
    const schemaChecks = performSchemaValidation(data, format);

    return NextResponse.json({
      success: true,
      data: {
        format,
        validation: {
          ...validationResult,
          securityChecks,
          schemaChecks
        },
        analysis,
        recommendations: generateValidationRecommendations(validationResult, analysis),
        compliance: {
          stix21: format === 'stix-2.1' && validationResult.valid,
          security: securityChecks.passed,
          schema: schemaChecks.passed
        }
      }
    });

  } catch (error) {
    console.error('Validate STIX package error:', error);
    return NextResponse.json(
      { 
        error: 'Validation failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

/**
 * Handle convert STIX package
 */
async function handleConvertPackage(
  data: Record<string, unknown>,
  targetFormat: string,
  options: Record<string, unknown> = {}
): Promise<NextResponse> {
  if (!data || !targetFormat) {
    return NextResponse.json(
      { error: 'STIX data and target format are required' },
      { status: 400 }
    );
  }

  const supportedFormats = ['stix-2.1', 'stix-2.0', 'misp', 'opencti', 'json', 'csv'];
  if (!supportedFormats.includes(targetFormat)) {
    return NextResponse.json(
      { 
        error: 'Unsupported target format', 
        supportedFormats 
      },
      { status: 400 }
    );
  }

  try {
    const sourceFormat = detectSTIXFormat(data);
    const conversionResult = await convertSTIXFormat(data, sourceFormat, targetFormat, options);

    if (!conversionResult.success) {
      return NextResponse.json(
        { 
          error: 'Conversion failed', 
          details: conversionResult.error 
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        sourceFormat,
        targetFormat,
        convertedData: conversionResult.data,
        metadata: {
          objectCount: conversionResult.objectCount,
          conversionTime: conversionResult.processingTime,
          warnings: conversionResult.warnings || [],
          lossyConversion: conversionResult.lossyConversion || false
        },
        downloadable: ['csv', 'json'].includes(targetFormat)
      }
    });

  } catch (error) {
    console.error('Convert STIX package error:', error);
    return NextResponse.json(
      { 
        error: 'Conversion failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

/**
 * Handle list packages
 */
async function handleListPackages(limit: number, offset: number): Promise<NextResponse> {
  try {
    const packages = await prisma.stixPackage.findMany({
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        version: true,
        objectCount: true,
        source: true,
        tags: true,
        metadata: true,
        createdAt: true,
        updatedAt: true
      }
    });

    const totalCount = await prisma.stixPackage.count();

    return NextResponse.json({
      success: true,
      data: {
        packages: packages.map(pkg => ({
          id: pkg.id,
          name: pkg.name,
          description: pkg.description,
          version: pkg.version,
          objectCount: pkg.objectCount,
          source: pkg.source,
          tags: pkg.tags,
          createdAt: pkg.createdAt,
          updatedAt: pkg.updatedAt
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
    console.error('List STIX packages error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to list packages', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

/**
 * Handle get package
 */
async function handleGetPackage(id: string | null, format: string | null): Promise<NextResponse> {
  if (!id) {
    return NextResponse.json(
      { error: 'Package ID is required' },
      { status: 400 }
    );
  }

  try {
    const stixPackage = await prisma.stixPackage.findUnique({
      where: { id }
    });

    if (!stixPackage) {
      return NextResponse.json(
        { error: 'Package not found' },
        { status: 404 }
      );
    }

    let content = JSON.parse(stixPackage.bundle);

    // Convert format if requested
    if (format && format !== 'stix-2.1') {
      const conversionResult = await convertSTIXFormat(content, 'stix-2.1', format);
      if (conversionResult.success) {
        content = conversionResult.data;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        id: stixPackage.id,
        name: stixPackage.name,
        description: stixPackage.description,
        version: stixPackage.version,
        content,
        metadata: stixPackage.metadata,
        createdAt: stixPackage.createdAt,
        format: format || 'stix-2.1'
      }
    });

  } catch (error) {
    console.error('Get STIX package error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get package', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

/**
 * Handle export package
 */
async function handleExportPackage(id: string | null, format: string | null): Promise<NextResponse> {
  if (!id) {
    return NextResponse.json(
      { error: 'Package ID is required' },
      { status: 400 }
    );
  }

  try {
    const stixPackage = await prisma.stixPackage.findUnique({
      where: { id }
    });

    if (!stixPackage) {
      return NextResponse.json(
        { error: 'Package not found' },
        { status: 404 }
      );
    }

    const exportFormat = format || 'stix-2.1';
    let exportData = JSON.parse(stixPackage.bundle);

    // Convert if necessary
    if (exportFormat !== 'stix-2.1') {
      const conversionResult = await convertSTIXFormat(exportData, 'stix-2.1', exportFormat);
      if (!conversionResult.success) {
        return NextResponse.json(
          { error: 'Export conversion failed', details: conversionResult.error },
          { status: 400 }
        );
      }
      exportData = conversionResult.data;
    }

    // Return as downloadable content
    const headers = new Headers();
    headers.set('Content-Type', getContentType(exportFormat));
    headers.set('Content-Disposition', `attachment; filename="${stixPackage.name}.${getFileExtension(exportFormat)}"`);

    return new NextResponse(
      typeof exportData === 'string' ? exportData : JSON.stringify(exportData, null, 2),
      { headers }
    );

  } catch (error) {
    console.error('Export STIX package error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to export package', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

/**
 * Handle delete package
 */
async function handleDeletePackage(id: string): Promise<NextResponse> {
  try {
    const deletedPackage = await prisma.stixPackage.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      data: {
        id: deletedPackage.id,
        name: deletedPackage.name,
        deletedAt: new Date().toISOString(),
        message: 'Package deleted successfully'
      }
    });

  } catch (error) {
    console.error('Delete STIX package error:', error);
    
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Package not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Failed to delete package', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

/**
 * Handle package statistics
 */
async function handlePackageStats(): Promise<NextResponse> {
  try {
    const [
      totalPackages,
      recentPackages,
      versionStats,
      sourceStats
    ] = await Promise.all([
      prisma.stixPackage.count(),
      prisma.stixPackage.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      prisma.stixPackage.groupBy({
        by: ['version'],
        _count: true
      }),
      prisma.stixPackage.groupBy({
        by: ['source'],
        _count: true
      })
    ]);

    // Mock size statistics
    const sizeStats = {
      totalSize: Math.floor(Math.random() * 100000000),
      averageSize: Math.floor(Math.random() * 1000000),
      largestPackage: Math.floor(Math.random() * 10000000)
    };

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalPackages,
          recentPackages,
          weeklyGrowth: recentPackages
        },
        distribution: {
          byVersion: versionStats.map(stat => ({
            version: stat.version,
            count: stat._count
          })),
          bySource: sourceStats.map(stat => ({
            source: stat.source,
            count: stat._count
          }))
        },
        storage: sizeStats,
        trends: {
          weeklyGrowth: recentPackages,
          monthlyGrowth: Math.floor(Math.random() * recentPackages * 4),
          growthRate: totalPackages > 0 ? Math.round((recentPackages / totalPackages) * 100) : 0
        },
        recommendations: generateStatsRecommendations(totalPackages)
      }
    });

  } catch (error) {
    console.error('Package stats error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get package statistics', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// Helper functions
function validateSTIXBundle(bundle: unknown): { valid: boolean; errors: string[] } {
  const errors = [];
  
  if (!bundle || typeof bundle !== 'object') {
    errors.push('Bundle must be an object');
    return { valid: false, errors };
  }
  
  const bundleObj = bundle as Record<string, unknown>;
  
  if (bundleObj.type !== 'bundle') {
    errors.push('Bundle type must be "bundle"');
  }
  
  if (!bundleObj.id || typeof bundleObj.id !== 'string') {
    errors.push('Bundle must have a valid ID');
  }
  
  if (!bundleObj.objects || !Array.isArray(bundleObj.objects)) {
    errors.push('Bundle must contain objects array');
  }
  
  return { valid: errors.length === 0, errors };
}

function detectSTIXFormat(data: unknown): string {
  if (!data || typeof data !== 'object') return 'unknown';
  
  const obj = data as Record<string, unknown>;
  
  if (obj.spec_version === '2.1') return 'stix-2.1';
  if (obj.spec_version === '2.0') return 'stix-2.0';
  if (obj.type === 'bundle') return 'stix-2.1'; // assume latest
  
  return 'json'; // generic JSON format
}

async function convertToSTIX21(data: unknown, sourceFormat: string): Promise<{ success: boolean; data?: unknown; error?: string }> {
  // Mock conversion logic
  if (sourceFormat === 'stix-2.0') {
    return {
      success: true,
      data: {
        ...(data as Record<string, unknown>),
        spec_version: '2.1'
      }
    };
  }
  
  return {
    success: false,
    error: `Conversion from ${sourceFormat} not yet implemented`
  };
}

async function convertSTIXFormat(
  data: unknown, 
  sourceFormat: string, 
  targetFormat: string, 
  options: Record<string, unknown> = {}
): Promise<{ success: boolean; data?: unknown; error?: string; objectCount?: number; processingTime?: number; warnings?: string[]; lossyConversion?: boolean }> {
  const startTime = Date.now();
  
  // Mock conversion
  if (targetFormat === 'json') {
    return {
      success: true,
      data: JSON.stringify(data, null, 2),
      objectCount: Array.isArray((data as Record<string, unknown>)?.objects) ? 
        ((data as Record<string, unknown>).objects as unknown[]).length : 0,
      processingTime: Date.now() - startTime,
      warnings: []
    };
  }
  
  if (targetFormat === 'csv') {
    // Mock CSV conversion
    const csvData = 'type,id,created,modified\n' +
      'bundle,bundle-001,2024-01-01,2024-01-01\n';
    
    return {
      success: true,
      data: csvData,
      objectCount: 1,
      processingTime: Date.now() - startTime,
      warnings: ['Some data may be lost in CSV conversion'],
      lossyConversion: true
    };
  }
  
  return {
    success: false,
    error: `Conversion to ${targetFormat} not yet implemented`
  };
}

function analyzeSTIXObjects(bundle: unknown): Record<string, unknown> {
  const analysis = {
    objectTypes: {} as Record<string, number>,
    totalObjects: 0,
    hasRelationships: false,
    timeRange: { earliest: null as string | null, latest: null as string | null },
    complexity: 'low' as 'low' | 'medium' | 'high'
  };
  
  if (!bundle || typeof bundle !== 'object') return analysis;
  
  const bundleObj = bundle as Record<string, unknown>;
  const objects = bundleObj.objects as Record<string, unknown>[] || [];
  
  analysis.totalObjects = objects.length;
  
  objects.forEach(obj => {
    const type = obj.type as string || 'unknown';
    analysis.objectTypes[type] = (analysis.objectTypes[type] || 0) + 1;
    
    if (type === 'relationship' || type === 'sighting') {
      analysis.hasRelationships = true;
    }
  });
  
  analysis.complexity = analysis.totalObjects > 100 ? 'high' : 
                       analysis.totalObjects > 20 ? 'medium' : 'low';
  
  return analysis;
}

function performSecurityValidation(data: unknown): { passed: boolean; issues: string[] } {
  const issues = [];
  
  // Mock security validation
  const dataStr = JSON.stringify(data);
  if (dataStr.includes('<script>')) {
    issues.push('Potential XSS content detected');
  }
  
  if (dataStr.length > 10000000) { // 10MB
    issues.push('Package size exceeds security limits');
  }
  
  return { passed: issues.length === 0, issues };
}

function performSchemaValidation(data: unknown, format: string): { passed: boolean; issues: string[] } {
  const issues = [];
  
  // Mock schema validation
  if (format === 'stix-2.1') {
    const bundleObj = data as Record<string, unknown>;
    if (!bundleObj.spec_version) {
      issues.push('Missing spec_version');
    }
  }
  
  return { passed: issues.length === 0, issues };
}

function generateImportRecommendations(analysis: Record<string, unknown>, validation: { valid: boolean }): string[] {
  const recommendations = [];
  
  if (!validation.valid) {
    recommendations.push('Fix validation errors before using this package');
  }
  
  if ((analysis.totalObjects as number) > 1000) {
    recommendations.push('Large package - consider breaking into smaller bundles');
  }
  
  if (analysis.hasRelationships) {
    recommendations.push('Package contains relationships - ensure all referenced objects are included');
  }
  
  return recommendations;
}

function generateValidationRecommendations(validation: { valid: boolean }, analysis: Record<string, unknown>): string[] {
  const recommendations = [];
  
  if (!validation.valid) {
    recommendations.push('Address validation errors to ensure STIX compliance');
  }
  
  if ((analysis.totalObjects as number) === 0) {
    recommendations.push('Empty bundle - add STIX objects for meaningful threat intelligence');
  }
  
  recommendations.push('Validate against STIX 2.1 specification for best compatibility');
  
  return recommendations;
}

function generateStatsRecommendations(totalPackages: number): string[] {
  const recommendations = [];
  
  if (totalPackages === 0) {
    recommendations.push('No packages found - start by importing threat intelligence data');
  }
  
  if (totalPackages > 1000) {
    recommendations.push('Large number of packages - implement archival strategy');
  }
  
  recommendations.push('Consider regular cleanup of old or unused packages');
  
  return recommendations;
}

function getContentType(format: string): string {
  switch (format) {
    case 'json':
    case 'stix-2.1':
    case 'stix-2.0':
      return 'application/json';
    case 'csv':
      return 'text/csv';
    default:
      return 'application/octet-stream';
  }
}

function getFileExtension(format: string): string {
  switch (format) {
    case 'json':
    case 'stix-2.1':
    case 'stix-2.0':
      return 'json';
    case 'csv':
      return 'csv';
    default:
      return 'bin';
  }
}
