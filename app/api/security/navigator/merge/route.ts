/**
 * 🛡️ AILYDIAN — SOC++ Navigator Merge API
 * 
 * MITRE ATT&CK Navigator layer merge endpoint
 * - Merge multiple Navigator layers with conflict resolution
 * - Support different merge strategies
 * - Calculate coverage overlap and differences
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { NavigatorLayerGenerator, NavigatorExportManager } from '@/lib/security/navigator';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { layers, strategy, options } = body;

    // Validate input
    if (!layers || !Array.isArray(layers) || layers.length < 2) {
      return NextResponse.json(
        { error: 'At least two layers are required for merging' },
        { status: 400 }
      );
    }

    const validStrategies = ['max_score', 'min_score', 'average', 'sum', 'override'];
    if (strategy && !validStrategies.includes(strategy)) {
      return NextResponse.json(
        { error: `Strategy must be one of: ${validStrategies.join(', ')}` },
        { status: 400 }
      );
    }

    // Initialize Navigator components
    const layerGenerator = new NavigatorLayerGenerator();
    const exportManager = new NavigatorExportManager(prisma);

    // Validate all layers
    const validationResults = layers.map((layer: any, index: number) => ({
      index,
      result: layerGenerator.validateLayer(layer)
    }));

    const invalidLayers = validationResults.filter(v => !v.result.isValid);
    if (invalidLayers.length > 0) {
      return NextResponse.json(
        { 
          error: 'Invalid layer structures found',
          details: invalidLayers.map(v => ({
            layerIndex: v.index,
            errors: v.result.errors
          }))
        },
        { status: 400 }
      );
    }

    // Perform merge operation
    const mergedLayer = mergeLayers(layers, strategy || 'max_score', options);
    
    // Analyze merged layer
    const analysis = layerGenerator.analyzeLayer(mergedLayer);
    
    // Generate merge statistics
    const mergeStats = generateMergeStatistics(layers, mergedLayer);
    
    // Save merged layer if requested
    let mergeId = null;
    if (options?.saveMerged !== false) {
      const exportResult = await exportManager.createExport(mergedLayer, {
        includeSignature: options?.includeSignature !== false,
        metadata: {
          mergeStrategy: strategy || 'max_score',
          mergedLayers: layers.length,
          mergedAt: new Date().toISOString()
        }
      });
      mergeId = exportResult.id;
    }

    return NextResponse.json({
      success: true,
      data: {
        mergedLayer,
        analysis,
        mergeStats,
        mergeId,
        metadata: {
          strategy: strategy || 'max_score',
          layerCount: layers.length,
          techniqueCount: mergedLayer.techniques.length,
          mergedAt: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    console.error('Navigator merge error:', error);
    return NextResponse.json(
      { 
        error: 'Merge failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

/**
 * Merge Navigator layers using specified strategy
 */
function mergeLayers(layers: any[], strategy: string, options: any = {}): any {
  const baseLayers = layers[0];
  const mergedLayer = {
    ...baseLayers,
    name: options.name || `Merged Layer - ${strategy}`,
    description: options.description || `Merged from ${layers.length} layers using ${strategy} strategy`,
    techniques: [] as any[]
  };

  // Collect all unique technique IDs
  const allTechniqueIds = new Set<string>();
  layers.forEach(layer => {
    layer.techniques.forEach((tech: any) => {
      allTechniqueIds.add(tech.techniqueID);
    });
  });

  // Merge techniques using specified strategy
  const mergedTechniques: any[] = [];
  
  allTechniqueIds.forEach(techniqueId => {
    const techniqueInstances = layers
      .map(layer => layer.techniques.find((t: any) => t.techniqueID === techniqueId))
      .filter(Boolean);

    if (techniqueInstances.length > 0) {
      const mergedTechnique = mergeTechnique(techniqueInstances, strategy);
      mergedTechniques.push(mergedTechnique);
    }
  });

  mergedLayer.techniques = mergedTechniques;
  
  // Update metadata
  mergedLayer.metadata = [
    ...(mergedLayer.metadata || []),
    { name: 'Merge Strategy', value: strategy },
    { name: 'Source Layers', value: layers.length.toString() },
    { name: 'Merged Techniques', value: mergedTechniques.length.toString() },
    { name: 'Merge Time', value: new Date().toISOString() }
  ];

  return mergedLayer;
}

/**
 * Merge individual technique using specified strategy
 */
function mergeTechnique(techniques: any[], strategy: string): any {
  const base = { ...techniques[0] };
  const scores = techniques
    .map(t => t.score)
    .filter(s => typeof s === 'number');

  if (scores.length === 0) {
    return base;
  }

  // Apply merge strategy
  switch (strategy) {
    case 'max_score':
      base.score = Math.max(...scores);
      break;
    case 'min_score':
      base.score = Math.min(...scores);
      break;
    case 'average':
      base.score = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      break;
    case 'sum':
      base.score = Math.min(100, scores.reduce((sum, score) => sum + score, 0));
      break;
    case 'override':
      // Use the last non-zero score
      base.score = scores[scores.length - 1];
      break;
    default:
      base.score = Math.max(...scores);
  }

  // Merge comments if present
  const comments = techniques
    .map(t => t.comment)
    .filter(c => c && c.trim());

  if (comments.length > 1) {
    base.comment = `Merged: ${comments.join(' | ')}`;
  }

  // Merge enabled state (enabled if any source is enabled)
  base.enabled = techniques.some(t => t.enabled !== false);

  return base;
}

/**
 * Generate merge statistics
 */
function generateMergeStatistics(sourceLayers: any[], mergedLayer: any) {
  const stats = {
    sourceLayers: sourceLayers.length,
    totalSourceTechniques: 0,
    uniqueTechniques: mergedLayer.techniques.length,
    overlapAnalysis: {} as Record<string, number>,
    scoreDistribution: {
      min: 0,
      max: 0,
      average: 0,
      distribution: {} as Record<string, number>
    }
  };

  // Count source techniques
  sourceLayers.forEach((layer, index) => {
    const count = layer.techniques.length;
    stats.totalSourceTechniques += count;
    stats.overlapAnalysis[`layer_${index}`] = count;
  });

  // Analyze score distribution
  const scores = mergedLayer.techniques
    .map((t: any) => t.score)
    .filter((s: any) => typeof s === 'number');

  if (scores.length > 0) {
    stats.scoreDistribution.min = Math.min(...scores);
    stats.scoreDistribution.max = Math.max(...scores);
    stats.scoreDistribution.average = scores.reduce((sum: number, score: number) => sum + score, 0) / scores.length;

    // Create distribution buckets
    const buckets = { '0-20': 0, '21-40': 0, '41-60': 0, '61-80': 0, '81-100': 0 };
    scores.forEach((score: number) => {
      if (score <= 20) buckets['0-20']++;
      else if (score <= 40) buckets['21-40']++;
      else if (score <= 60) buckets['41-60']++;
      else if (score <= 80) buckets['61-80']++;
      else buckets['81-100']++;
    });
    stats.scoreDistribution.distribution = buckets;
  }

  return stats;
}
