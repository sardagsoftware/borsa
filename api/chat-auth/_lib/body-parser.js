/**
 * Body Parser Helper for Vercel Serverless Functions
 * Handles both string and object bodies
 */

function parseBody(req) {
  // If body is already an object, return it
  if (typeof req.body === 'object' && req.body !== null) {
    return req.body;
  }

  // If body is a string, try to parse as JSON
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      throw new Error('Invalid JSON');
    }
  }

  // Return empty object if no body
  return {};
}

module.exports = { parseBody };
