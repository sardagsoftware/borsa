/**
 * RBAC - Role Based Access Control
 * Simple implementation for Lydian-IQ Unified Surface
 */

async function verifyScopes(user, requiredScopes) {
  // Development mode - bypass for testing
  if (process.env.NODE_ENV !== 'production') {
    return { valid: true };
  }

  if (!user || !user.scopes) {
    return {
      valid: false,
      reason: 'No user scopes provided'
    };
  }

  const userScopes = Array.isArray(user.scopes) ? user.scopes : [];
  const missingScopes = requiredScopes.filter(scope => !userScopes.includes(scope));

  if (missingScopes.length > 0) {
    return {
      valid: false,
      missingScopes,
      reason: `Missing required scopes: ${missingScopes.join(', ')}`
    };
  }

  return { valid: true };
}

module.exports = {
  verifyScopes
};
