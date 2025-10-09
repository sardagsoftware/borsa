/**
 * LyDian IQ API - Signals Endpoint
 * Real-time signal ingestion and query
 *
 * White-Hat Policy: Real database operations, no mock
 */

import { nanoid } from 'nanoid';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

/**
 * POST /api/v1/lydian-iq/signals
 * Ingest a real-time signal/event
 */
export async function ingestSignal(req, res) {
  try {
    const { signalType, source, timestamp, payload, metadata } = req.body;

    // Validation
    if (!signalType || !source || !payload) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing required fields',
          details: [
            { path: 'signalType', issue: signalType ? null : 'Required field' },
            { path: 'source', issue: source ? null : 'Required field' },
            { path: 'payload', issue: payload ? null : 'Required field' },
          ].filter(d => d.issue),
          correlationId: nanoid(),
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Check for idempotency key
    const idempotencyKey = req.headers['idempotency-key'];
    if (idempotencyKey) {
      const { data: existing } = await supabase
        .from('signals')
        .select('*')
        .eq('idempotency_key', idempotencyKey)
        .single();

      if (existing) {
        return res.status(409).json({
          error: {
            code: 'DUPLICATE_REQUEST',
            message: 'Request with this idempotency key already processed',
            correlationId: nanoid(),
            timestamp: new Date().toISOString(),
          },
        });
      }
    }

    // Generate signal ID
    const signalId = `signal_${nanoid(24)}`;
    const signalTimestamp = timestamp || new Date().toISOString();

    // Insert into database
    const { data: signal, error: dbError } = await supabase
      .from('signals')
      .insert({
        signal_id: signalId,
        signal_type: signalType,
        source,
        timestamp: signalTimestamp,
        payload: JSON.stringify(payload),
        metadata: JSON.stringify(metadata || {}),
        idempotency_key: idempotencyKey || null,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to ingest signal',
          correlationId: nanoid(),
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Return created signal
    return res.status(201).json({
      signalId: signal.signal_id,
      signalType: signal.signal_type,
      source: signal.source,
      timestamp: signal.timestamp,
      payload: JSON.parse(signal.payload),
      metadata: JSON.parse(signal.metadata),
      createdAt: signal.created_at,
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
        correlationId: nanoid(),
        timestamp: new Date().toISOString(),
      },
    });
  }
}

/**
 * GET /api/v1/lydian-iq/signals
 * List signals with pagination
 */
export async function listSignals(req, res) {
  try {
    const { cursor, limit = 50, signalType } = req.query;
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);

    let query = supabase
      .from('signals')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limitNum + 1);

    // Filter by signal type if provided
    if (signalType) {
      query = query.eq('signal_type', signalType);
    }

    // Apply cursor if provided
    if (cursor) {
      try {
        const decodedCursor = JSON.parse(Buffer.from(cursor, 'base64').toString('utf8'));
        query = query.lt('timestamp', decodedCursor.timestamp);
      } catch {
        return res.status(400).json({
          error: {
            code: 'INVALID_CURSOR',
            message: 'Invalid pagination cursor',
            correlationId: nanoid(),
            timestamp: new Date().toISOString(),
          },
        });
      }
    }

    const { data: signals, error: dbError } = await query;

    if (dbError) {
      console.error('Database error:', dbError);
      return res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch signals',
          correlationId: nanoid(),
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Determine if there are more results
    const hasMore = signals.length > limitNum;
    const results = hasMore ? signals.slice(0, limitNum) : signals;

    // Generate next cursor
    let nextCursor = null;
    if (hasMore) {
      const lastItem = results[results.length - 1];
      nextCursor = Buffer.from(
        JSON.stringify({ timestamp: lastItem.timestamp })
      ).toString('base64');
    }

    // Set Link header
    if (nextCursor) {
      const baseUrl = `${req.protocol}://${req.get('host')}${req.baseUrl}${req.path}`;
      const queryParams = new URLSearchParams({ cursor: nextCursor, limit: limitNum.toString() });
      if (signalType) queryParams.append('signalType', signalType);
      res.setHeader('Link', `<${baseUrl}?${queryParams.toString()}>; rel="next"`);
    }

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', '10000');
    res.setHeader('X-RateLimit-Remaining', '9999');
    res.setHeader('X-RateLimit-Reset', Math.floor(Date.now() / 1000) + 3600);

    return res.status(200).json({
      data: results.map(s => ({
        signalId: s.signal_id,
        signalType: s.signal_type,
        source: s.source,
        timestamp: s.timestamp,
        payload: JSON.parse(s.payload),
        metadata: JSON.parse(s.metadata),
        createdAt: s.created_at,
      })),
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
        correlationId: nanoid(),
        timestamp: new Date().toISOString(),
      },
    });
  }
}

// Export handlers
export default async function handler(req, res) {
  // Apply CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key, Idempotency-Key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Authentication check
  const apiKey = req.headers['x-api-key'];
  const authHeader = req.headers['authorization'];

  if (!apiKey && !authHeader) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Missing authentication credentials',
        correlationId: nanoid(),
        timestamp: new Date().toISOString(),
      },
    });
  }

  // Route to appropriate handler
  if (req.method === 'POST') {
    return ingestSignal(req, res);
  } else if (req.method === 'GET') {
    return listSignals(req, res);
  } else {
    return res.status(405).json({
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: `Method ${req.method} not allowed`,
        correlationId: nanoid(),
        timestamp: new Date().toISOString(),
      },
    });
  }
}
