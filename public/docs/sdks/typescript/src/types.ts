/**
 * Core types for Lydian AI SDK
 */

export interface LydianConfig {
  apiKey?: string;
  baseUrl?: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

export interface OAuth2Config {
  clientId: string;
  clientSecret: string;
  tokenUrl?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  cursor?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
    cursor?: string;
  };
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}

// Smart Cities Types
export interface City {
  id: string;
  name: string;
  country: string;
  population?: number;
  timezone?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CityAsset {
  id: string;
  cityId: string;
  type: 'sensor' | 'camera' | 'traffic-light' | 'parking' | 'building' | 'vehicle' | 'other';
  name: string;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  status: 'active' | 'inactive' | 'maintenance';
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CityMetrics {
  cityId: string;
  timestamp: string;
  metrics: {
    traffic: {
      congestionLevel: number;
      averageSpeed: number;
      incidents: number;
    };
    environment: {
      airQuality: number;
      temperature: number;
      humidity: number;
    };
    safety: {
      crimeRate: number;
      emergencyResponses: number;
    };
    infrastructure: {
      activeAssets: number;
      maintenanceAlerts: number;
    };
  };
}

export interface Alert {
  id: string;
  cityId: string;
  type: 'traffic' | 'environment' | 'safety' | 'infrastructure' | 'emergency';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  status: 'open' | 'acknowledged' | 'resolved';
  createdAt: string;
  resolvedAt?: string;
}

// İnsan IQ Types
export interface Persona {
  id: string;
  name: string;
  type: 'doctor' | 'engineer' | 'teacher' | 'researcher' | 'custom';
  description?: string;
  capabilities: string[];
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface Skill {
  id: string;
  personaId: string;
  name: string;
  category: string;
  proficiencyLevel: number;
  description?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface ChatSession {
  id: string;
  personaId: string;
  userId?: string;
  title?: string;
  status: 'active' | 'paused' | 'completed';
  messageCount: number;
  createdAt: string;
  lastMessageAt?: string;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

// LyDian IQ Types
export interface Signal {
  id: string;
  type: 'text' | 'image' | 'audio' | 'video' | 'sensor' | 'structured';
  source: string;
  content: any;
  timestamp: string;
  metadata?: Record<string, any>;
  processed: boolean;
  processedAt?: string;
}

export interface KnowledgeEntity {
  id: string;
  type: string;
  name: string;
  properties: Record<string, any>;
  relationships: Array<{
    type: string;
    targetId: string;
    properties?: Record<string, any>;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeQuery {
  query: string;
  entityTypes?: string[];
  filters?: Record<string, any>;
  limit?: number;
}

export interface KnowledgeQueryResult {
  entities: KnowledgeEntity[];
  relationships: Array<{
    source: string;
    target: string;
    type: string;
    properties?: Record<string, any>;
  }>;
  insights: string[];
}

export interface Insight {
  id: string;
  type: 'pattern' | 'anomaly' | 'prediction' | 'recommendation' | 'trend';
  title: string;
  description: string;
  confidence: number;
  evidence: Array<{
    type: string;
    data: any;
  }>;
  actionable: boolean;
  actions?: string[];
  createdAt: string;
}
