/**
 * Global Type Definitions for Microservices
 */

import { Request, Response, NextFunction, Application } from 'express';
import { Server } from 'http';

// ========================================
// Base Service Configuration
// ========================================

export interface BaseServiceConfig {
  port?: number;
  enableMetrics?: boolean;
  enableLogging?: boolean;
  [key: string]: unknown;
}

export interface ServiceInfo {
  service: string;
  version: string;
  description: string;
  endpoints: Record<string, unknown>;
  uptime: number;
  timestamp: string;
}

// ========================================
// Service Response Types
// ========================================

export interface SuccessResponse<T = unknown> {
  success: true;
  data?: T;
  message?: string;
  timestamp: string;
}

export interface ErrorResponse {
  success: false;
  error: string;
  details?: string;
  code?: string;
  timestamp: string;
}

export type ServiceResponse<T = unknown> = SuccessResponse<T> | ErrorResponse;

// ========================================
// Monitoring Service Types
// ========================================

export interface HealthStatus {
  status: 'OK' | 'DEGRADED' | 'DOWN';
  timestamp: string;
  checks: HealthCheck[];
}

export interface HealthCheck {
  name: string;
  status: 'healthy' | 'unhealthy' | 'unknown';
  latency?: number;
  message?: string;
}

export interface MetricsData {
  memory: {
    rss: string;
    heapTotal: string;
    heapUsed: string;
    external: string;
  };
  process: {
    pid: number;
    nodeVersion: string;
    platform: string;
  };
  uptime: number;
}

// ========================================
// Auth Service Types
// ========================================

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  provider: AuthProvider;
  createdAt: string;
}

export type UserRole = 'GUEST' | 'USER' | 'DEVELOPER' | 'PREMIUM' | 'ENTERPRISE' | 'ADMIN';

export type AuthProvider = 'local' | 'google' | 'microsoft' | 'github' | 'apple';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

// ========================================
// AI Chat Service Types
// ========================================

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatRequest {
  model: string;
  message: string;
  temperature?: number;
  max_tokens?: number;
  history?: ChatMessage[];
}

export interface ChatResponse {
  success: boolean;
  model: string;
  provider: string;
  category: string;
  response: string;
  usage: TokenUsage;
  timestamp: string;
}

export interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  tokens: string;
  category: string;
  description: string;
  capabilities: string[];
  available: boolean;
  enterprise?: boolean;
}

export type AIType = 'code' | 'reasoning' | 'image' | 'chat';

export interface SpecializedChatRequest {
  message: string;
  aiType: AIType;
  history?: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  language?: string;
}

// ========================================
// Azure AI Service Types
// ========================================

export interface AzureServiceRequest {
  service: AzureServiceType;
  query?: string;
  input?: string;
  options?: Record<string, unknown>;
}

export type AzureServiceType =
  | 'chat'
  | 'vision'
  | 'speech'
  | 'translation'
  | 'health'
  | 'quantum'
  | 'search';

export interface AzureVisionResult {
  service: string;
  analysis: {
    description: string;
    tags: string[];
    objects: Array<{ name: string; confidence: number }>;
    colors: { dominant: string; accent: string };
    brands: string[];
    faces: { count: number; emotions: string[] };
    adult: { isAdult: boolean; isRacy: boolean; isGory: boolean };
    confidence: number;
  };
  metadata: {
    width: number;
    height: number;
    format: string;
  };
}

export interface AzureSpeechResult {
  service: string;
  text: string;
  confidence: number;
  language: string;
  duration: number;
  words: Array<{
    word: string;
    confidence: number;
    start: number;
    end: number;
  }>;
}

export interface AzureQuantumResult {
  service: string;
  algorithm: string;
  qubits: number;
  iterations: number;
  result: {
    success: boolean;
    executionTime: number;
    quantumState: Array<{ real: number; imaginary: number }>;
    measurements: Record<string, number>;
    fidelity: number;
  };
}

// ========================================
// Express Middleware Types
// ========================================

export type ExpressMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => void | Promise<void>;

export type ErrorMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => void | Promise<void>;

// ========================================
// Base Service Interface
// ========================================

export interface IBaseService {
  config: BaseServiceConfig;
  app: Application;
  server?: Server;

  init(): void;
  setupRoutes(): void;
  setupErrorHandlers(): void;
  start(): Promise<Server>;
  stop(): Promise<void>;
  getApp(): Application;
}

// ========================================
// Logger Types
// ========================================

export interface LogMetadata {
  [key: string]: unknown;
}

export interface ILogger {
  info(message: string, metadata?: LogMetadata): void;
  warn(message: string, metadata?: LogMetadata): void;
  error(message: string, metadata?: LogMetadata): void;
  debug(message: string, metadata?: LogMetadata): void;
  request(req: Request, metadata?: LogMetadata): void;
}

// ========================================
// Environment Variables
// ========================================

export interface EnvironmentVariables {
  // Server
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: string;

  // Monitoring
  MONITORING_PORT?: string;
  SENTRY_DSN?: string;

  // Auth
  AUTH_PORT?: string;
  JWT_SECRET: string;
  JWT_EXPIRY?: string;

  // OAuth
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  MICROSOFT_CLIENT_ID?: string;
  MICROSOFT_CLIENT_SECRET?: string;
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;
  APPLE_CLIENT_ID?: string;
  APPLE_CLIENT_SECRET?: string;

  // Azure
  AZURE_AI_PORT?: string;
  AZURE_OPENAI_ENDPOINT?: string;
  AZURE_OPENAI_API_KEY?: string;
  AZURE_SUBSCRIPTION_ID?: string;

  // AI Providers
  AI_CHAT_PORT?: string;
  OPENAI_API_KEY?: string;
  ANTHROPIC_API_KEY?: string;
  GROQ_API_KEY?: string;
  GOOGLE_AI_API_KEY?: string;
  ZHIPU_API_KEY?: string;
  YI_API_KEY?: string;
  MISTRAL_API_KEY?: string;

  // Database
  DATABASE_URL?: string;
  REDIS_URL?: string;
  REDIS_PASSWORD?: string;
}

// ========================================
// Utility Types
// ========================================

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type AsyncFunction<T = void> = (...args: unknown[]) => Promise<T>;
