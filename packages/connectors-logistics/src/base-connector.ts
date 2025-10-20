/**
 * LYDIAN-IQ LOGISTICS BASE CONNECTOR
 *
 * Purpose: Abstract base class for all logistics connectors
 * Pattern: Template method pattern with rate limiting and error handling
 */

import { z } from 'zod';
import {
  CreateShipmentRequest,
  ShipmentResponse,
  GetTrackingRequest,
  TrackingResponse,
  CancelShipmentRequest,
  CancelShipmentResponse,
  LogisticsConnector,
} from './schema';

/**
 * Rate limiter token bucket
 */
class TokenBucket {
  private tokens: number;
  private lastRefill: number;

  constructor(
    private readonly capacity: number,
    private readonly refillRate: number // tokens per second
  ) {
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }

  async consume(tokens: number = 1): Promise<void> {
    // Refill tokens based on elapsed time
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000; // seconds
    this.tokens = Math.min(this.capacity, this.tokens + elapsed * this.refillRate);
    this.lastRefill = now;

    // Check if enough tokens available
    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return;
    }

    // Wait with full-jitter backoff
    const waitTime = ((tokens - this.tokens) / this.refillRate) * 1000;
    const jitter = Math.random() * waitTime * 0.5; // 0-50% jitter
    await new Promise((resolve) => setTimeout(resolve, waitTime + jitter));

    this.tokens = 0; // Consumed after wait
  }
}

/**
 * Base logistics connector with common functionality
 */
export abstract class BaseLogisticsConnector implements LogisticsConnector {
  protected readonly rateLimiter: TokenBucket;
  protected readonly vendor: string;

  constructor(
    vendor: string,
    rateLimit: { requests_per_second: number; burst_size: number }
  ) {
    this.vendor = vendor;
    this.rateLimiter = new TokenBucket(
      rateLimit.burst_size,
      rateLimit.requests_per_second
    );
  }

  /**
   * Create shipment with rate limiting and error handling
   */
  async createShipment(request: CreateShipmentRequest): Promise<ShipmentResponse> {
    await this.rateLimiter.consume();

    try {
      // Validate request
      CreateShipmentRequest.parse(request);

      // Call vendor-specific implementation
      return await this.doCreateShipment(request);
    } catch (error) {
      throw this.standardizeError(error, 'createShipment');
    }
  }

  /**
   * Get tracking information with rate limiting
   */
  async getTracking(request: GetTrackingRequest): Promise<TrackingResponse> {
    await this.rateLimiter.consume();

    try {
      // Validate request
      GetTrackingRequest.parse(request);

      // Call vendor-specific implementation
      return await this.doGetTracking(request);
    } catch (error) {
      throw this.standardizeError(error, 'getTracking');
    }
  }

  /**
   * Cancel shipment with rate limiting
   */
  async cancelShipment(request: CancelShipmentRequest): Promise<CancelShipmentResponse> {
    await this.rateLimiter.consume();

    try {
      // Validate request
      CancelShipmentRequest.parse(request);

      // Call vendor-specific implementation
      return await this.doCancelShipment(request);
    } catch (error) {
      throw this.standardizeError(error, 'cancelShipment');
    }
  }

  /**
   * Get label with rate limiting
   */
  async getLabel(tracking_no: string): Promise<{ url: string; format: 'PDF' | 'ZPL' | 'GIF' }> {
    await this.rateLimiter.consume();

    try {
      // Call vendor-specific implementation
      return await this.doGetLabel(tracking_no);
    } catch (error) {
      throw this.standardizeError(error, 'getLabel');
    }
  }

  /**
   * Vendor-specific implementations (abstract methods)
   */
  protected abstract doCreateShipment(request: CreateShipmentRequest): Promise<ShipmentResponse>;
  protected abstract doGetTracking(request: GetTrackingRequest): Promise<TrackingResponse>;
  protected abstract doCancelShipment(
    request: CancelShipmentRequest
  ): Promise<CancelShipmentResponse>;
  protected abstract doGetLabel(
    tracking_no: string
  ): Promise<{ url: string; format: 'PDF' | 'ZPL' | 'GIF' }>;

  /**
   * Standardize errors across vendors
   */
  protected standardizeError(error: any, operation: string): Error {
    // Zod validation error
    if (error instanceof z.ZodError) {
      const err = new Error(`Validation error: ${error.errors.map((e) => e.message).join(', ')}`);
      (err as any).code = 'VALIDATION_ERROR';
      (err as any).vendor = this.vendor;
      (err as any).operation = operation;
      return err;
    }

    // HTTP error
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;

      let code = 'CARRIER_ERROR';
      if (status === 429) code = 'RATE_LIMIT_EXCEEDED';
      if (status === 401 || status === 403) code = 'AUTH_ERROR';
      if (status === 404) code = 'NOT_FOUND';

      const err = new Error(
        data?.message || data?.error || `Carrier API error: ${status}`
      );
      (err as any).code = code;
      (err as any).vendor = this.vendor;
      (err as any).operation = operation;
      (err as any).carrier_error_code = data?.code;
      (err as any).status = status;
      return err;
    }

    // Network error
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      const err = new Error(`Network error: ${error.message}`);
      (err as any).code = 'NETWORK_ERROR';
      (err as any).vendor = this.vendor;
      (err as any).operation = operation;
      return err;
    }

    // Generic error
    const err = new Error(error.message || 'Unknown error');
    (err as any).code = 'UNKNOWN_ERROR';
    (err as any).vendor = this.vendor;
    (err as any).operation = operation;
    return err;
  }
}
