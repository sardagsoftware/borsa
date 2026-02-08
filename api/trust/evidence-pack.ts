/**
 * TRUST LAYER API - EVIDENCE PACK
 *
 * POST /api/trust/evidence-pack
 *
 * Purpose: Generate verifiable audit trail for compliance
 * Format: JSON or ZIP with Merkle proofs and attestation logs
 */

import { EvidencePackGenerator } from '../../packages/trust-layer/src/evidence-pack';
import { handleCORS } from '../../middleware/cors-handler';

/**
 * Singleton instance
 */
let generator: EvidencePackGenerator | null = null;

function getGenerator(): EvidencePackGenerator {
  if (!generator) {
    generator = new EvidencePackGenerator();
  }
  return generator;
}

export default async function handler(req: any, res: any) {
  // Apply secure CORS
  if (handleCORS(req, res)) return;

  if (req.method === 'POST') {
    return handleGeneratePack(req, res);
  }

  if (req.method === 'GET') {
    return handleVerifyPack(req, res);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

/**
 * Handle POST - Generate evidence pack
 */
async function handleGeneratePack(req: any, res: any) {
  try {
    const { decision_id, explanation, signed_operation, attestation_logs, format } = req.body;

    // Validate required fields
    if (!decision_id) {
      return res.status(400).json({
        error: 'Missing required field',
        message: 'decision_id is required',
      });
    }

    const gen = getGenerator();

    // Generate evidence pack
    const pack = await gen.generatePack({
      decision_id,
      explanation,
      signed_operation,
      attestation_logs,
      format: format || 'json',
    });

    // Generate human-readable summary
    const summary = gen.generateSummary(pack);

    return res.status(200).json({
      success: true,
      evidence_pack: pack,
      summary,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Evidence pack generation error:', error);

    if (error.message?.includes('validation')) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Dogrulama hatasi. Lutfen girisleri kontrol edin.',
      });
    }

    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to generate evidence pack',
    });
  }
}

/**
 * Handle GET - Verify evidence pack integrity
 */
async function handleVerifyPack(req: any, res: any) {
  try {
    // Parse evidence pack from query (for simple verification)
    // Production: retrieve from database
    const { pack_id } = req.query;

    if (!pack_id) {
      return res.status(400).json({
        error: 'Missing pack_id',
        message: 'pack_id query parameter is required',
      });
    }

    // Mock: In production, retrieve pack from database
    return res.status(200).json({
      success: true,
      message: 'Pack verification requires full pack data. Use POST with pack object.',
    });
  } catch (error: any) {
    console.error('Evidence pack verification error:', error);

    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to verify evidence pack',
    });
  }
}
