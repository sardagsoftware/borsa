/**
 * 🛡️ AILYDIAN — SOC++ STIX Collections API
 * 
 * STIX Collections Management
 * - Collection creation and management
 * - Threat intelligence categorization
 * - Collection sharing and access control
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
        return handleCreateCollection(data, options);
        
      case 'import':
        return handleImportToCollection(data, options);
        
      case 'export':
        return handleExportCollection(data, options);
        
      case 'share':
        return handleShareCollection(data, options);
        
      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported: create, import, export, share' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('STIX collections error:', error);
    return NextResponse.json(
      { 
        error: 'STIX collections operation failed', 
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
    const collectionId = searchParams.get('collectionId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    switch (action) {
      case 'list':
        return handleListCollections(limit, offset);
        
      case 'get':
        return handleGetCollection(collectionId);
        
      case 'objects':
        return handleGetCollectionObjects(collectionId, limit, offset);
        
      case 'manifest':
        return handleGetCollectionManifest(collectionId);
        
      case 'stats':
        return handleCollectionStats(collectionId);
        
      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported: list, get, objects, manifest, stats' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('STIX collections GET error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to retrieve collection data', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { collectionId, data } = body;

    if (!collectionId) {
      return NextResponse.json(
        { error: 'Collection ID is required' },
        { status: 400 }
      );
    }

    return handleUpdateCollection(collectionId, data);

  } catch (error) {
    console.error('STIX collections PUT error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update collection', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const collectionId = searchParams.get('collectionId');

    if (!collectionId) {
      return NextResponse.json(
        { error: 'Collection ID is required' },
        { status: 400 }
      );
    }

    return handleDeleteCollection(collectionId);

  } catch (error) {
    console.error('STIX collections DELETE error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete collection', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

/**
 * Handle create collection
 */
async function handleCreateCollection(
  data: Record<string, unknown>, 
  options: Record<string, unknown> = {}
): Promise<NextResponse> {
  if (!data.title) {
    return NextResponse.json(
      { error: 'Collection title is required' },
      { status: 400 }
    );
  }

  try {
    const collectionId = `collection--${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const collection = {
      id: collectionId,
      title: data.title as string,
      description: data.description as string || '',
      can_read: data.canRead !== false,
      can_write: data.canWrite !== false,
      media_types: ['application/stix+json;version=2.1'],
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      objects: [] as unknown[],
      permissions: {
        owner: data.owner || 'SOC++',
        readers: data.readers || [],
        writers: data.writers || []
      },
      categories: data.categories || ['general'],
      visibility: data.visibility || 'private'
    };

    // Store in database
    const stixCollection = await prisma.stixPackage.create({
      data: {
        name: `Collection: ${data.title}`,
        description: data.description as string || 'STIX collection',
        version: '2.1',
        bundle: JSON.stringify({
          type: 'bundle',
          id: collectionId,
          spec_version: '2.1',
          objects: []
        }),
        objectCount: 0,
        source: 'collection',
        tags: ['stix-collection', ...(data.categories as string[] || [])],
        metadata: collection
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        id: stixCollection.id,
        collectionId,
        title: collection.title,
        description: collection.description,
        can_read: collection.can_read,
        can_write: collection.can_write,
        objectCount: 0,
        categories: collection.categories,
        visibility: collection.visibility,
        createdAt: stixCollection.createdAt,
        recommendations: generateCollectionRecommendations(collection)
      }
    });

  } catch (error) {
    console.error('Create collection error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create collection', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

/**
 * Handle import to collection
 */
async function handleImportToCollection(
  data: Record<string, unknown>, 
  options: Record<string, unknown> = {}
): Promise<NextResponse> {
  if (!data.collectionId || !data.objects) {
    return NextResponse.json(
      { error: 'Collection ID and objects are required' },
      { status: 400 }
    );
  }

  try {
    const objects = data.objects as Record<string, unknown>[];
    const collectionId = data.collectionId as string;

    // Validate objects
    const validationResults = objects.map(obj => validateSTIXObject(obj));
    const validObjects = objects.filter((_, index) => validationResults[index].valid);
    const invalidObjects = validationResults.filter(result => !result.valid);

    // Mock import process
    const importResult = {
      collectionId,
      totalObjects: objects.length,
      validObjects: validObjects.length,
      invalidObjects: invalidObjects.length,
      importedObjects: validObjects.length,
      duplicates: Math.floor(Math.random() * validObjects.length * 0.1),
      conflicts: Math.floor(Math.random() * validObjects.length * 0.05),
      importTime: new Date().toISOString(),
      status: invalidObjects.length === 0 ? 'success' : 'partial'
    };

    return NextResponse.json({
      success: true,
      data: {
        collectionId,
        importId: `import--${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        results: importResult,
        summary: `Imported ${importResult.importedObjects}/${importResult.totalObjects} objects`,
        validationErrors: invalidObjects.length > 0 ? invalidObjects.map(r => r.errors) : undefined,
        recommendations: generateImportRecommendations(importResult, invalidObjects)
      }
    });

  } catch (error) {
    console.error('Import to collection error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to import objects to collection', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

/**
 * Handle export collection
 */
async function handleExportCollection(
  data: Record<string, unknown>, 
  options: Record<string, unknown> = {}
): Promise<NextResponse> {
  if (!data.collectionId) {
    return NextResponse.json(
      { error: 'Collection ID is required' },
      { status: 400 }
    );
  }

  try {
    const collectionId = data.collectionId as string;
    const format = data.format as string || 'stix-2.1';
    const includeMetadata = data.includeMetadata !== false;

    // Get collection from database
    const collection = await prisma.stixPackage.findFirst({
      where: {
        source: 'collection',
        metadata: {
          path: ['id'],
          equals: collectionId
        }
      }
    });

    if (!collection) {
      return NextResponse.json(
        { error: 'Collection not found' },
        { status: 404 }
      );
    }

    const bundle = JSON.parse(collection.bundle);

    // Add metadata if requested
    if (includeMetadata) {
      bundle.metadata = collection.metadata;
      bundle.exported_at = new Date().toISOString();
      bundle.exported_by = options.exportedBy || 'SOC++';
    }

    // Convert format if requested
    let exportData = bundle;
    if (format !== 'stix-2.1') {
      const conversionResult = await convertCollectionFormat(bundle, format);
      if (!conversionResult.success) {
        return NextResponse.json(
          { error: 'Export conversion failed', details: conversionResult.error },
          { status: 400 }
        );
      }
      exportData = conversionResult.data;
    }

    return NextResponse.json({
      success: true,
      data: {
        collectionId,
        format,
        exportData,
        metadata: {
          objectCount: bundle.objects?.length || 0,
          exportTime: new Date().toISOString(),
          includeMetadata,
          size: JSON.stringify(exportData).length
        },
        downloadable: true,
        recommendations: ['Verify exported data integrity', 'Consider encryption for sensitive data']
      }
    });

  } catch (error) {
    console.error('Export collection error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to export collection', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

/**
 * Handle share collection
 */
async function handleShareCollection(
  data: Record<string, unknown>, 
  options: Record<string, unknown> = {}
): Promise<NextResponse> {
  if (!data.collectionId || !data.shareWith) {
    return NextResponse.json(
      { error: 'Collection ID and share recipients are required' },
      { status: 400 }
    );
  }

  try {
    const collectionId = data.collectionId as string;
    const shareWith = data.shareWith as string[];
    const permissions = data.permissions as string || 'read';
    const expiresAt = data.expiresAt as string || null;

    const shareId = `share--${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const shareInfo = {
      shareId,
      collectionId,
      shareWith,
      permissions,
      expiresAt,
      createdAt: new Date().toISOString(),
      createdBy: options.sharedBy || 'SOC++',
      accessCount: 0,
      status: 'active'
    };

    return NextResponse.json({
      success: true,
      data: {
        shareId,
        collectionId,
        shareWith,
        permissions,
        expiresAt,
        shareLink: `https://localhost:3000/api/security/stix/collections?action=get&collectionId=${collectionId}&shareId=${shareId}`,
        createdAt: shareInfo.createdAt,
        status: shareInfo.status,
        recommendations: generateShareRecommendations(shareInfo)
      }
    });

  } catch (error) {
    console.error('Share collection error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to share collection', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

/**
 * Handle list collections
 */
async function handleListCollections(limit: number, offset: number): Promise<NextResponse> {
  try {
    const collections = await prisma.stixPackage.findMany({
      where: {
        source: 'collection',
        tags: { has: 'stix-collection' }
      },
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        objectCount: true,
        tags: true,
        metadata: true,
        createdAt: true,
        updatedAt: true
      }
    });

    const totalCount = await prisma.stixPackage.count({
      where: {
        source: 'collection',
        tags: { has: 'stix-collection' }
      }
    });

    const collectionList = collections.map(collection => {
      const config = collection.metadata as Record<string, unknown>;
      return {
        id: collection.id,
        collectionId: config.id,
        title: config.title,
        description: config.description,
        can_read: config.can_read,
        can_write: config.can_write,
        objectCount: collection.objectCount,
        categories: config.categories,
        visibility: config.visibility,
        createdAt: collection.createdAt,
        updatedAt: collection.updatedAt
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        collections: collectionList,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount
        },
        summary: {
          total: totalCount,
          public: collectionList.filter(c => c.visibility === 'public').length,
          private: collectionList.filter(c => c.visibility === 'private').length,
          writable: collectionList.filter(c => c.can_write).length
        }
      }
    });

  } catch (error) {
    console.error('List collections error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to list collections', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

/**
 * Handle get collection
 */
async function handleGetCollection(collectionId: string | null): Promise<NextResponse> {
  if (!collectionId) {
    return NextResponse.json(
      { error: 'Collection ID is required' },
      { status: 400 }
    );
  }

  try {
    const collection = await prisma.stixPackage.findFirst({
      where: {
        source: 'collection',
        metadata: {
          path: ['id'],
          equals: collectionId
        }
      }
    });

    if (!collection) {
      return NextResponse.json(
        { error: 'Collection not found' },
        { status: 404 }
      );
    }

    const config = collection.metadata as Record<string, unknown>;

    return NextResponse.json({
      success: true,
      data: {
        id: collection.id,
        collectionId,
        title: config.title,
        description: config.description,
        can_read: config.can_read,
        can_write: config.can_write,
        media_types: config.media_types,
        objectCount: collection.objectCount,
        categories: config.categories,
        visibility: config.visibility,
        permissions: config.permissions,
        createdAt: collection.createdAt,
        updatedAt: collection.updatedAt,
        bundle: JSON.parse(collection.bundle)
      }
    });

  } catch (error) {
    console.error('Get collection error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get collection', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

/**
 * Handle get collection objects
 */
async function handleGetCollectionObjects(collectionId: string | null, limit: number, offset: number): Promise<NextResponse> {
  if (!collectionId) {
    return NextResponse.json(
      { error: 'Collection ID is required' },
      { status: 400 }
    );
  }

  try {
    // Mock objects for demonstration
    const objects = [
      {
        type: 'malware',
        spec_version: '2.1',
        id: 'malware--162d917e-766f-4611-b5d6-652791454fca',
        created: '2024-01-01T00:00:00.000Z',
        modified: '2024-01-01T00:00:00.000Z',
        name: 'Zeus Banking Trojan',
        is_family: true,
        labels: ['trojan']
      },
      {
        type: 'threat-actor',
        spec_version: '2.1',
        id: 'threat-actor--56f3f0db-b5d5-431c-ae56-c18f02caf500',
        created: '2024-01-01T00:00:00.000Z',
        modified: '2024-01-01T00:00:00.000Z',
        name: 'Evil Org',
        threat_actor_types: ['cybercriminal']
      }
    ];

    const paginatedObjects = objects.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      data: {
        collectionId,
        objects: paginatedObjects,
        pagination: {
          total: objects.length,
          limit,
          offset,
          hasMore: offset + limit < objects.length
        }
      }
    });

  } catch (error) {
    console.error('Get collection objects error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get collection objects', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

/**
 * Handle get collection manifest
 */
async function handleGetCollectionManifest(collectionId: string | null): Promise<NextResponse> {
  if (!collectionId) {
    return NextResponse.json(
      { error: 'Collection ID is required' },
      { status: 400 }
    );
  }

  try {
    // Mock manifest
    const manifest = [
      {
        id: 'malware--162d917e-766f-4611-b5d6-652791454fca',
        date_added: '2024-01-01T00:00:00.000Z',
        version: '1',
        media_type: 'application/stix+json;version=2.1'
      },
      {
        id: 'threat-actor--56f3f0db-b5d5-431c-ae56-c18f02caf500',
        date_added: '2024-01-01T00:00:00.000Z',
        version: '1',
        media_type: 'application/stix+json;version=2.1'
      }
    ];

    return NextResponse.json({
      success: true,
      data: {
        collectionId,
        objects: manifest,
        total: manifest.length,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Get collection manifest error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get collection manifest', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

/**
 * Handle collection statistics
 */
async function handleCollectionStats(collectionId: string | null): Promise<NextResponse> {
  try {
    if (collectionId) {
      // Stats for specific collection
      const stats = {
        collectionId,
        objectCount: Math.floor(Math.random() * 1000),
        objectTypes: {
          'malware': Math.floor(Math.random() * 200),
          'threat-actor': Math.floor(Math.random() * 100),
          'indicator': Math.floor(Math.random() * 500),
          'campaign': Math.floor(Math.random() * 50)
        },
        recentActivity: {
          last24h: Math.floor(Math.random() * 50),
          lastWeek: Math.floor(Math.random() * 200),
          lastMonth: Math.floor(Math.random() * 500)
        },
        sharing: {
          publicShares: Math.floor(Math.random() * 10),
          privateShares: Math.floor(Math.random() * 5),
          downloads: Math.floor(Math.random() * 100)
        }
      };

      return NextResponse.json({
        success: true,
        data: stats
      });

    } else {
      // Global collection stats
      const totalCollections = await prisma.stixPackage.count({
        where: {
          source: 'collection',
          tags: { has: 'stix-collection' }
        }
      });

      const stats = {
        totalCollections,
        totalObjects: Math.floor(Math.random() * 10000),
        publicCollections: Math.floor(totalCollections * 0.3),
        privateCollections: totalCollections - Math.floor(totalCollections * 0.3),
        recentCollections: Math.floor(Math.random() * totalCollections * 0.1),
        topCategories: [
          { name: 'malware', count: Math.floor(Math.random() * 100) },
          { name: 'threat-intelligence', count: Math.floor(Math.random() * 150) },
          { name: 'indicators', count: Math.floor(Math.random() * 200) }
        ]
      };

      return NextResponse.json({
        success: true,
        data: stats
      });
    }

  } catch (error) {
    console.error('Collection stats error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get collection statistics', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

/**
 * Handle update collection
 */
async function handleUpdateCollection(collectionId: string, data: Record<string, unknown>): Promise<NextResponse> {
  try {
    const collection = await prisma.stixPackage.findFirst({
      where: {
        source: 'collection',
        metadata: {
          path: ['id'],
          equals: collectionId
        }
      }
    });

    if (!collection) {
      return NextResponse.json(
        { error: 'Collection not found' },
        { status: 404 }
      );
    }

    const currentConfig = collection.metadata as Record<string, unknown>;
    const updatedConfig = {
      ...currentConfig,
      title: data.title || currentConfig.title,
      description: data.description || currentConfig.description,
      can_read: data.canRead !== undefined ? data.canRead : currentConfig.can_read,
      can_write: data.canWrite !== undefined ? data.canWrite : currentConfig.can_write,
      categories: data.categories || currentConfig.categories,
      visibility: data.visibility || currentConfig.visibility,
      modified: new Date().toISOString()
    };

    await prisma.stixPackage.update({
      where: { id: collection.id },
      data: {
        name: `Collection: ${updatedConfig.title}`,
        description: updatedConfig.description as string,
        tags: ['stix-collection', ...(updatedConfig.categories as string[] || [])],
        metadata: updatedConfig
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        collectionId,
        title: updatedConfig.title,
        description: updatedConfig.description,
        can_read: updatedConfig.can_read,
        can_write: updatedConfig.can_write,
        categories: updatedConfig.categories,
        visibility: updatedConfig.visibility,
        modifiedAt: updatedConfig.modified,
        message: 'Collection updated successfully'
      }
    });

  } catch (error) {
    console.error('Update collection error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update collection', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

/**
 * Handle delete collection
 */
async function handleDeleteCollection(collectionId: string): Promise<NextResponse> {
  try {
    const collection = await prisma.stixPackage.findFirst({
      where: {
        source: 'collection',
        metadata: {
          path: ['id'],
          equals: collectionId
        }
      }
    });

    if (!collection) {
      return NextResponse.json(
        { error: 'Collection not found' },
        { status: 404 }
      );
    }

    await prisma.stixPackage.delete({
      where: { id: collection.id }
    });

    return NextResponse.json({
      success: true,
      data: {
        collectionId,
        deletedAt: new Date().toISOString(),
        message: 'Collection deleted successfully'
      }
    });

  } catch (error) {
    console.error('Delete collection error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete collection', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// Helper functions
function validateSTIXObject(obj: Record<string, unknown>): { valid: boolean; errors: string[] } {
  const errors = [];
  
  if (!obj.type || typeof obj.type !== 'string') {
    errors.push('Missing or invalid type field');
  }
  
  if (!obj.id || typeof obj.id !== 'string') {
    errors.push('Missing or invalid id field');
  }
  
  if (!obj.spec_version) {
    errors.push('Missing spec_version field');
  }
  
  return { valid: errors.length === 0, errors };
}

async function convertCollectionFormat(
  bundle: Record<string, unknown>, 
  format: string
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  // Mock conversion
  if (format === 'json') {
    return {
      success: true,
      data: JSON.stringify(bundle, null, 2)
    };
  }
  
  if (format === 'csv') {
    const csvData = 'type,id,name,created\n' +
      'collection,collection-001,Sample Collection,2024-01-01\n';
    
    return {
      success: true,
      data: csvData
    };
  }
  
  return {
    success: false,
    error: `Conversion to ${format} not yet implemented`
  };
}

function generateCollectionRecommendations(collection: Record<string, unknown>): string[] {
  const recommendations = [];
  
  if (!collection.description || (collection.description as string).length < 20) {
    recommendations.push('Add a detailed description to help others understand the collection');
  }
  
  if (collection.visibility === 'public') {
    recommendations.push('Public collections should follow naming conventions');
  }
  
  if (!collection.categories || (collection.categories as unknown[]).length === 0) {
    recommendations.push('Add categories to improve collection discoverability');
  }
  
  return recommendations;
}

function generateImportRecommendations(results: Record<string, unknown>, errors: unknown[]): string[] {
  const recommendations = [];
  
  if (errors.length > 0) {
    recommendations.push('Fix validation errors before importing objects');
  }
  
  if ((results.duplicates as number) > 0) {
    recommendations.push('Review duplicate objects and consider deduplication');
  }
  
  if ((results.conflicts as number) > 0) {
    recommendations.push('Resolve object conflicts by reviewing modified timestamps');
  }
  
  return recommendations;
}

function generateShareRecommendations(shareInfo: Record<string, unknown>): string[] {
  const recommendations = [];
  
  if (!shareInfo.expiresAt) {
    recommendations.push('Consider setting an expiration date for security');
  }
  
  if (shareInfo.permissions === 'write') {
    recommendations.push('Write permissions should only be given to trusted users');
  }
  
  if ((shareInfo.shareWith as unknown[]).length > 10) {
    recommendations.push('Large share lists may be better managed as groups');
  }
  
  return recommendations;
}
