/**
 * ECONOMY OPTIMIZATION API
 *
 * POST /api/economy/optimize
 *
 * Purpose: Optimize pricing, promotions, and logistics for economic goals
 * Security: Rate-limited, requires approval for apply
 * Compliance: KVKK/GDPR - aggregated data only
 */

import { EconomyOptimizer, DEFAULT_GUARDRAILS, EconomyOptimizeRequest } from '../../packages/economy-optimizer/src';
import { appendEvent } from '../../lib/security/attestation';
import crypto from 'crypto';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse and validate request
    const request = EconomyOptimizeRequest.parse(req.body);

    // Create optimizer with guardrails
    const optimizer = new EconomyOptimizer(DEFAULT_GUARDRAILS);

    // Run optimization
    const result = await optimizer.optimize(request);

    // Log to attestation system
    const action = `economy.optimize:${result.optimization_id}`;
    const action_hash = crypto.createHash('sha256').update(action).digest('hex');

    appendEvent({
      action_hash,
      timestamp: new Date().toISOString(),
      actor: req.headers['x-user-id'] || 'anonymous',
      metadata: {
        optimization_id: result.optimization_id,
        goal: result.goal,
        recommendations_count: result.recommendations.length,
        guardrails_passed: result.guardrails_passed,
      },
    });

    // Return result
    return res.status(200).json(result);

  } catch (error: any) {
    console.error('Economy optimization error:', error);

    // Zod validation error
    if (error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors,
      });
    }

    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}
