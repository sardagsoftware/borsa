/**
 * 🛡️ AILYDIAN — SOC++ STIX/TAXII Integration
 * 
 * Complete STIX 2.1 threat intelligence sharing system with:
 * - STIX object serialization/deserialization
 * - TAXII 2.1 client for collections
 * - Threat intelligence package management
 * - International indicator sharing
 * - Collection synchronization
 * - Bundle validation and versioning
 */

import { PrismaClient } from '@prisma/client';

// STIX 2.1 Core Object Types
export interface StixObject {
  type: string;
  spec_version: '2.1';
  id: string;
  created: string;
  modified: string;
  created_by_ref?: string;
  revoked?: boolean;
  labels?: string[];
  confidence?: number;
  lang?: string;
  external_references?: ExternalReference[];
  object_marking_refs?: string[];
  granular_markings?: GranularMarking[];
}

export interface StixDomainObject extends StixObject {
  name?: string;
  description?: string;
}

export interface StixRelationshipObject extends StixObject {
  relationship_type: string;
  source_ref: string;
  target_ref: string;
}

// STIX Indicator Object
export interface StixIndicator extends StixDomainObject {
  type: 'indicator';
  pattern: string;
  pattern_type: 'stix' | 'pcre' | 'sigma' | 'snort' | 'suricata' | 'yara';
  pattern_version?: string;
  valid_from: string;
  valid_until?: string;
  kill_chain_phases?: KillChainPhase[];
  indicator_types: IndicatorType[];
}

export interface StixMalware extends StixDomainObject {
  type: 'malware';
  name: string;
  description?: string;
  malware_types: MalwareType[];
  is_family: boolean;
  aliases?: string[];
  kill_chain_phases?: KillChainPhase[];
  first_seen?: string;
  last_seen?: string;
  operating_system_refs?: string[];
  architecture_execution_envs?: string[];
  implementation_languages?: string[];
  capabilities?: string[];
}

export interface StixAttackPattern extends StixDomainObject {
  type: 'attack-pattern';
  name: string;
  description?: string;
  aliases?: string[];
  kill_chain_phases?: KillChainPhase[];
  x_mitre_id?: string;
  x_mitre_tactics?: string[];
  x_mitre_techniques?: string[];
  x_mitre_data_sources?: string[];
  x_mitre_detection?: string;
  x_mitre_platforms?: string[];
}

// STIX Bundle
export interface StixBundle {
  type: 'bundle';
  id: string;
  spec_version: '2.1';
  objects: StixObject[];
}

// TAXII Discovery Response Types
export interface TaxiiDiscovery {
  title: string;
  description?: string;
  contact?: string;
  default?: string;
  api_roots: string[];
}

export interface TaxiiApiRoot {
  title: string;
  description?: string;
  versions: string[];
  max_content_length: number;
}

export interface TaxiiStatus {
  id: string;
  status: 'pending' | 'complete' | 'failure';
  request_timestamp: string;
  total_count: number;
  success_count: number;
  failure_count: number;
  pending_count: number;
}

// Supporting Types
export interface ExternalReference {
  source_name: string;
  description?: string;
  url?: string;
  hashes?: { [key: string]: string };
  external_id?: string;
}

export interface GranularMarking {
  lang?: string;
  marking_ref?: string;
  selectors: string[];
}

export interface KillChainPhase {
  kill_chain_name: string;
  phase_name: string;
}

export type IndicatorType = 
  | 'anomalous-activity'
  | 'attribution'
  | 'backdoor'
  | 'benign'
  | 'compromised'
  | 'malicious-activity'
  | 'unknown';

export type MalwareType = 
  | 'adware'
  | 'backdoor'
  | 'bot'
  | 'bootkit'
  | 'ddos'
  | 'downloader'
  | 'dropper'
  | 'exploit-kit'
  | 'keylogger'
  | 'ransomware'
  | 'remote-access-trojan'
  | 'resource-exploitation'
  | 'rogue-security-software'
  | 'rootkit'
  | 'screen-capture'
  | 'spyware'
  | 'trojan'
  | 'unknown'
  | 'virus'
  | 'webshell'
  | 'wiper'
  | 'worm';

// TAXII 2.1 Types
export interface TaxiiCollection {
  id: string;
  title: string;
  description?: string;
  alias?: string;
  can_read: boolean;
  can_write: boolean;
  media_types: string[];
}

export interface TaxiiManifest {
  objects: ManifestEntry[];
  more?: boolean;
  next?: string;
}

export interface ManifestEntry {
  id: string;
  date_added: string;
  version: string;
  media_type: string;
}

export interface TaxiiCollectionResponse {
  collections: TaxiiCollection[];
}

export interface TaxiiObjectsResponse {
  objects: StixObject[];
  more?: boolean;
  next?: string;
}

// STIX Package Management
export interface StixPackageInfo {
  id: string;
  name: string;
  description?: string;
  version: string;
  created: Date;
  modified: Date;
  objectCount: number;
  source: 'local' | 'taxii' | 'import';
  collectionId?: string;
  tags: string[];
}

/**
 * STIX Object Serializer/Deserializer
 */
export class StixSerializer {
  /**
   * Serialize STIX object to JSON
   */
  static serialize(obj: StixObject): string {
    return JSON.stringify(obj, null, 2);
  }

  /**
   * Deserialize JSON to STIX object
   */
  static deserialize<T extends StixObject>(json: string): T {
    const obj = JSON.parse(json) as T;
    this.validateStixObject(obj as Record<string, unknown>);
    return obj;
  }

  /**
   * Create STIX bundle from objects
   */
  static createBundle(objects: StixObject[]): StixBundle {
    return {
      type: 'bundle',
      id: `bundle--${this.generateUUID()}`,
      spec_version: '2.1',
      objects
    };
  }

  /**
   * Validate STIX object structure
   */
  private static validateStixObject(obj: Record<string, unknown>): void {
    if (!obj.type || !obj.id || !obj.spec_version) {
      throw new Error('Invalid STIX object: missing required fields');
    }
    
    if (obj.spec_version !== '2.1') {
      throw new Error('Unsupported STIX version');
    }

    if (typeof obj.id !== 'string' || !obj.id.includes('--')) {
      throw new Error('Invalid STIX ID format');
    }
  }

  /**
   * Generate STIX-compliant UUID
   */
  private static generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Create STIX indicator from IOC
   */
  static createIndicatorFromIOC(
    ioc: string,
    type: 'ip' | 'domain' | 'url' | 'hash',
    indicatorTypes: IndicatorType[] = ['malicious-activity']
  ): StixIndicator {
    let pattern: string;
    
    switch (type) {
      case 'ip':
        pattern = `[ipv4-addr:value = '${ioc}']`;
        break;
      case 'domain':
        pattern = `[domain-name:value = '${ioc}']`;
        break;
      case 'url':
        pattern = `[url:value = '${ioc}']`;
        break;
      case 'hash':
        const hashType = this.detectHashType(ioc);
        pattern = `[file:hashes.${hashType} = '${ioc}']`;
        break;
      default:
        throw new Error('Unsupported IOC type');
    }

    const now = new Date().toISOString();
    
    return {
      type: 'indicator',
      spec_version: '2.1',
      id: `indicator--${this.generateUUID()}`,
      created: now,
      modified: now,
      pattern,
      pattern_type: 'stix',
      valid_from: now,
      indicator_types: indicatorTypes,
      labels: [`${type}-ioc`]
    };
  }

  /**
   * Detect hash type from length
   */
  private static detectHashType(hash: string): string {
    switch (hash.length) {
      case 32: return 'MD5';
      case 40: return 'SHA-1';
      case 64: return 'SHA-256';
      case 128: return 'SHA-512';
      default: return 'MD5'; // fallback
    }
  }

  /**
   * Create STIX attack pattern from MITRE technique
   */
  static createAttackPatternFromMitre(
    techniqueId: string,
    name: string,
    description: string,
    tactics: string[]
  ): StixAttackPattern {
    const now = new Date().toISOString();
    
    return {
      type: 'attack-pattern',
      spec_version: '2.1',
      id: `attack-pattern--${this.generateUUID()}`,
      created: now,
      modified: now,
      name,
      description,
      x_mitre_id: techniqueId,
      x_mitre_tactics: tactics,
      labels: ['attack-pattern'],
      kill_chain_phases: tactics.map(tactic => ({
        kill_chain_name: 'mitre-attack',
        phase_name: tactic.toLowerCase().replace(/\s+/g, '-')
      }))
    };
  }
}

/**
 * TAXII 2.1 Client
 */
export class TaxiiClient {
  private baseUrl: string;
  private username?: string;
  private password?: string;
  private apiKey?: string;
  private headers: Record<string, string>;

  constructor(
    baseUrl: string,
    auth?: { username: string; password: string } | { apiKey: string }
  ) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    
    if (auth && 'username' in auth) {
      this.username = auth.username;
      this.password = auth.password;
    } else if (auth && 'apiKey' in auth) {
      this.apiKey = auth.apiKey;
    }

    this.headers = {
      'Accept': 'application/taxii+json;version=2.1',
      'Content-Type': 'application/taxii+json;version=2.1'
    };

    if (this.apiKey) {
      this.headers['Authorization'] = `Bearer ${this.apiKey}`;
    }
  }

  /**
   * Get server discovery information
   */
  async getDiscovery(): Promise<TaxiiDiscovery> {
    return this.makeRequest('/taxii2/');
  }

  /**
   * Get API root information
   */
  async getApiRoot(apiRootId: string = 'default'): Promise<TaxiiApiRoot> {
    return this.makeRequest(`/taxii2/${apiRootId}/`);
  }

  /**
   * Get collections
   */
  async getCollections(apiRootId: string = 'default'): Promise<TaxiiCollectionResponse> {
    return this.makeRequest(`/taxii2/${apiRootId}/collections/`);
  }

  /**
   * Get collection by ID
   */
  async getCollection(collectionId: string, apiRootId: string = 'default'): Promise<TaxiiCollection> {
    return this.makeRequest(`/taxii2/${apiRootId}/collections/${collectionId}/`);
  }

  /**
   * Get objects from collection
   */
  async getObjects(
    collectionId: string,
    params?: {
      added_after?: string;
      limit?: number;
      next?: string;
      match?: {
        id?: string[];
        type?: string[];
        version?: string;
      };
    },
    apiRootId: string = 'default'
  ): Promise<TaxiiObjectsResponse> {
    let url = `/taxii2/${apiRootId}/collections/${collectionId}/objects/`;
    
    if (params) {
      const searchParams = new URLSearchParams();
      
      if (params.added_after) {
        searchParams.append('added_after', params.added_after);
      }
      
      if (params.limit) {
        searchParams.append('limit', params.limit.toString());
      }
      
      if (params.next) {
        searchParams.append('next', params.next);
      }
      
      if (params.match) {
        if (params.match.id) {
          params.match.id.forEach(id => searchParams.append('match[id]', id));
        }
        
        if (params.match.type) {
          params.match.type.forEach(type => searchParams.append('match[type]', type));
        }
        
        if (params.match.version) {
          searchParams.append('match[version]', params.match.version);
        }
      }
      
      const queryString = searchParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    return this.makeRequest(url);
  }

  /**
   * Get manifest from collection
   */
  async getManifest(
    collectionId: string,
    params?: {
      added_after?: string;
      limit?: number;
      next?: string;
    },
    apiRootId: string = 'default'
  ): Promise<TaxiiManifest> {
    let url = `/taxii2/${apiRootId}/collections/${collectionId}/manifest/`;
    
    if (params) {
      const searchParams = new URLSearchParams();
      
      if (params.added_after) {
        searchParams.append('added_after', params.added_after);
      }
      
      if (params.limit) {
        searchParams.append('limit', params.limit.toString());
      }
      
      if (params.next) {
        searchParams.append('next', params.next);
      }
      
      const queryString = searchParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    return this.makeRequest(url);
  }

  /**
   * Add objects to collection
   */
  async addObjects(
    collectionId: string,
    bundle: StixBundle,
    apiRootId: string = 'default'
  ): Promise<TaxiiStatus> {
    return this.makeRequest(
      `/taxii2/${apiRootId}/collections/${collectionId}/objects/`,
      {
        method: 'POST',
        body: JSON.stringify(bundle)
      }
    );
  }

  /**
   * Make authenticated HTTP request
   */
  private async makeRequest<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    
    const requestHeaders = { ...this.headers };
    
    if (this.username && this.password && !this.apiKey) {
      const credentials = btoa(`${this.username}:${this.password}`);
      requestHeaders['Authorization'] = `Basic ${credentials}`;
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...requestHeaders,
        ...options.headers
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`TAXII request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
  }
}

/**
 * STIX Package Manager
 */
export class StixPackageManager {
  private prisma: PrismaClient;
  private cache: Map<string, StixPackageInfo>;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.cache = new Map();
  }

  /**
   * Create new STIX package
   */
  async createPackage(
    name: string,
    bundle: StixBundle,
    options?: {
      description?: string;
      tags?: string[];
      source?: 'local' | 'taxii' | 'import';
      collectionId?: string;
    }
  ): Promise<string> {
    const packageId = `package-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const packageData = await this.prisma.stixPackage.create({
      data: {
        id: packageId,
        name,
        description: options?.description,
        version: '1.0.0',
        bundle: JSON.stringify(bundle),
        objectCount: bundle.objects.length,
        source: options?.source || 'local',
        collectionId: options?.collectionId,
        tags: options?.tags || [],
        metadata: {}
      }
    });

    // Update cache
    this.cache.set(packageId, {
      id: packageData.id,
      name: packageData.name,
      description: packageData.description || undefined,
      version: packageData.version,
      created: packageData.createdAt,
      modified: packageData.updatedAt,
      objectCount: packageData.objectCount,
      source: packageData.source as 'local' | 'taxii' | 'import',
      collectionId: packageData.collectionId || undefined,
      tags: packageData.tags
    });

    return packageId;
  }

  /**
   * Get package by ID
   */
  async getPackage(packageId: string): Promise<{ info: StixPackageInfo; bundle: StixBundle } | null> {
    // Check cache first
    let info = this.cache.get(packageId);
    
    if (!info) {
      const packageData = await this.prisma.stixPackage.findUnique({
        where: { id: packageId }
      });

      if (!packageData) {
        return null;
      }

      info = {
        id: packageData.id,
        name: packageData.name,
        description: packageData.description || undefined,
        version: packageData.version,
        created: packageData.createdAt,
        modified: packageData.updatedAt,
        objectCount: packageData.objectCount,
        source: packageData.source as 'local' | 'taxii' | 'import',
        collectionId: packageData.collectionId || undefined,
        tags: packageData.tags
      };

      this.cache.set(packageId, info);
    }

    // Get bundle from database
    const packageData = await this.prisma.stixPackage.findUnique({
      where: { id: packageId },
      select: { bundle: true }
    });

    if (!packageData) {
      return null;
    }

    const bundle = JSON.parse(packageData.bundle) as StixBundle;

    return { info, bundle };
  }

  /**
   * List packages with filtering
   */
  async listPackages(options?: {
    source?: 'local' | 'taxii' | 'import';
    tags?: string[];
    limit?: number;
    offset?: number;
  }): Promise<StixPackageInfo[]> {
    const where: Record<string, unknown> = {};
    
    if (options?.source) {
      where.source = options.source;
    }
    
    if (options?.tags && options.tags.length > 0) {
      where.tags = {
        hasEvery: options.tags
      };
    }

    const packages = await this.prisma.stixPackage.findMany({
      where,
      take: options?.limit || 50,
      skip: options?.offset || 0,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        version: true,
        createdAt: true,
        updatedAt: true,
        objectCount: true,
        source: true,
        collectionId: true,
        tags: true
      }
    });

    return packages.map((pkg) => ({
      id: pkg.id,
      name: pkg.name,
      description: pkg.description || undefined,
      version: pkg.version,
      created: pkg.createdAt,
      modified: pkg.updatedAt,
      objectCount: pkg.objectCount,
      source: pkg.source as 'local' | 'taxii' | 'import',
      collectionId: pkg.collectionId || undefined,
      tags: pkg.tags
    }));
  }

  /**
   * Update package
   */
  async updatePackage(
    packageId: string,
    updates: {
      name?: string;
      description?: string;
      bundle?: StixBundle;
      tags?: string[];
    }
  ): Promise<void> {
    const updateData: Record<string, unknown> = {};
    
    if (updates.name) {
      updateData.name = updates.name;
    }
    
    if (updates.description !== undefined) {
      updateData.description = updates.description;
    }
    
    if (updates.bundle) {
      updateData.bundle = JSON.stringify(updates.bundle);
      updateData.objectCount = updates.bundle.objects.length;
    }
    
    if (updates.tags) {
      updateData.tags = updates.tags;
    }

    await this.prisma.stixPackage.update({
      where: { id: packageId },
      data: updateData
    });

    // Clear cache
    this.cache.delete(packageId);
  }

  /**
   * Delete package
   */
  async deletePackage(packageId: string): Promise<void> {
    await this.prisma.stixPackage.delete({
      where: { id: packageId }
    });

    // Clear cache
    this.cache.delete(packageId);
  }

  /**
   * Import from TAXII collection
   */
  async importFromTaxii(
    taxiiClient: TaxiiClient,
    collectionId: string,
    options?: {
      name?: string;
      description?: string;
      tags?: string[];
      addedAfter?: string;
      limit?: number;
    }
  ): Promise<string> {
    try {
      // Get collection info
      const collection = await taxiiClient.getCollection(collectionId);
      
      // Get objects from collection
      const response = await taxiiClient.getObjects(collectionId, {
        added_after: options?.addedAfter,
        limit: options?.limit || 1000
      });

      if (response.objects.length === 0) {
        throw new Error('No objects found in TAXII collection');
      }

      // Create bundle
      const bundle = StixSerializer.createBundle(response.objects);

      // Create package
      const packageId = await this.createPackage(
        options?.name || `TAXII Import: ${collection.title}`,
        bundle,
        {
          description: options?.description || `Imported from TAXII collection: ${collection.description}`,
          tags: options?.tags || ['taxii-import'],
          source: 'taxii',
          collectionId
        }
      );

      return packageId;
    } catch (error) {
      throw new Error(`TAXII import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Export to TAXII collection
   */
  async exportToTaxii(
    packageId: string,
    taxiiClient: TaxiiClient,
    collectionId: string
  ): Promise<void> {
    const packageData = await this.getPackage(packageId);
    
    if (!packageData) {
      throw new Error('Package not found');
    }

    try {
      await taxiiClient.addObjects(collectionId, packageData.bundle);
    } catch (error) {
      throw new Error(`TAXII export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Search objects within packages
   */
  async searchObjects(query: {
    type?: string;
    labels?: string[];
    pattern?: string;
    packageIds?: string[];
  }): Promise<Array<{ packageId: string; object: StixObject }>> {
    const where: Record<string, unknown> = {};
    
    if (query.packageIds && query.packageIds.length > 0) {
      where.id = { in: query.packageIds };
    }

    const packages = await this.prisma.stixPackage.findMany({
      where,
      select: {
        id: true,
        bundle: true
      }
    });

    const results: Array<{ packageId: string; object: StixObject }> = [];

    for (const pkg of packages) {
      const bundle = JSON.parse(pkg.bundle) as StixBundle;
      
      for (const obj of bundle.objects) {
        let matches = true;
        
        if (query.type && obj.type !== query.type) {
          matches = false;
        }
        
        if (matches && query.labels && query.labels.length > 0) {
          if (!obj.labels || !query.labels.some(label => obj.labels!.includes(label))) {
            matches = false;
          }
        }
        
        if (matches && query.pattern) {
          const objStr = JSON.stringify(obj).toLowerCase();
          if (!objStr.includes(query.pattern.toLowerCase())) {
            matches = false;
          }
        }
        
        if (matches) {
          results.push({
            packageId: pkg.id,
            object: obj
          });
        }
      }
    }

    return results;
  }

  /**
   * Get statistics
   */
  async getStatistics(): Promise<{
    totalPackages: number;
    totalObjects: number;
    packagesBySource: Record<string, number>;
    recentActivity: Array<{ packageId: string; name: string; modified: Date; objectCount: number }>;
  }> {
    const packages = await this.prisma.stixPackage.findMany({
      select: {
        id: true,
        name: true,
        source: true,
        objectCount: true,
        updatedAt: true
      }
    });

    const totalPackages = packages.length;
    const totalObjects = packages.reduce((sum: number, pkg) => sum + pkg.objectCount, 0);
    
    const packagesBySource: Record<string, number> = {};
    packages.forEach((pkg) => {
      packagesBySource[pkg.source] = (packagesBySource[pkg.source] || 0) + 1;
    });

    const recentActivity = packages
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, 10)
      .map((pkg) => ({
        packageId: pkg.id,
        name: pkg.name,
        modified: pkg.updatedAt,
        objectCount: pkg.objectCount
      }));

    return {
      totalPackages,
      totalObjects,
      packagesBySource,
      recentActivity
    };
  }
}

// Main STIX/TAXII Integration Engine
export class StixTaxiiEngine {
  private static instance: StixTaxiiEngine | null = null;
  private packageManager: StixPackageManager;
  private taxiiClients: Map<string, TaxiiClient>;
  private isInitialized: boolean = false;

  private constructor(private prisma: PrismaClient) {
    this.packageManager = new StixPackageManager(prisma);
    this.taxiiClients = new Map();
  }

  /**
   * Get singleton instance
   */
  static getInstance(prisma: PrismaClient): StixTaxiiEngine {
    if (!StixTaxiiEngine.instance) {
      StixTaxiiEngine.instance = new StixTaxiiEngine(prisma);
    }
    return StixTaxiiEngine.instance;
  }

  /**
   * Initialize engine
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    // Initialize default TAXII clients from environment
    const defaultTaxiiUrl = process.env.TAXII_DEFAULT_SERVER;
    const defaultApiKey = process.env.TAXII_DEFAULT_API_KEY;
    
    if (defaultTaxiiUrl) {
      this.addTaxiiClient('default', defaultTaxiiUrl, 
        defaultApiKey ? { apiKey: defaultApiKey } : undefined
      );
    }

    this.isInitialized = true;
  }

  /**
   * Add TAXII client
   */
  addTaxiiClient(
    name: string,
    baseUrl: string,
    auth?: { username: string; password: string } | { apiKey: string }
  ): void {
    this.taxiiClients.set(name, new TaxiiClient(baseUrl, auth));
  }

  /**
   * Get TAXII client
   */
  getTaxiiClient(name: string = 'default'): TaxiiClient {
    const client = this.taxiiClients.get(name);
    if (!client) {
      throw new Error(`TAXII client '${name}' not found`);
    }
    return client;
  }

  /**
   * Get package manager
   */
  getPackageManager(): StixPackageManager {
    return this.packageManager;
  }

  /**
   * Create indicator package from IOCs
   */
  async createIndicatorPackage(
    name: string,
    iocs: Array<{ value: string; type: 'ip' | 'domain' | 'url' | 'hash'; context?: string }>,
    options?: {
      description?: string;
      tags?: string[];
      indicatorTypes?: IndicatorType[];
    }
  ): Promise<string> {
    const indicators: StixIndicator[] = iocs.map(ioc => {
      const indicator = StixSerializer.createIndicatorFromIOC(
        ioc.value,
        ioc.type,
        options?.indicatorTypes
      );
      
      if (ioc.context) {
        indicator.labels = [...(indicator.labels || []), `context:${ioc.context}`];
      }
      
      return indicator;
    });

    const bundle = StixSerializer.createBundle(indicators);
    
    return this.packageManager.createPackage(name, bundle, {
      description: options?.description,
      tags: options?.tags || ['indicators', 'iocs'],
      source: 'local'
    });
  }

  /**
   * Sync with TAXII collection
   */
  async syncWithTaxii(
    clientName: string = 'default',
    collectionId: string,
    options?: {
      packageName?: string;
      addedAfter?: string;
      tags?: string[];
    }
  ): Promise<string> {
    const client = this.getTaxiiClient(clientName);
    
    return this.packageManager.importFromTaxii(client, collectionId, {
      name: options?.packageName,
      tags: options?.tags || ['taxii-sync'],
      addedAfter: options?.addedAfter
    });
  }

  /**
   * Get threat intelligence summary
   */
  async getThreatIntelligenceSummary(): Promise<{
    statistics: Awaited<ReturnType<StixPackageManager['getStatistics']>>;
    recentIndicators: Array<{ packageId: string; indicator: StixIndicator }>;
    topThreatTypes: Array<{ type: string; count: number }>;
  }> {
    const statistics = await this.packageManager.getStatistics();
    
    // Get recent indicators
    const indicatorResults = await this.packageManager.searchObjects({
      type: 'indicator'
    });
    
    const recentIndicators = indicatorResults
      .map(result => ({
        packageId: result.packageId,
        indicator: result.object as StixIndicator
      }))
      .sort((a, b) => new Date(b.indicator.modified).getTime() - new Date(a.indicator.modified).getTime())
      .slice(0, 10);

    // Count threat types
    const threatTypeCount: Record<string, number> = {};
    indicatorResults.forEach(result => {
      const indicator = result.object as StixIndicator;
      indicator.indicator_types.forEach(type => {
        threatTypeCount[type] = (threatTypeCount[type] || 0) + 1;
      });
    });

    const topThreatTypes = Object.entries(threatTypeCount)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      statistics,
      recentIndicators,
      topThreatTypes
    };
  }
}
