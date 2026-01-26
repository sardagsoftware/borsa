/**
 * CIVIC INSIGHTS API
 *
 * Purpose: Institution-authenticated API for civic data insights
 * Security: API key authentication, rate limiting, epsilon budget tracking
 * Privacy: All responses use DP + k-anonymity
 */

import crypto from 'crypto';
import { CivicAggregator } from './aggregator';
import {
  InstitutionApiKey,
  InsightsQueryRequest,
  DPBudgetTracker,
  PriceTrendInsight,
  ReturnRateInsight,
  LogisticsBottleneckInsight,
} from './types';

/**
 * Institution authentication and authorization
 */
export class InstitutionAuthService {
  private apiKeys: Map<string, InstitutionApiKey> = new Map();

  /**
   * Register a new institution API key
   * Production: Store in PostgreSQL
   */
  registerInstitution(institution: InstitutionApiKey): void {
    this.apiKeys.set(institution.key_id, institution);
  }

  /**
   * Validate API key and check permissions
   */
  async validateApiKey(keyId: string, metric: string): Promise<InstitutionApiKey> {
    const key = this.apiKeys.get(keyId);

    if (!key) {
      throw new Error('Invalid API key');
    }

    // Check expiration
    if (key.expires_at) {
      const expiresAt = new Date(key.expires_at);
      if (expiresAt < new Date()) {
        throw new Error('API key has expired');
      }
    }

    // Check metric permission
    if (!key.allowed_metrics.includes(metric) && !key.allowed_metrics.includes('*')) {
      throw new Error(`Institution not authorized for metric: ${metric}`);
    }

    return key;
  }

  /**
   * Create a new institution API key
   */
  static createApiKey(params: {
    institution_name: string;
    institution_type: 'government' | 'research' | 'ngo';
    allowed_metrics: string[];
    rate_limit_per_day?: number;
    epsilon_budget_per_day?: number;
    expires_in_days?: number;
  }): InstitutionApiKey {
    const key_id = crypto.randomUUID();
    const created_at = new Date().toISOString();

    let expires_at: string | undefined;
    if (params.expires_in_days) {
      const expiresDate = new Date();
      expiresDate.setDate(expiresDate.getDate() + params.expires_in_days);
      expires_at = expiresDate.toISOString();
    }

    return {
      key_id,
      institution_name: params.institution_name,
      institution_type: params.institution_type,
      allowed_metrics: params.allowed_metrics,
      rate_limit_per_day: params.rate_limit_per_day || 1000,
      epsilon_budget_per_day: params.epsilon_budget_per_day || 10.0,
      created_at,
      expires_at,
    };
  }
}

/**
 * Epsilon budget tracker
 * Ensures institutions don't exceed daily privacy budget
 */
export class EpsilonBudgetTracker {
  private budgets: Map<string, DPBudgetTracker> = new Map();

  /**
   * Get current budget for institution on given date
   */
  getBudget(institutionKeyId: string, date: string): DPBudgetTracker {
    const key = `${institutionKeyId}:${date}`;
    let budget = this.budgets.get(key);

    if (!budget) {
      budget = {
        institution_key_id: institutionKeyId,
        date,
        epsilon_consumed: 0,
        queries_count: 0,
        remaining_epsilon: 0, // Will be set from API key
      };
      this.budgets.set(key, budget);
    }

    return budget;
  }

  /**
   * Check if epsilon budget is available
   */
  async checkBudget(
    institutionKey: InstitutionApiKey,
    requestedEpsilon: number,
    date: string
  ): Promise<void> {
    const budget = this.getBudget(institutionKey.key_id || '', date);

    // Set initial remaining budget if first query
    if (budget.queries_count === 0) {
      budget.remaining_epsilon = institutionKey.epsilon_budget_per_day;
    }

    const potentialConsumed = budget.epsilon_consumed + requestedEpsilon;

    if (potentialConsumed > institutionKey.epsilon_budget_per_day) {
      throw new Error(
        `Epsilon budget exceeded. Consumed: ${budget.epsilon_consumed.toFixed(2)}, ` +
          `Requested: ${requestedEpsilon.toFixed(2)}, ` +
          `Daily limit: ${institutionKey.epsilon_budget_per_day.toFixed(2)}`
      );
    }
  }

  /**
   * Consume epsilon budget
   */
  async consumeBudget(
    institutionKeyId: string,
    epsilon: number,
    date: string
  ): Promise<DPBudgetTracker> {
    const budget = this.getBudget(institutionKeyId, date);

    budget.epsilon_consumed += epsilon;
    budget.queries_count += 1;
    budget.remaining_epsilon = Math.max(0, budget.remaining_epsilon - epsilon);

    return budget;
  }

  /**
   * Get budget status for institution
   */
  getBudgetStatus(institutionKeyId: string, date: string): DPBudgetTracker {
    return this.getBudget(institutionKeyId, date);
  }
}

/**
 * Rate limiter for institution API calls
 */
export class InstitutionRateLimiter {
  private counts: Map<string, { count: number; resetAt: Date }> = new Map();

  /**
   * Check rate limit for institution
   */
  async checkRateLimit(institutionKey: InstitutionApiKey, date: string): Promise<void> {
    const key = `${institutionKey.key_id || ''}:${date}`;
    let record = this.counts.get(key);

    const now = new Date();
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Reset if new day
    if (!record || now > record.resetAt) {
      record = { count: 0, resetAt: endOfDay };
      this.counts.set(key, record);
    }

    if (record.count >= institutionKey.rate_limit_per_day) {
      throw new Error(
        `Rate limit exceeded. Daily limit: ${institutionKey.rate_limit_per_day} queries/day`
      );
    }
  }

  /**
   * Increment rate limit counter
   */
  async incrementCount(institutionKeyId: string, date: string): Promise<void> {
    const key = `${institutionKeyId}:${date}`;
    const record = this.counts.get(key);

    if (record) {
      record.count += 1;
    }
  }
}

/**
 * Civic Insights API Service
 * Orchestrates authentication, rate limiting, budget tracking, and aggregation
 */
export class CivicInsightsAPI {
  private authService: InstitutionAuthService;
  private budgetTracker: EpsilonBudgetTracker;
  private rateLimiter: InstitutionRateLimiter;
  private aggregator: CivicAggregator;

  constructor() {
    this.authService = new InstitutionAuthService();
    this.budgetTracker = new EpsilonBudgetTracker();
    this.rateLimiter = new InstitutionRateLimiter();
    this.aggregator = new CivicAggregator();
  }

  /**
   * Register a new institution
   */
  registerInstitution(params: {
    institution_name: string;
    institution_type: 'government' | 'research' | 'ngo';
    allowed_metrics: string[];
    rate_limit_per_day?: number;
    epsilon_budget_per_day?: number;
    expires_in_days?: number;
  }): InstitutionApiKey {
    const apiKey = InstitutionAuthService.createApiKey(params);
    this.authService.registerInstitution(apiKey);
    return apiKey;
  }

  /**
   * Query civic insights with full authentication and budget tracking
   */
  async query(
    apiKeyId: string,
    request: InsightsQueryRequest
  ): Promise<{
    data: PriceTrendInsight | ReturnRateInsight | LogisticsBottleneckInsight;
    budget_status: DPBudgetTracker;
  }> {
    // 1. Validate API key and permissions
    const institutionKey = await this.authService.validateApiKey(apiKeyId, request.metric);

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // 2. Check rate limit
    await this.rateLimiter.checkRateLimit(institutionKey, today);

    // 3. Check epsilon budget
    await this.budgetTracker.checkBudget(institutionKey, request.dp_epsilon || 1.0, today);

    // 4. Increment rate limit
    await this.rateLimiter.incrementCount(institutionKey.key_id || '', today);

    // 5. Execute query based on metric type
    let data: PriceTrendInsight | ReturnRateInsight | LogisticsBottleneckInsight;

    switch (request.metric) {
      case 'price_trend':
        data = await this.aggregator.aggregatePriceTrend(request);
        break;

      case 'return_rate':
        data = await this.aggregator.aggregateReturnRate(request);
        break;

      case 'logistics_bottleneck':
        data = await this.aggregator.aggregateLogisticsBottlenecks(request);
        break;

      case 'sales_volume':
        // TODO: Implement sales volume aggregation
        throw new Error('Sales volume metric not yet implemented');

      default:
        throw new Error(`Unknown metric: ${request.metric}`);
    }

    // 6. Consume epsilon budget
    const budget_status = await this.budgetTracker.consumeBudget(
      institutionKey.key_id || '',
      request.dp_epsilon || 1.0,
      today
    );

    return {
      data,
      budget_status,
    };
  }

  /**
   * Get budget status for institution
   */
  getBudgetStatus(apiKeyId: string): DPBudgetTracker {
    const today = new Date().toISOString().split('T')[0];
    return this.budgetTracker.getBudgetStatus(apiKeyId || '', today);
  }
}

/**
 * Example: Initialize demo institutions
 */
export function initializeDemoInstitutions(api: CivicInsightsAPI): void {
  // Turkish Ministry of Trade
  api.registerInstitution({
    institution_name: 'T.C. Ticaret Bakanlığı',
    institution_type: 'government',
    allowed_metrics: ['price_trend', 'return_rate', 'logistics_bottleneck', 'sales_volume'],
    rate_limit_per_day: 5000,
    epsilon_budget_per_day: 50.0,
    expires_in_days: 365,
  });

  // University research group
  api.registerInstitution({
    institution_name: 'Boğaziçi Üniversitesi - Ekonomi Araştırma Merkezi',
    institution_type: 'research',
    allowed_metrics: ['price_trend', 'sales_volume'],
    rate_limit_per_day: 1000,
    epsilon_budget_per_day: 20.0,
    expires_in_days: 180,
  });

  // Consumer protection NGO
  api.registerInstitution({
    institution_name: 'Tüketici Koruma Derneği',
    institution_type: 'ngo',
    allowed_metrics: ['price_trend', 'return_rate'],
    rate_limit_per_day: 500,
    epsilon_budget_per_day: 10.0,
    expires_in_days: 90,
  });
}
