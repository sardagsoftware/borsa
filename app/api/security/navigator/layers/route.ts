/**
 * 🛡️ AILYDIAN — SOC++ Navigator Layers API
 * 
 * MITRE ATT&CK Navigator layer management endpoint
 * - List available Navigator layers
 * - Get layer details and analysis
 * - Generate coverage reports
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { NavigatorLayerGenerator, NavigatorExportManager } from '@/lib/security/navigator';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');
    const layerId = searchParams.get('id');

    const exportManager = new NavigatorExportManager(prisma);
    const layerGenerator = new NavigatorLayerGenerator();

    switch (action) {
      case 'list':
        return handleListLayers(searchParams, exportManager);
        
      case 'detail':
        if (!layerId) {
          return NextResponse.json(
            { error: 'Layer ID is required for detail action' },
            { status: 400 }
          );
        }
        return handleLayerDetail(layerId, exportManager, layerGenerator);
        
      case 'coverage':
        return handleCoverageReport(searchParams, exportManager, layerGenerator);
        
      case 'statistics':
        return handleStatistics(exportManager);
        
      default:
        // Default to list if no action specified
        return handleListLayers(searchParams, exportManager);
    }

  } catch (error) {
    console.error('Navigator layers API error:', error);
    return NextResponse.json(
      { 
        error: 'Request failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

/**
 * Handle list layers request
 */
async function handleListLayers(
  searchParams: URLSearchParams,
  exportManager: NavigatorExportManager
) {
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');
  const version = searchParams.get('version');

  const exports = await exportManager.listExports({ limit, offset });
  
  // Filter by MITRE version if specified
  const filteredExports = version 
    ? exports.filter(exp => exp.mitreVersion === version)
    : exports;

  return NextResponse.json({
    success: true,
    data: {
      layers: filteredExports,
      pagination: {
        limit,
        offset,
        total: filteredExports.length,
        hasMore: exports.length === limit
      }
    }
  });
}

/**
 * Handle layer detail request
 */
async function handleLayerDetail(
  layerId: string,
  exportManager: NavigatorExportManager,
  layerGenerator: NavigatorLayerGenerator
) {
  const exportData = await exportManager.getExport(layerId);
  
  if (!exportData) {
    return NextResponse.json(
      { error: 'Layer not found' },
      { status: 404 }
    );
  }

  // Analyze layer
  const analysis = layerGenerator.analyzeLayer(exportData.layer);
  
  // Generate detailed statistics
  const detailedStats = generateDetailedStatistics(exportData.layer);

  return NextResponse.json({
    success: true,
    data: {
      layer: exportData.layer,
      analysis,
      detailedStats,
      metadata: {
        id: exportData.id,
        createdAt: exportData.createdAt,
        expiresAt: exportData.expiresAt,
        hasSignature: !!exportData.signature
      }
    }
  });
}

/**
 * Handle coverage report request
 */
async function handleCoverageReport(
  searchParams: URLSearchParams,
  exportManager: NavigatorExportManager,
  layerGenerator: NavigatorLayerGenerator
) {
  const layerIds = searchParams.get('layers')?.split(',') || [];
  const tactic = searchParams.get('tactic');
  const platform = searchParams.get('platform');

  if (layerIds.length === 0) {
    return NextResponse.json(
      { error: 'At least one layer ID is required for coverage report' },
      { status: 400 }
    );
  }

  // Get all specified layers
  const layers = await Promise.all(
    layerIds.map(id => exportManager.getExport(id))
  );

  const validLayers = layers.filter(layer => layer !== null);
  
  if (validLayers.length === 0) {
    return NextResponse.json(
      { error: 'No valid layers found' },
      { status: 404 }
    );
  }

  // Generate coverage report
  const coverageReport = generateCoverageReport(
    validLayers.map(l => l!.layer), 
    { tactic, platform }
  );

  return NextResponse.json({
    success: true,
    data: coverageReport
  });
}

/**
 * Handle statistics request
 */
async function handleStatistics(exportManager: NavigatorExportManager) {
  const allExports = await exportManager.listExports({ limit: 1000 });
  
  const statistics = {
    totalLayers: allExports.length,
    versionDistribution: {} as Record<string, number>,
    techniqueDistribution: {
      min: 0,
      max: 0,
      average: 0,
      total: 0
    },
    recentActivity: allExports.slice(0, 5),
    expiredLayers: allExports.filter(exp => 
      exp.expiresAt && exp.expiresAt < new Date()
    ).length
  };

  // Version distribution
  allExports.forEach(exp => {
    const version = exp.mitreVersion;
    statistics.versionDistribution[version] = (statistics.versionDistribution[version] || 0) + 1;
  });

  // Technique statistics
  if (allExports.length > 0) {
    const techniqueCounts = allExports.map(exp => exp.techniqueCount);
    statistics.techniqueDistribution.min = Math.min(...techniqueCounts);
    statistics.techniqueDistribution.max = Math.max(...techniqueCounts);
    statistics.techniqueDistribution.average = techniqueCounts.reduce((sum, count) => sum + count, 0) / techniqueCounts.length;
    statistics.techniqueDistribution.total = techniqueCounts.reduce((sum, count) => sum + count, 0);
  }

  return NextResponse.json({
    success: true,
    data: statistics
  });
}

/**
 * Generate detailed layer statistics
 */
function generateDetailedStatistics(layer: any) {
  const techniques = layer.techniques || [];
  
  // Tactic distribution
  const tacticCounts: Record<string, number> = {};
  const scoreBuckets = { '0-20': 0, '21-40': 0, '41-60': 0, '61-80': 0, '81-100': 0, 'unscored': 0 };
  
  techniques.forEach((tech: any) => {
    // Count by tactic (simplified)
    const tactic = getTacticFromTechnique(tech.techniqueID);
    if (tactic) {
      tacticCounts[tactic] = (tacticCounts[tactic] || 0) + 1;
    }
    
    // Score distribution
    if (typeof tech.score === 'number') {
      if (tech.score <= 20) scoreBuckets['0-20']++;
      else if (tech.score <= 40) scoreBuckets['21-40']++;
      else if (tech.score <= 60) scoreBuckets['41-60']++;
      else if (tech.score <= 80) scoreBuckets['61-80']++;
      else scoreBuckets['81-100']++;
    } else {
      scoreBuckets.unscored++;
    }
  });

  return {
    tacticDistribution: tacticCounts,
    scoreDistribution: scoreBuckets,
    topTechniques: techniques
      .filter((t: any) => typeof t.score === 'number')
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, 10)
      .map((t: any) => ({
        id: t.techniqueID,
        score: t.score,
        enabled: t.enabled
      })),
    enabledTechniques: techniques.filter((t: any) => t.enabled !== false).length,
    disabledTechniques: techniques.filter((t: any) => t.enabled === false).length
  };
}

/**
 * Generate coverage report for multiple layers
 */
function generateCoverageReport(
  layers: any[],
  filters: { tactic?: string; platform?: string } = {}
) {
  const allTechniques = new Set<string>();
  const techniqueOccurrence: Record<string, number> = {};
  const layerCoverage: Record<string, string[]> = {};
  
  layers.forEach((layer, index) => {
    const layerName = layer.name || `Layer ${index + 1}`;
    layerCoverage[layerName] = [];
    
    layer.techniques.forEach((tech: any) => {
      // Apply filters
      if (filters.tactic && !matchesTactic(tech.techniqueID, filters.tactic)) {
        return;
      }
      
      if (filters.platform && !matchesPlatform(tech, filters.platform)) {
        return;
      }
      
      allTechniques.add(tech.techniqueID);
      layerCoverage[layerName].push(tech.techniqueID);
      techniqueOccurrence[tech.techniqueID] = (techniqueOccurrence[tech.techniqueID] || 0) + 1;
    });
  });

  // Calculate overlap statistics
  const totalTechniques = allTechniques.size;
  const commonTechniques = Object.entries(techniqueOccurrence)
    .filter(([, count]) => count === layers.length)
    .map(([id]) => id);
  
  const uniqueToSingleLayer = Object.entries(techniqueOccurrence)
    .filter(([, count]) => count === 1)
    .map(([id]) => id);

  return {
    summary: {
      totalLayers: layers.length,
      totalUniqueTechniques: totalTechniques,
      commonTechniques: commonTechniques.length,
      uniqueTechniques: uniqueToSingleLayer.length,
      averageCoverage: Object.values(layerCoverage).reduce((sum, techs) => sum + techs.length, 0) / layers.length
    },
    layerCoverage,
    techniqueOccurrence,
    commonTechniques,
    uniqueTechniques: uniqueToSingleLayer,
    overlapMatrix: generateOverlapMatrix(layerCoverage)
  };
}

/**
 * Get tactic from technique ID
 */
function getTacticFromTechnique(techniqueId: string): string | null {
  const tacticMap: Record<string, string> = {
    'T1566': 'Initial Access',
    'T1078': 'Defense Evasion',
    'T1055': 'Defense Evasion',
    'T1027': 'Defense Evasion',
    'T1059': 'Execution',
    'T1543': 'Persistence',
    'T1105': 'Command and Control',
    'T1083': 'Discovery',
    'T1082': 'Discovery',
    'T1033': 'Discovery'
  };

  const baseTechnique = techniqueId.split('.')[0];
  return tacticMap[baseTechnique] || null;
}

/**
 * Check if technique matches tactic filter
 */
function matchesTactic(techniqueId: string, targetTactic: string): boolean {
  const tactic = getTacticFromTechnique(techniqueId);
  return tactic?.toLowerCase().includes(targetTactic.toLowerCase()) || false;
}

/**
 * Check if technique matches platform filter
 */
function matchesPlatform(technique: any, targetPlatform: string): boolean {
  // This is simplified - in production, use full MITRE data
  return true; // For now, assume all techniques match all platforms
}

/**
 * Generate overlap matrix between layers
 */
function generateOverlapMatrix(layerCoverage: Record<string, string[]>) {
  const layerNames = Object.keys(layerCoverage);
  const matrix: Record<string, Record<string, number>> = {};
  
  layerNames.forEach(layer1 => {
    matrix[layer1] = {};
    layerNames.forEach(layer2 => {
      if (layer1 === layer2) {
        matrix[layer1][layer2] = layerCoverage[layer1].length;
      } else {
        const overlap = layerCoverage[layer1].filter(tech => 
          layerCoverage[layer2].includes(tech)
        ).length;
        matrix[layer1][layer2] = overlap;
      }
    });
  });
  
  return matrix;
}
