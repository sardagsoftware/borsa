/**
 * İnsan IQ API - Personas Endpoint
 * Persona management (personality profiles for AI assistants)
 *
 * White-Hat Policy: Real database operations, no mock
 */

import { nanoid } from 'nanoid';
import { createClient } from '@supabase/supabase-js';

// Import CORS handler
const { handleCORS } = require('../../../security/cors-config');

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

/**
 * POST /api/v1/insan-iq/personas
 * Create a new persona
 */
export async function createPersona(req, res) {
  try {
    const { name, personality, expertise, language, description, metadata } = req.body;

    // Validation
    if (!name || !personality || !language) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing required fields',
          details: [
            { path: 'name', issue: name ? null : 'Required field' },
            { path: 'personality', issue: personality ? null : 'Required field' },
            { path: 'language', issue: language ? null : 'Required field' },
          ].filter(d => d.issue),
          correlationId: nanoid(),
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Validate language code
    const validLanguages = ['tr', 'en', 'de', 'fr', 'es', 'it', 'ar', 'zh', 'ja', 'ru'];
    if (!validLanguages.includes(language)) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid language code',
          details: [{ path: 'language', issue: `Must be one of: ${validLanguages.join(', ')}` }],
          correlationId: nanoid(),
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Check for idempotency key
    const idempotencyKey = req.headers['idempotency-key'];
    if (idempotencyKey) {
      const { data: existing } = await supabase
        .from('personas')
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

    // Generate persona ID
    const personaId = `persona_${nanoid(24)}`;
    const now = new Date().toISOString();

    // Insert into database
    const { data: persona, error: dbError } = await supabase
      .from('personas')
      .insert({
        persona_id: personaId,
        name,
        personality,
        expertise: JSON.stringify(expertise || []),
        language,
        description: description || '',
        metadata: JSON.stringify(metadata || {}),
        idempotency_key: idempotencyKey || null,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create persona',
          correlationId: nanoid(),
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Return created persona
    return res.status(201).json({
      personaId: persona.persona_id,
      name: persona.name,
      personality: persona.personality,
      expertise: JSON.parse(persona.expertise),
      language: persona.language,
      description: persona.description,
      metadata: JSON.parse(persona.metadata),
      createdAt: persona.created_at,
      updatedAt: persona.updated_at,
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
 * GET /api/v1/insan-iq/personas
 * List personas with pagination
 */
export async function listPersonas(req, res) {
  try {
    const { cursor, limit = 50, language } = req.query;
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);

    let query = supabase
      .from('personas')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limitNum + 1);

    // Filter by language if provided
    if (language) {
      query = query.eq('language', language);
    }

    // Apply cursor if provided
    if (cursor) {
      try {
        const decodedCursor = JSON.parse(Buffer.from(cursor, 'base64').toString('utf8'));
        query = query.lt('created_at', decodedCursor.created_at);
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

    const { data: personas, error: dbError } = await query;

    if (dbError) {
      console.error('Database error:', dbError);
      return res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch personas',
          correlationId: nanoid(),
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Determine if there are more results
    const hasMore = personas.length > limitNum;
    const results = hasMore ? personas.slice(0, limitNum) : personas;

    // Generate next cursor
    let nextCursor = null;
    if (hasMore) {
      const lastItem = results[results.length - 1];
      nextCursor = Buffer.from(
        JSON.stringify({ created_at: lastItem.created_at })
      ).toString('base64');
    }

    // Set Link header
    if (nextCursor) {
      const baseUrl = `${req.protocol}://${req.get('host')}${req.baseUrl}${req.path}`;
      const queryParams = new URLSearchParams({ cursor: nextCursor, limit: limitNum.toString() });
      if (language) queryParams.append('language', language);
      res.setHeader('Link', `<${baseUrl}?${queryParams.toString()}>; rel="next"`);
    }

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', '1000');
    res.setHeader('X-RateLimit-Remaining', '999');
    res.setHeader('X-RateLimit-Reset', Math.floor(Date.now() / 1000) + 3600);

    return res.status(200).json({
      personas: results.map(p => ({
        personaId: p.persona_id,
        name: p.name,
        personality: p.personality,
        expertise: JSON.parse(p.expertise),
        language: p.language,
        description: p.description,
        metadata: JSON.parse(p.metadata),
        createdAt: p.created_at,
        updatedAt: p.updated_at,
      })),
      pagination: {
        limit: limitNum,
        hasMore,
        nextCursor,
      },
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
 * GET /api/v1/insan-iq/personas/:personaId
 * Get persona by ID
 */
export async function getPersona(req, res) {
  try {
    const { personaId } = req.params;

    if (!personaId || !personaId.startsWith('persona_')) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid persona ID format',
          correlationId: nanoid(),
          timestamp: new Date().toISOString(),
        },
      });
    }

    const { data: persona, error: dbError } = await supabase
      .from('personas')
      .select('*')
      .eq('persona_id', personaId)
      .single();

    if (dbError || !persona) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Persona not found',
          correlationId: nanoid(),
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', '1000');
    res.setHeader('X-RateLimit-Remaining', '999');
    res.setHeader('X-RateLimit-Reset', Math.floor(Date.now() / 1000) + 3600);

    return res.status(200).json({
      personaId: persona.persona_id,
      name: persona.name,
      personality: persona.personality,
      expertise: JSON.parse(persona.expertise),
      language: persona.language,
      description: persona.description,
      metadata: JSON.parse(persona.metadata),
      createdAt: persona.created_at,
      updatedAt: persona.updated_at,
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
  // Apply secure CORS
  if (handleCORS(req, res)) return;

  // Authentication check
  const apiKey = req.headers['x-api-key'];
  const authHeader = req.headers['authorization'];

  if (!apiKey && !authHeader) {
    return res.status(401).json({
      error: {
        code: 'MISSING_API_KEY',
        message: 'API key is required',
        correlationId: nanoid(),
        timestamp: new Date().toISOString(),
      },
    });
  }

  // Validate API key format (basic check)
  if (apiKey && !apiKey.startsWith('lyd_')) {
    return res.status(401).json({
      error: {
        code: 'INVALID_API_KEY',
        message: 'Invalid API key format',
        correlationId: nanoid(),
        timestamp: new Date().toISOString(),
      },
    });
  }

  // Route to appropriate handler
  if (req.method === 'POST' && !req.query.personaId) {
    return createPersona(req, res);
  } else if (req.method === 'GET' && req.query.personaId) {
    req.params = { personaId: req.query.personaId };
    return getPersona(req, res);
  } else if (req.method === 'GET') {
    return listPersonas(req, res);
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
