/**
 * TRUST LAYER API - EXPLAIN DECISION
 *
 * POST /api/trust/explain
 *
 * Purpose: Generate explanation for an AI decision
 * Compliance: EU AI Act explainability requirements
 */

import { ExplainabilityEngine } from '../../packages/trust-layer/src/explainer';

/**
 * Singleton instance
 */
let explainer: ExplainabilityEngine | null = null;

function getExplainer(): ExplainabilityEngine {
  if (!explainer) {
    explainer = new ExplainabilityEngine({
      top_k_features: 5,
      min_importance_threshold: 0.01,
      language: 'tr',
    });
  }
  return explainer;
}

export default async function handler(req: any, res: any) {
  // Apply secure CORS
  if (handleCORS(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      decisionType,
      modelName,
      modelVersion,
      prediction,
      confidence,
      features,
      shapValues,
      language,
    } = req.body;

    // Validate required fields
    if (!decisionType || !modelName || !modelVersion || prediction === undefined || !features) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'decisionType, modelName, modelVersion, prediction, and features are required',
      });
    }

    // Get explainer with language preference
    const engine = language
      ? new ExplainabilityEngine({ language })
      : getExplainer();

    // Generate explanation
    const explanation = engine.explain({
      decisionType,
      modelName,
      modelVersion,
      prediction,
      confidence: confidence || 0.5,
      features,
      shapValues,
    });

    return res.status(200).json({
      success: true,
      explanation,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Explanation error:', error);

    if (error.message.includes('validation')) {
      return res.status(400).json({
        error: 'Validation error',
        message: error.message,
      });
    }

    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to generate explanation',
    });
  }
}
