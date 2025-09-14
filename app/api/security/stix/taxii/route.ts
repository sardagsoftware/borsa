/**
 * 🛡️ AILYDIAN — SOC++ TAXII Server API
 * 
 * TAXII (Trusted Automated eXchange of Intelligence Information) 2.1 server
 * - TAXII server discovery and management
 * - API root and collection handling
 * - Threat intelligence sharing and synchronization
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data, options } = body;

    switch (action) {
      case 'configure':
        return handleConfigureServer(data, options);
        
      case 'sync':
        return handleSyncCollections(data, options);
        
      case 'publish':
        return handlePublishObjects(data, options);
        
      case 'subscribe':
        return handleSubscribeToCollection(data, options);
        
      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported: configure, sync, publish, subscribe' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('TAXII server error:', error);
    return NextResponse.json(
      { 
        error: 'TAXII server operation failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action') || 'discovery';
    const serverId = searchParams.get('serverId');
    const collectionId = searchParams.get('collectionId');

    switch (action) {
      case 'discovery':
        return handleDiscovery();
        
      case 'servers':
        return handleListServers();
        
      case 'collections':
        return handleListCollections(serverId);
        
      case 'objects':
        return handleGetObjects(serverId, collectionId);
        
      case 'manifest':
        return handleGetManifest(serverId, collectionId);
        
      case 'status':
        return handleServerStatus(serverId);
        
      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported: discovery, servers, collections, objects, manifest, status' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('TAXII server GET error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to retrieve TAXII server data', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const serverId = searchParams.get('serverId');
    const collectionId = searchParams.get('collectionId');

    if (!serverId) {
      return NextResponse.json(
        { error: 'Server ID is required' },
        { status: 400 }
      );
    }

    if (collectionId) {
      return handleDeleteCollection(serverId, collectionId);
    } else {
      return handleDeleteServer(serverId);
    }

  } catch (error) {
    console.error('TAXII server DELETE error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete TAXII server resource', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

/**
 * Handle configure TAXII server
 */
async function handleConfigureServer(
  data: Record<string, unknown>, 
  options: Record<string, unknown> = {}
): Promise<NextResponse> {
  if (!data.url || !data.title) {
    return NextResponse.json(
      { error: 'Server URL and title are required' },
      { status: 400 }
    );
  }

  try {
    const serverId = `server--${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Test server connection
    const connectionTest = await testTAXIIConnection(data.url as string, data);
    if (!connectionTest.success && options.requireConnection !== false) {
      return NextResponse.json(
        { 
          error: 'Failed to connect to TAXII server', 
          details: connectionTest.error 
        },
        { status: 400 }
      );
    }

    // Create server configuration
    const serverConfig = {
      serverId,
      title: data.title as string,
      description: data.description as string || 'TAXII 2.1 Server',
      url: data.url as string,
      version: '2.1',
      contact: data.contact as string || '',
      authentication: {
        type: data.authType || 'none',
        username: data.username || '',
        password: data.password || '',
        apiKey: data.apiKey || ''
      },
      capabilities: {
        supportsPublishing: data.canPublish || false,
        supportsSubscription: data.canSubscribe || false,
        maxPageSize: data.maxPageSize || 1000,
        supportsFiltering: data.supportsFiltering || true
      },
      status: connectionTest.success ? 'connected' : 'configured',
      lastSync: null as string | null,
      collections: [] as unknown[]
    };

    // Store in database (using metadata field for now)
    const taxiiServer = await prisma.stixPackage.create({
      data: {
        name: `TAXII Server: ${data.title}`,
        description: `TAXII server configuration for ${data.url}`,
        version: '2.1',
        bundle: JSON.stringify({
          type: 'bundle',
          id: serverId,
          spec_version: '2.1',
          objects: []
        }),
        objectCount: 0,
        source: 'taxii',
        tags: ['taxii-server', 'configuration'],
        metadata: serverConfig
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        id: taxiiServer.id,
        serverId,
        title: serverConfig.title,
        url: serverConfig.url,
        status: serverConfig.status,
        connectionTest,
        capabilities: serverConfig.capabilities,
        createdAt: taxiiServer.createdAt,
        recommendations: generateServerRecommendations(serverConfig, connectionTest)
      }
    });

  } catch (error) {
    console.error('Configure TAXII server error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to configure TAXII server', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

/**
 * Handle sync collections
 */
async function handleSyncCollections(
  data: Record<string, unknown>, 
  options: Record<string, unknown> = {}
): Promise<NextResponse> {
  if (!data.serverId) {
    return NextResponse.json(
      { error: 'Server ID is required for synchronization' },
      { status: 400 }
    );
  }

  try {
    const serverId = data.serverId as string;
    
    // Mock synchronization process
    const syncResults = {
      serverId,
      startTime: new Date().toISOString(),
      collections: [
        {
          id: 'collection-1',
          title: 'Malware Collection',
          objectCount: 127,
          newObjects: 15,
          updatedObjects: 3,
          status: 'synced'
        },
        {
          id: 'collection-2', 
          title: 'Threat Actor Collection',
          objectCount: 89,
          newObjects: 7,
          updatedObjects: 1,
          status: 'synced'
        }
      ],
      totalObjects: 216,
      newObjects: 22,
      updatedObjects: 4,
      errors: [] as string[],
      duration: Math.floor(Math.random() * 30000),
      endTime: new Date(Date.now() + Math.random() * 30000).toISOString()
    };

    // Update server metadata with sync results
    await updateServerSyncStatus(serverId, syncResults);

    return NextResponse.json({
      success: true,
      data: {
        syncId: `sync--${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        serverId,
        results: syncResults,
        summary: {
          collections: syncResults.collections.length,
          totalObjects: syncResults.totalObjects,
          newObjects: syncResults.newObjects,
          duration: `${Math.round(syncResults.duration / 1000)}s`
        },
        recommendations: generateSyncRecommendations(syncResults)
      }
    });

  } catch (error) {
    console.error('Sync collections error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to sync collections', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

/**
 * Handle publish objects
 */
async function handlePublishObjects(
  data: Record<string, unknown>, 
  options: Record<string, unknown> = {}
): Promise<NextResponse> {
  if (!data.serverId || !data.collectionId || !data.objects) {
    return NextResponse.json(
      { error: 'Server ID, collection ID, and objects are required for publishing' },
      { status: 400 }
    );
  }

  try {
    const objects = data.objects as Record<string, unknown>[];
    const serverId = data.serverId as string;
    const collectionId = data.collectionId as string;

    // Validate objects before publishing
    const validationResults = objects.map(obj => validateSTIXObject(obj));
    const invalidObjects = validationResults.filter(result => !result.valid);

    if (invalidObjects.length > 0 && options.allowInvalid !== true) {
      return NextResponse.json(
        { 
          error: 'Invalid STIX objects found', 
          invalidObjects: invalidObjects.map(result => result.errors) 
        },
        { status: 400 }
      );
    }

    // Mock publishing process
    const publishResults = {
      serverId,
      collectionId,
      totalObjects: objects.length,
      publishedObjects: objects.length - invalidObjects.length,
      failedObjects: invalidObjects.length,
      publishId: `publish--${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      publishTime: new Date().toISOString(),
      status: invalidObjects.length === 0 ? 'success' : 'partial'
    };

    return NextResponse.json({
      success: true,
      data: {
        publishId: publishResults.publishId,
        serverId: publishResults.serverId,
        collectionId: publishResults.collectionId,
        results: publishResults,
        summary: `Published ${publishResults.publishedObjects}/${publishResults.totalObjects} objects`,
        validationResults: invalidObjects.length > 0 ? invalidObjects : undefined,
        recommendations: generatePublishRecommendations(publishResults, invalidObjects)
      }
    });

  } catch (error) {
    console.error('Publish objects error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to publish objects', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

/**
 * Handle subscribe to collection
 */
async function handleSubscribeToCollection(
  data: Record<string, unknown>, 
  options: Record<string, unknown> = {}
): Promise<NextResponse> {
  if (!data.serverId || !data.collectionId) {
    return NextResponse.json(
      { error: 'Server ID and collection ID are required for subscription' },
      { status: 400 }
    );
  }

  try {
    const subscriptionId = `subscription--${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const subscription = {
      subscriptionId,
      serverId: data.serverId as string,
      collectionId: data.collectionId as string,
      filters: data.filters || {},
      schedule: data.schedule || 'hourly', // hourly, daily, weekly
      webhookUrl: data.webhookUrl as string || null,
      isActive: true,
      createdAt: new Date().toISOString(),
      lastSync: null as string | null,
      nextSync: calculateNextSync(data.schedule as string || 'hourly')
    };

    // Store subscription (mock implementation)
    const subscriptionData = await createSubscription(subscription);

    return NextResponse.json({
      success: true,
      data: {
        subscriptionId: subscription.subscriptionId,
        serverId: subscription.serverId,
        collectionId: subscription.collectionId,
        schedule: subscription.schedule,
        nextSync: subscription.nextSync,
        status: 'active',
        filters: subscription.filters,
        webhookUrl: subscription.webhookUrl,
        createdAt: subscription.createdAt,
        recommendations: generateSubscriptionRecommendations(subscription)
      }
    });

  } catch (error) {
    console.error('Subscribe to collection error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create subscription', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

/**
 * Handle discovery
 */
async function handleDiscovery(): Promise<NextResponse> {
  try {
    const discovery = {
      title: 'SOC++ TAXII Server',
      description: 'AILYDIAN SOC++ Threat Intelligence Sharing Server',
      contact: 'security@ailydian.com',
      default: 'https://localhost:3000/api/security/stix/taxii/',
      api_roots: [
        'https://localhost:3000/api/security/stix/taxii/api1/',
        'https://localhost:3000/api/security/stix/taxii/api2/'
      ]
    };

    return NextResponse.json({
      success: true,
      data: discovery
    });

  } catch (error) {
    console.error('Discovery error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get discovery information', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

/**
 * Handle list servers
 */
async function handleListServers(): Promise<NextResponse> {
  try {
    // Get TAXII servers from database
    const servers = await prisma.stixPackage.findMany({
      where: {
        source: 'taxii',
        tags: {
          has: 'taxii-server'
        }
      },
      select: {
        id: true,
        name: true,
        description: true,
        metadata: true,
        createdAt: true,
        updatedAt: true
      }
    });

    const serverList = servers.map(server => {
      const config = server.metadata as Record<string, unknown>;
      return {
        id: server.id,
        serverId: config.serverId,
        title: config.title,
        url: config.url,
        status: config.status,
        lastSync: config.lastSync,
        collections: (config.collections as unknown[]).length,
        createdAt: server.createdAt,
        updatedAt: server.updatedAt
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        servers: serverList,
        total: serverList.length,
        connected: serverList.filter(s => s.status === 'connected').length,
        configured: serverList.filter(s => s.status === 'configured').length
      }
    });

  } catch (error) {
    console.error('List servers error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to list servers', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

/**
 * Handle list collections
 */
async function handleListCollections(serverId: string | null): Promise<NextResponse> {
  if (!serverId) {
    return NextResponse.json(
      { error: 'Server ID is required' },
      { status: 400 }
    );
  }

  try {
    // Mock collections data
    const collections = [
      {
        id: 'collection--malware-analysis',
        title: 'Malware Analysis',
        description: 'Collection of malware samples and analysis',
        can_read: true,
        can_write: false,
        media_types: ['application/stix+json;version=2.1']
      },
      {
        id: 'collection--threat-actors',
        title: 'Threat Actors',
        description: 'Known threat actor profiles and activities',
        can_read: true,
        can_write: true,
        media_types: ['application/stix+json;version=2.1']
      },
      {
        id: 'collection--indicators',
        title: 'Indicators of Compromise',
        description: 'IOCs and threat indicators',
        can_read: true,
        can_write: true,
        media_types: ['application/stix+json;version=2.1']
      }
    ];

    return NextResponse.json({
      success: true,
      data: {
        serverId,
        collections,
        total: collections.length,
        writable: collections.filter(c => c.can_write).length,
        readonly: collections.filter(c => !c.can_write).length
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
 * Handle get objects
 */
async function handleGetObjects(serverId: string | null, collectionId: string | null): Promise<NextResponse> {
  if (!serverId || !collectionId) {
    return NextResponse.json(
      { error: 'Server ID and collection ID are required' },
      { status: 400 }
    );
  }

  try {
    // Mock STIX objects from collection
    const objects = [
      {
        type: 'malware',
        spec_version: '2.1',
        id: 'malware--162d917e-766f-4611-b5d6-652791454fca',
        created: '2024-01-01T00:00:00.000Z',
        modified: '2024-01-01T00:00:00.000Z',
        name: 'Zeus Banking Trojan',
        is_family: true
      },
      {
        type: 'indicator',
        spec_version: '2.1',
        id: 'indicator--34558c72-7a4b-4190-ad23-c6b4bf8e6db9',
        created: '2024-01-01T00:00:00.000Z',
        modified: '2024-01-01T00:00:00.000Z',
        pattern: "[file:hashes.'SHA-256' = 'abc123def456']",
        labels: ['malicious-activity']
      }
    ];

    return NextResponse.json({
      success: true,
      data: {
        serverId,
        collectionId,
        objects,
        more: false,
        next: null,
        total: objects.length
      }
    });

  } catch (error) {
    console.error('Get objects error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get objects', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

/**
 * Handle get manifest
 */
async function handleGetManifest(serverId: string | null, collectionId: string | null): Promise<NextResponse> {
  if (!serverId || !collectionId) {
    return NextResponse.json(
      { error: 'Server ID and collection ID are required' },
      { status: 400 }
    );
  }

  try {
    // Mock manifest data
    const manifest = [
      {
        id: 'malware--162d917e-766f-4611-b5d6-652791454fca',
        date_added: '2024-01-01T00:00:00.000Z',
        version: '1',
        media_type: 'application/stix+json;version=2.1'
      },
      {
        id: 'indicator--34558c72-7a4b-4190-ad23-c6b4bf8e6db9',
        date_added: '2024-01-01T00:00:00.000Z',
        version: '1',
        media_type: 'application/stix+json;version=2.1'
      }
    ];

    return NextResponse.json({
      success: true,
      data: {
        serverId,
        collectionId,
        objects: manifest,
        more: false,
        next: null,
        total: manifest.length
      }
    });

  } catch (error) {
    console.error('Get manifest error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get manifest', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

/**
 * Handle server status
 */
async function handleServerStatus(serverId: string | null): Promise<NextResponse> {
  if (!serverId) {
    return NextResponse.json(
      { error: 'Server ID is required' },
      { status: 400 }
    );
  }

  try {
    // Mock server status
    const status = {
      serverId,
      status: 'online',
      version: '2.1',
      lastPing: new Date().toISOString(),
      responseTime: Math.floor(Math.random() * 200),
      collections: 3,
      totalObjects: 1543,
      lastSync: new Date(Date.now() - Math.random() * 86400000).toISOString(),
      syncStatus: 'success',
      errors: [] as string[],
      health: 'good' as 'good' | 'warning' | 'error'
    };

    return NextResponse.json({
      success: true,
      data: status
    });

  } catch (error) {
    console.error('Server status error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get server status', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

/**
 * Handle delete collection
 */
async function handleDeleteCollection(serverId: string, collectionId: string): Promise<NextResponse> {
  try {
    return NextResponse.json({
      success: true,
      data: {
        serverId,
        collectionId,
        deletedAt: new Date().toISOString(),
        message: 'Collection subscription deleted successfully'
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

/**
 * Handle delete server
 */
async function handleDeleteServer(serverId: string): Promise<NextResponse> {
  try {
    // Find and delete server configuration
    const server = await prisma.stixPackage.findFirst({
      where: {
        source: 'taxii',
        tags: { has: 'taxii-server' },
        metadata: {
          path: ['serverId'],
          equals: serverId
        }
      }
    });

    if (!server) {
      return NextResponse.json(
        { error: 'Server not found' },
        { status: 404 }
      );
    }

    await prisma.stixPackage.delete({
      where: { id: server.id }
    });

    return NextResponse.json({
      success: true,
      data: {
        serverId,
        deletedAt: new Date().toISOString(),
        message: 'TAXII server deleted successfully'
      }
    });

  } catch (error) {
    console.error('Delete server error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete server', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// Helper functions
async function testTAXIIConnection(url: string, config: Record<string, unknown>): Promise<{ success: boolean; error?: string; serverInfo?: Record<string, unknown> }> {
  try {
    // Mock connection test
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (Math.random() > 0.8) {
      return {
        success: false,
        error: 'Connection timeout or server unreachable'
      };
    }

    return {
      success: true,
      serverInfo: {
        title: 'TAXII 2.1 Server',
        version: '2.1',
        maxPageSize: 1000,
        collections: 3
      }
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Connection failed'
    };
  }
}

async function updateServerSyncStatus(serverId: string, results: Record<string, unknown>): Promise<void> {
  // Mock implementation - in real scenario, update database
  console.log(`Updating sync status for server ${serverId}:`, results);
}

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

function calculateNextSync(schedule: string): string {
  const now = Date.now();
  let nextSync = now;
  
  switch (schedule) {
    case 'hourly':
      nextSync += 60 * 60 * 1000; // 1 hour
      break;
    case 'daily':
      nextSync += 24 * 60 * 60 * 1000; // 24 hours
      break;
    case 'weekly':
      nextSync += 7 * 24 * 60 * 60 * 1000; // 7 days
      break;
    default:
      nextSync += 60 * 60 * 1000; // default to hourly
  }
  
  return new Date(nextSync).toISOString();
}

async function createSubscription(subscription: Record<string, unknown>): Promise<Record<string, unknown>> {
  // Mock implementation - in real scenario, store in database
  console.log('Creating subscription:', subscription);
  return subscription;
}

function generateServerRecommendations(config: Record<string, unknown>, test: { success: boolean }): string[] {
  const recommendations = [];
  
  if (!test.success) {
    recommendations.push('Fix connection issues before using this server');
  }
  
  if (!config.authentication || (config.authentication as Record<string, unknown>).type === 'none') {
    recommendations.push('Consider using authentication for better security');
  }
  
  recommendations.push('Test synchronization with a small collection first');
  
  return recommendations;
}

function generateSyncRecommendations(results: Record<string, unknown>): string[] {
  const recommendations = [];
  
  if ((results.errors as unknown[]).length > 0) {
    recommendations.push('Review and fix synchronization errors');
  }
  
  if ((results.newObjects as number) > 1000) {
    recommendations.push('Large number of new objects - consider filtering');
  }
  
  recommendations.push('Schedule regular synchronization for up-to-date intelligence');
  
  return recommendations;
}

function generatePublishRecommendations(results: Record<string, unknown>, errors: unknown[]): string[] {
  const recommendations = [];
  
  if (errors.length > 0) {
    recommendations.push('Fix validation errors before publishing');
  }
  
  if ((results.totalObjects as number) > 100) {
    recommendations.push('Consider publishing in smaller batches');
  }
  
  recommendations.push('Validate objects against STIX 2.1 specification');
  
  return recommendations;
}

function generateSubscriptionRecommendations(subscription: Record<string, unknown>): string[] {
  const recommendations = [];
  
  if (!subscription.webhookUrl) {
    recommendations.push('Configure webhook URL for real-time notifications');
  }
  
  if (subscription.schedule === 'hourly') {
    recommendations.push('Hourly sync may be resource intensive - consider daily');
  }
  
  recommendations.push('Use filters to limit data to relevant threat intelligence');
  
  return recommendations;
}
