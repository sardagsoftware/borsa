/**
 * LyDian Smart Cities SDK
 * @packageDocumentation
 */

export { SmartCitiesClient, createClient } from './client';
export type {
  AuthConfig,
  SmartCitiesConfig,
  LydianError,
  PaginatedResponse,
} from './client';

// Re-export types from generated OpenAPI types
export type { components, paths, operations } from './types';
