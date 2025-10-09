// ========================================
// GATEWAY API TYPES
// ========================================

import { z } from 'zod';

/**
 * Action Execution Request
 */
export const ActionExecutionRequestSchema = z.object({
  action: z.string().min(1),
  payload: z.record(z.any()),
  scopes: z.array(z.string()).optional().default([]),
  metadata: z.record(z.any()).optional(),
});

export type ActionExecutionRequest = z.infer<typeof ActionExecutionRequestSchema>;

/**
 * Action Execution Response
 */
export const ActionExecutionResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.any().optional(),
  }).optional(),
  metadata: z.object({
    requestId: z.string(),
    responseTime: z.number(),
    rateLimitRemaining: z.number().optional(),
  }),
});

export type ActionExecutionResponse = z.infer<typeof ActionExecutionResponseSchema>;

/**
 * Health Check Response
 */
export const HealthCheckResponseSchema = z.object({
  status: z.enum(['healthy', 'degraded', 'unhealthy']),
  timestamp: z.string(),
  version: z.string(),
  connectors: z.array(z.object({
    id: z.string(),
    healthy: z.boolean(),
    message: z.string().optional(),
  })),
});

export type HealthCheckResponse = z.infer<typeof HealthCheckResponseSchema>;
