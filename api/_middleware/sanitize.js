/**
 * AILYDIAN Response Sanitization Middleware
 *
 * Intercepts ALL API responses to strip AI model names.
 * Wraps res.json, res.send, res.end, and SSE writes.
 *
 * Usage: require and call applySanitization(req, res) at the top of any handler.
 */

const { sanitizeModelNames } = require('../../services/localrecall/obfuscation');

/**
 * ALLOWED ORIGIN LIST - Only ailydian.com domains
 */
const ALLOWED_ORIGINS = [
  'https://ailydian.com',
  'https://www.ailydian.com',
  'https://seo.ailydian.com',
  'https://dashboard.ailydian.com',
];

/**
 * Get allowed origin from request
 */
function getAllowedOrigin(req) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    return origin;
  }
  return ALLOWED_ORIGINS[1]; // default: www.ailydian.com
}

/**
 * Deep sanitize any value (string, object, array)
 */
function deepSanitize(value) {
  if (typeof value === 'string') {
    return sanitizeModelNames(value);
  }
  if (Array.isArray(value)) {
    return value.map(deepSanitize);
  }
  if (value && typeof value === 'object') {
    const sanitized = {};
    for (const key of Object.keys(value)) {
      sanitized[key] = deepSanitize(value[key]);
    }
    return sanitized;
  }
  return value;
}

/**
 * Sanitize SSE data chunk
 */
function sanitizeSSEChunk(chunk) {
  if (!chunk) return chunk;
  const str = typeof chunk === 'string' ? chunk : chunk.toString();

  // Split by SSE data lines
  const lines = str.split('\n');
  const sanitizedLines = lines.map(line => {
    if (line.startsWith('data: ')) {
      const data = line.substring(6);
      if (data === '[DONE]') return line;
      try {
        const parsed = JSON.parse(data);
        const sanitized = deepSanitize(parsed);
        return `data: ${JSON.stringify(sanitized)}`;
      } catch {
        // Not JSON, sanitize as string
        return `data: ${sanitizeModelNames(data)}`;
      }
    }
    return line;
  });
  return sanitizedLines.join('\n');
}

/**
 * Apply response sanitization to res object
 * Call this at the top of every API handler.
 */
function applySanitization(req, res) {
  // Set secure CORS
  const origin = getAllowedOrigin(req);
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Vary', 'Origin');

  // Wrap res.json
  const originalJson = res.json.bind(res);
  res.json = function (data) {
    const sanitized = deepSanitize(data);
    return originalJson(sanitized);
  };

  // Wrap res.send for string responses
  const originalSend = res.send.bind(res);
  res.send = function (data) {
    if (typeof data === 'string') {
      return originalSend(sanitizeModelNames(data));
    }
    if (data && typeof data === 'object') {
      return originalSend(deepSanitize(data));
    }
    return originalSend(data);
  };

  // Wrap res.write for SSE streaming
  const originalWrite = res.write.bind(res);
  res.write = function (chunk, encoding, callback) {
    const sanitized = sanitizeSSEChunk(chunk);
    return originalWrite(sanitized, encoding, callback);
  };

  // Wrap res.end for string data passed to end()
  const originalEnd = res.end.bind(res);
  res.end = function (data, encoding, callback) {
    if (typeof data === 'string') {
      return originalEnd(sanitizeModelNames(data), encoding, callback);
    }
    if (data && Buffer.isBuffer(data)) {
      const str = data.toString('utf-8');
      const sanitized = sanitizeModelNames(str);
      return originalEnd(Buffer.from(sanitized, 'utf-8'), encoding, callback);
    }
    return originalEnd(data, encoding, callback);
  };
}

module.exports = {
  applySanitization,
  deepSanitize,
  sanitizeSSEChunk,
  getAllowedOrigin,
  ALLOWED_ORIGINS,
};
