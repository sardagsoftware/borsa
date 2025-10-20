/**
 * CIVIC INSIGHTS API - LOGISTICS BOTTLENECKS
 *
 * GET /api/insights/logistics-bottlenecks
 *
 * Purpose: Anonymous logistics bottleneck detection for public sector
 * Privacy: Differential Privacy + k-anonymity
 * Auth: Institution API key required
 */

import { CivicInsightsAPI } from '../../packages/civic-grid/src/insights-api';
import { InsightsQueryRequest } from '../../packages/civic-grid/src/types';
import { handleCORS } from '../../middleware/cors-handler';

/**
 * Singleton instance
 */
let civicAPI: CivicInsightsAPI | null = null;

function getCivicAPI(): CivicInsightsAPI {
  if (!civicAPI) {
    civicAPI = new CivicInsightsAPI();
  }
  return civicAPI;
}

export default async function handler(req: any, res: any) {
  // Apply secure CORS
  if (handleCORS(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 1. Extract API key from header
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'X-API-Key header is required',
      });
    }

    // 2. Parse query parameters
    const {
      region,
      period_start,
      period_end,
      dp_epsilon = '1.0',
    } = req.query;

    // Validate required parameters
    if (!region) {
      return res.status(400).json({
        error: 'Missing required parameter',
        message: 'region is required for logistics bottleneck analysis',
      });
    }

    if (!period_start || !period_end) {
      return res.status(400).json({
        error: 'Missing required parameters',
        message: 'period_start and period_end are required',
      });
    }

    // 3. Build insights query request
    const queryRequest: InsightsQueryRequest = {
      metric: 'logistics_bottleneck',
      region,
      period_start,
      period_end,
      granularity: 'weekly', // Not used for logistics, but required by schema
      dp_epsilon: parseFloat(dp_epsilon),
    };

    // 4. Execute query through civic API
    const api = getCivicAPI();
    const result = await api.query(apiKey, queryRequest);

    // 5. Return response with budget status
    return res.status(200).json({
      success: true,
      data: result.data,
      budget_status: {
        epsilon_consumed: result.budget_status.epsilon_consumed.toFixed(2),
        queries_count: result.budget_status.queries_count,
        remaining_epsilon: result.budget_status.remaining_epsilon.toFixed(2),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Civic insights error (logistics_bottleneck):', error);

    // Handle specific error types
    if (error.message.includes('Invalid API key')) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: error.message,
      });
    }

    if (error.message.includes('not authorized')) {
      return res.status(403).json({
        error: 'Authorization failed',
        message: error.message,
      });
    }

    if (error.message.includes('Rate limit exceeded')) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: error.message,
      });
    }

    if (error.message.includes('Epsilon budget exceeded')) {
      return res.status(429).json({
        error: 'Privacy budget exceeded',
        message: error.message,
      });
    }

    if (error.message.includes('validation')) {
      return res.status(400).json({
        error: 'Validation error',
        message: error.message,
      });
    }

    // Generic error
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process civic insights query',
    });
  }
}
