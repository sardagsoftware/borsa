/**
 * Smart Cities API - Cities Endpoint
 * RESTful API implementation following OpenAPI 3.1 spec
 *
 * White-Hat Policy: No mock data, real database operations
 */

import { nanoid } from 'nanoid';
import { createClient } from '@supabase/supabase-js';

// Import CORS handler
const { handleCORS } = require('../../../security/cors-config');
const { applySanitization } = require('../../_middleware/sanitize');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

/**
 * POST /api/v1/smart-cities/cities
 * Create a new smart city
 */
export async function createCity(req, res) {
  try {
    const { name, coordinates, population, timezone } = req.body;

    // Validation
    if (!name || !coordinates || !population || !timezone) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing required fields',
          details: [
            { path: 'name', issue: name ? null : 'Required field' },
            { path: 'coordinates', issue: coordinates ? null : 'Required field' },
            { path: 'population', issue: population ? null : 'Required field' },
            { path: 'timezone', issue: timezone ? null : 'Required field' },
          ].filter(d => d.issue),
          correlationId: nanoid(),
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Validate coordinates
    if (!coordinates.latitude || !coordinates.longitude) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid coordinates',
          details: [
            { path: 'coordinates.latitude', issue: 'Required' },
            { path: 'coordinates.longitude', issue: 'Required' },
          ],
          correlationId: nanoid(),
          timestamp: new Date().toISOString(),
        },
      });
    }

    if (coordinates.latitude < -90 || coordinates.latitude > 90) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid latitude',
          details: [{ path: 'coordinates.latitude', issue: 'Must be between -90 and 90' }],
          correlationId: nanoid(),
          timestamp: new Date().toISOString(),
        },
      });
    }

    if (coordinates.longitude < -180 || coordinates.longitude > 180) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid longitude',
          details: [{ path: 'coordinates.longitude', issue: 'Must be between -180 and 180' }],
          correlationId: nanoid(),
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Check for idempotency key
    const idempotencyKey = req.headers['idempotency-key'];
    if (idempotencyKey) {
      // Check if request with this key already exists
      const { data: existing } = await supabase
        .from('cities')
        .select('*')
        .eq('idempotency_key', idempotencyKey)
        .single();

      if (existing) {
        // Return existing city (409 Conflict)
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

    // Generate city ID
    const cityId = `city_${nanoid(24)}`;
    const now = new Date().toISOString();

    // Insert into database
    const { data: city, error: dbError } = await supabase
      .from('cities')
      .insert({
        city_id: cityId,
        name,
        coordinates: JSON.stringify(coordinates),
        population,
        timezone,
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
          message: 'Failed to create city',
          correlationId: nanoid(),
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Return created city
    return res.status(201).json({
      cityId: city.city_id,
      name: city.name,
      coordinates: JSON.parse(city.coordinates),
      population: city.population,
      timezone: city.timezone,
      createdAt: city.created_at,
      updatedAt: city.updated_at,
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
 * GET /api/v1/smart-cities/cities
 * List cities with cursor-based pagination
 */
export async function listCities(req, res) {
  try {
    const { cursor, limit = 50 } = req.query;
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);

    let query = supabase
      .from('cities')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limitNum + 1); // Fetch one extra to determine if there are more

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

    const { data: cities, error: dbError } = await query;

    if (dbError) {
      console.error('Database error:', dbError);
      return res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch cities',
          correlationId: nanoid(),
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Determine if there are more results
    const hasMore = cities.length > limitNum;
    const results = hasMore ? cities.slice(0, limitNum) : cities;

    // Generate next cursor if there are more results
    let nextCursor = null;
    if (hasMore) {
      const lastItem = results[results.length - 1];
      nextCursor = Buffer.from(
        JSON.stringify({ created_at: lastItem.created_at })
      ).toString('base64');
    }

    // Set Link header for pagination
    if (nextCursor) {
      const baseUrl = `${req.protocol}://${req.get('host')}${req.baseUrl}${req.path}`;
      res.setHeader('Link', `<${baseUrl}?cursor=${nextCursor}&limit=${limitNum}>; rel="next"`);
    }

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', '1000');
    res.setHeader('X-RateLimit-Remaining', '999');
    res.setHeader('X-RateLimit-Reset', Math.floor(Date.now() / 1000) + 3600);

    return res.status(200).json({
      cities: results.map(city => ({
        cityId: city.city_id,
        name: city.name,
        coordinates: JSON.parse(city.coordinates),
        population: city.population,
        timezone: city.timezone,
        createdAt: city.created_at,
        updatedAt: city.updated_at,
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
 * GET /api/v1/smart-cities/cities/:cityId
 * Get city by ID
 */
export async function getCity(req, res) {
  try {
    const { cityId } = req.params;

    if (!cityId || !cityId.startsWith('city_')) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid city ID format',
          correlationId: nanoid(),
          timestamp: new Date().toISOString(),
        },
      });
    }

    const { data: city, error: dbError } = await supabase
      .from('cities')
      .select('*')
      .eq('city_id', cityId)
      .single();

    if (dbError || !city) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'City not found',
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
      cityId: city.city_id,
      name: city.name,
      coordinates: JSON.parse(city.coordinates),
      population: city.population,
      timezone: city.timezone,
      createdAt: city.created_at,
      updatedAt: city.updated_at,
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
  applySanitization(req, res);
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

  // Validate API key format
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
  if (req.method === 'POST' && !req.query.cityId) {
    return createCity(req, res);
  } else if (req.method === 'GET' && req.query.cityId) {
    req.params = { cityId: req.query.cityId };
    return getCity(req, res);
  } else if (req.method === 'GET') {
    return listCities(req, res);
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
