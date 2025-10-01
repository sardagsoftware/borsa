/**
 * Railway AI Microservice Client
 *
 * Production-Grade HMAC-Authenticated Client
 *
 * Security Features:
 * - HMAC-SHA256 signature generation
 * - Timestamp-based replay attack prevention
 * - Request/response validation with Zod
 * - Comprehensive error handling
 * - Retry logic with exponential backoff
 * - Request timeout (10 seconds)
 *
 * White-hat compliant: Ethical AI client, secure communication
 */

import crypto from 'crypto';
import axios, { AxiosError } from 'axios';
import { z } from 'zod';

// ============================================================================
// ENVIRONMENT VARIABLES
// ============================================================================

const RAILWAY_API_URL = process.env.RAILWAY_AI_API_URL || 'https://borsa-production.up.railway.app';
const RAILWAY_API_SECRET = process.env.RAILWAY_AI_API_SECRET;

if (!RAILWAY_API_SECRET) {
  throw new Error('RAILWAY_AI_API_SECRET environment variable is required');
}

// ============================================================================
// ZOD SCHEMAS - REQUEST/RESPONSE VALIDATION
// ============================================================================

/**
 * Trading Signal Request Schema
 */
const SignalRequestSchema = z.object({
  symbol: z.string()
    .regex(/^[A-Z]{6,12}$/, 'Symbol must be 6-12 uppercase letters')
    .describe('Trading pair (e.g., BTCUSDT)'),
  timeframe: z.enum(['1m', '5m', '15m', '1h', '4h', '1d'])
    .default('1h')
    .describe('Timeframe for analysis')
});

/**
 * Trading Signal Response Schema
 */
const SignalResponseSchema = z.object({
  success: z.boolean(),
  signal: z.object({
    symbol: z.string(),
    timeframe: z.string(),
    action: z.enum(['BUY', 'SELL', 'HOLD']),
    confidence: z.number().min(0).max(1),
    entryPrice: z.number().positive(),
    stopLoss: z.number().positive(),
    takeProfit: z.number().positive(),
    currentPrice: z.number().positive(),
    timestamp: z.number(),
    source: z.string(),
    version: z.string(),
    indicators: z.object({
      rsi: z.object({
        value: z.number(),
        signal: z.string(),
        weight: z.number()
      }),
      macd: z.object({
        value: z.number(),
        signal: z.string(),
        histogram: z.number(),
        weight: z.number()
      }),
      bollinger: z.object({
        upper: z.number(),
        middle: z.number(),
        lower: z.number(),
        position: z.string(),
        weight: z.number()
      }),
      volume: z.object({
        ratio: z.number(),
        trend: z.string(),
        isHighVolume: z.boolean(),
        weight: z.number()
      }),
      trend: z.object({
        direction: z.string(),
        ema9: z.number(),
        ema21: z.number(),
        ema50: z.number(),
        weight: z.number()
      })
    }),
    metadata: z.object({
      requestId: z.string(),
      processingTime: z.number(),
      dataPoints: z.number(),
      algorithm: z.string(),
      riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH'])
    })
  }).optional(),
  error: z.string().optional(),
  code: z.string().optional(),
  message: z.string().optional()
});

/**
 * Batch Signals Response Schema
 */
const BatchSignalsResponseSchema = z.object({
  success: z.boolean(),
  results: z.array(
    z.union([
      SignalResponseSchema.shape.signal,
      z.object({
        symbol: z.string(),
        error: z.string(),
        success: z.literal(false)
      })
    ])
  ),
  count: z.number(),
  timestamp: z.number()
});

// ============================================================================
// TYPES
// ============================================================================

export type SignalRequest = z.infer<typeof SignalRequestSchema>;
export type SignalResponse = z.infer<typeof SignalResponseSchema>;
export type BatchSignalsResponse = z.infer<typeof BatchSignalsResponseSchema>;

export interface RailwayClientOptions {
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
}

// ============================================================================
// HMAC SIGNATURE GENERATION
// ============================================================================

/**
 * Generate HMAC-SHA256 signature for Railway API authentication
 *
 * @param body - Request body (JSON object)
 * @param timestamp - Unix timestamp in milliseconds
 * @param secret - HMAC secret key
 * @returns Hex-encoded HMAC signature
 */
function generateHMACSignature(
  body: Record<string, any>,
  timestamp: number,
  secret: string
): string {
  const payload = JSON.stringify(body) + timestamp.toString();

  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);

  return hmac.digest('hex');
}

// ============================================================================
// RAILWAY CLIENT CLASS
// ============================================================================

export class RailwayAIClient {
  private apiUrl: string;
  private apiSecret: string;
  private timeout: number;
  private maxRetries: number;
  private retryDelay: number;

  constructor(options: RailwayClientOptions = {}) {
    this.apiUrl = RAILWAY_API_URL;
    this.apiSecret = RAILWAY_API_SECRET!;
    this.timeout = options.timeout || 10000; // 10 seconds
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 1000; // 1 second
  }

  /**
   * Generate trading signal for a symbol
   *
   * @param request - Signal request (symbol, timeframe)
   * @returns Trading signal with AI predictions
   * @throws Error if validation fails or API error occurs
   */
  async generateSignal(request: SignalRequest): Promise<SignalResponse> {
    // Validate input
    const validatedRequest = SignalRequestSchema.parse(request);

    // Generate HMAC signature
    const timestamp = Date.now();
    const signature = generateHMACSignature(validatedRequest, timestamp, this.apiSecret);

    // Make API call with retry logic
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await axios.post(
          `${this.apiUrl}/v1/signal`,
          validatedRequest,
          {
            headers: {
              'Content-Type': 'application/json',
              'X-Signature': signature,
              'X-Timestamp': timestamp.toString()
            },
            timeout: this.timeout,
            validateStatus: (status) => status < 500 // Don't throw on 4xx
          }
        );

        // Validate response
        const validatedResponse = SignalResponseSchema.parse(response.data);

        // Check for API-level errors
        if (!validatedResponse.success) {
          throw new Error(
            validatedResponse.error || 'Unknown API error',
            { cause: { code: validatedResponse.code } }
          );
        }

        // Success - log and return
        console.info('Railway AI signal generated:', {
          symbol: validatedRequest.symbol,
          action: validatedResponse.signal?.action,
          confidence: validatedResponse.signal?.confidence,
          attempt
        });

        return validatedResponse;

      } catch (error) {
        lastError = error as Error;

        // Don't retry on validation errors or 4xx errors
        if (error instanceof z.ZodError) {
          throw new Error('Invalid response from Railway API', { cause: error });
        }

        if (axios.isAxiosError(error) && error.response?.status && error.response.status < 500) {
          throw new Error(
            `Railway API error: ${error.response.status} - ${error.response.statusText}`,
            { cause: error }
          );
        }

        // Retry on network errors or 5xx errors
        if (attempt < this.maxRetries) {
          const delay = this.retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
          console.warn(`Railway API call failed (attempt ${attempt}/${this.maxRetries}), retrying in ${delay}ms...`, {
            error: lastError.message,
            symbol: validatedRequest.symbol
          });
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // All retries exhausted
    throw new Error(
      `Railway API call failed after ${this.maxRetries} attempts`,
      { cause: lastError }
    );
  }

  /**
   * Generate trading signals for multiple symbols (batch)
   *
   * @param symbols - Array of trading pairs
   * @param timeframe - Timeframe for analysis
   * @returns Batch signals response
   */
  async generateBatchSignals(
    symbols: string[],
    timeframe: string = '1h'
  ): Promise<BatchSignalsResponse> {
    // Validate symbols
    if (!Array.isArray(symbols) || symbols.length === 0) {
      throw new Error('Symbols must be a non-empty array');
    }

    if (symbols.length > 50) {
      throw new Error('Maximum 50 symbols per batch request');
    }

    const requestBody = { symbols, timeframe };

    // Generate HMAC signature
    const timestamp = Date.now();
    const signature = generateHMACSignature(requestBody, timestamp, this.apiSecret);

    // Make API call
    try {
      const response = await axios.post(
        `${this.apiUrl}/v1/batch`,
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Signature': signature,
            'X-Timestamp': timestamp.toString()
          },
          timeout: this.timeout * 5, // 50 seconds for batch (longer timeout)
          validateStatus: (status) => status < 500
        }
      );

      // Validate response
      const validatedResponse = BatchSignalsResponseSchema.parse(response.data);

      if (!validatedResponse.success) {
        throw new Error('Batch signal generation failed');
      }

      console.info('Railway AI batch signals generated:', {
        count: validatedResponse.count,
        symbols: symbols.join(', ')
      });

      return validatedResponse;

    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error('Invalid batch response from Railway API', { cause: error });
      }

      if (axios.isAxiosError(error)) {
        throw new Error(
          `Railway API batch error: ${error.response?.status} - ${error.message}`,
          { cause: error }
        );
      }

      throw error;
    }
  }

  /**
   * Health check for Railway AI service
   *
   * @returns Health status
   */
  async healthCheck(): Promise<{ status: string; service: string; version: string }> {
    try {
      const response = await axios.get(`${this.apiUrl}/health`, {
        timeout: 5000
      });

      return response.data;
    } catch (error) {
      throw new Error('Railway AI service health check failed', { cause: error });
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

/**
 * Singleton Railway AI Client instance
 * Use this for all Railway API calls in your application
 */
export const railwayClient = new RailwayAIClient({
  timeout: 10000,
  maxRetries: 3,
  retryDelay: 1000
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Quick helper to generate a signal (uses singleton)
 */
export async function getAISignal(symbol: string, timeframe: string = '1h'): Promise<SignalResponse> {
  return railwayClient.generateSignal({ symbol, timeframe });
}

/**
 * Quick helper to generate batch signals (uses singleton)
 */
export async function getAIBatchSignals(symbols: string[], timeframe: string = '1h'): Promise<BatchSignalsResponse> {
  return railwayClient.generateBatchSignals(symbols, timeframe);
}
