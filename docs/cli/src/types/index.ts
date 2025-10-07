/**
 * LyDian CLI Type Definitions
 * Complete TypeScript types for the LyDian Enterprise Platform CLI
 */

// Configuration Types
export interface LydianConfig {
  current_profile: string;
  profiles: Record<string, ProfileConfig>;
  settings: GlobalSettings;
}

export interface ProfileConfig {
  endpoint: string;
  auth_method: 'oauth2' | 'apikey';
  apikey?: string;
  access_token?: string;
  refresh_token?: string;
  token_expires_at?: number;
}

export interface GlobalSettings {
  timeout: number;
  retry: number;
  output_format: 'table' | 'json' | 'yaml';
  color: boolean;
  verbose?: boolean;
}

// Authentication Types
export interface AuthTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

export interface DeviceCodeResponse {
  device_code: string;
  user_code: string;
  verification_uri: string;
  verification_uri_complete: string;
  expires_in: number;
  interval: number;
}

export interface UserInfo {
  id: string;
  email: string;
  name: string;
  organization?: string;
  roles: string[];
  scopes: string[];
}

// API Key Types
export interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  scopes: string[];
  created_at: string;
  last_used_at?: string;
  expires_at?: string;
  status: 'active' | 'revoked';
}

export interface CreateApiKeyRequest {
  name: string;
  scopes: string[];
  expires_in?: number;
}

export interface CreateApiKeyResponse {
  id: string;
  name: string;
  api_key: string;
  scopes: string[];
  created_at: string;
  expires_at?: string;
}

// Smart Cities Types
export interface City {
  id: string;
  name: string;
  country: string;
  region?: string;
  population: number;
  area_km2?: number;
  timezone: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CreateCityRequest {
  name: string;
  country: string;
  region?: string;
  population: number;
  area_km2?: number;
  timezone?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  metadata?: Record<string, any>;
}

export interface CityAsset {
  id: string;
  city_id: string;
  type: 'sensor' | 'camera' | 'traffic_light' | 'meter' | 'other';
  name: string;
  location: {
    latitude: number;
    longitude: number;
  };
  status: 'active' | 'inactive' | 'maintenance';
  metadata?: Record<string, any>;
  last_reading?: any;
  created_at: string;
}

export interface CityMetrics {
  city_id: string;
  kind: string;
  timestamp: string;
  value: number;
  unit: string;
  metadata?: Record<string, any>;
}

export interface CityAlert {
  id: string;
  city_id: string;
  severity: 'info' | 'warning' | 'critical';
  type: string;
  message: string;
  source?: string;
  metadata?: Record<string, any>;
  created_at: string;
  resolved_at?: string;
}

// Personas (Insan-IQ) Types
export interface Persona {
  id: string;
  name: string;
  type: 'customer' | 'employee' | 'citizen' | 'agent';
  email?: string;
  phone?: string;
  attributes: Record<string, any>;
  skills: string[];
  preferences?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CreatePersonaRequest {
  name: string;
  type: 'customer' | 'employee' | 'citizen' | 'agent';
  email?: string;
  phone?: string;
  attributes?: Record<string, any>;
  skills?: string[];
  preferences?: Record<string, any>;
}

export interface PersonaSkill {
  id: string;
  persona_id: string;
  name: string;
  category: string;
  proficiency: number;
  verified: boolean;
  metadata?: Record<string, any>;
  created_at: string;
}

// Signals (LyDian-IQ) Types
export interface Signal {
  id: string;
  type: 'metric' | 'event' | 'alert' | 'insight';
  source: string;
  timestamp: string;
  data: Record<string, any>;
  metadata?: Record<string, any>;
  processed: boolean;
  created_at: string;
}

export interface SendSignalRequest {
  type: 'metric' | 'event' | 'alert' | 'insight';
  source?: string;
  data: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface SignalInsight {
  id: string;
  signal_id: string;
  insight_type: string;
  content: string;
  confidence: number;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface KnowledgeGraphNode {
  id: string;
  type: string;
  label: string;
  properties: Record<string, any>;
}

export interface KnowledgeGraphEdge {
  id: string;
  source: string;
  target: string;
  relationship: string;
  properties?: Record<string, any>;
}

export interface KnowledgeGraph {
  nodes: KnowledgeGraphNode[];
  edges: KnowledgeGraphEdge[];
  metadata?: Record<string, any>;
}

// Module Types
export interface Module {
  id: string;
  name: string;
  version: string;
  description: string;
  status: 'active' | 'inactive' | 'deprecated';
  capabilities: string[];
  endpoints: Record<string, string>;
  documentation_url?: string;
}

// HTTP Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  metadata?: {
    page?: number;
    limit?: number;
    total?: number;
    next_cursor?: string;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  request_id?: string;
}

// CLI Options Types
export interface GlobalOptions {
  verbose?: boolean;
  json?: boolean;
  yaml?: boolean;
  silent?: boolean;
  timeout?: number;
  retry?: number;
  profile?: string;
}

export interface ListOptions extends GlobalOptions {
  limit?: number;
  offset?: number;
  cursor?: string;
  filter?: string;
  sort?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
  next_cursor?: string;
}

// Exit Codes
export enum ExitCode {
  SUCCESS = 0,
  ERROR = 1,
  USAGE_ERROR = 2,
  AUTH_ERROR = 3,
  NOT_FOUND = 4,
  NETWORK_ERROR = 5,
  CONFIG_ERROR = 6
}
