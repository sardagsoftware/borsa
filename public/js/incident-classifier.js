// 🏷️ INCIDENT CLASSIFIER - Auto-tagging için heuristic kurallar

/**
 * Incident tag türleri
 */
const INCIDENT_TAGS = {
  DNS: 'DNS',
  AUTH: 'Auth',
  UPSTREAM: 'Upstream',
  RATE_LIMIT: 'RateLimit',
  NETWORK: 'Network',
  REDIRECT: 'Redirect',
  CLIENT_4XX: 'Client4xx',
  SERVER_5XX: 'Server5xx',
  SECURITY: 'Security',
  UNKNOWN: 'Unknown'
};

/**
 * Tag renk kodları
 */
const TAG_COLORS = {
  [INCIDENT_TAGS.DNS]: { bg: 'rgba(99, 102, 241, 0.15)', text: '#818cf8' },
  [INCIDENT_TAGS.AUTH]: { bg: 'rgba(14, 165, 233, 0.15)', text: '#38bdf8' },
  [INCIDENT_TAGS.UPSTREAM]: { bg: 'rgba(217, 70, 239, 0.15)', text: '#e879f9' },
  [INCIDENT_TAGS.RATE_LIMIT]: { bg: 'rgba(251, 191, 36, 0.15)', text: '#fbbf24' },
  [INCIDENT_TAGS.NETWORK]: { bg: 'rgba(168, 85, 247, 0.15)', text: '#a78bfa' },
  [INCIDENT_TAGS.REDIRECT]: { bg: 'rgba(6, 182, 212, 0.15)', text: '#22d3ee' },
  [INCIDENT_TAGS.CLIENT_4XX]: { bg: 'rgba(251, 146, 60, 0.15)', text: '#fb923c' },
  [INCIDENT_TAGS.SERVER_5XX]: { bg: 'rgba(239, 68, 68, 0.15)', text: '#f87171' },
  [INCIDENT_TAGS.SECURITY]: { bg: 'rgba(16, 185, 129, 0.15)', text: '#34d399' },
  [INCIDENT_TAGS.UNKNOWN]: { bg: 'rgba(148, 163, 184, 0.15)', text: '#94a3b8' }
};

/**
 * Classify incident based on status code, error message, and context
 * @param {Object} incident - { name, url, code, status, err }
 * @returns {Object} - { ...incident, tag, hint }
 */
function classifyIncident(incident) {
  const code = incident.code || 0;
  const name = (incident.name || '').toLowerCase();
  const url = (incident.url || '').toLowerCase();
  const err = ((incident.err || '') + '').toLowerCase();

  // Status code based classification
  if (code >= 500) {
    return {
      ...incident,
      tag: INCIDENT_TAGS.SERVER_5XX,
      hint: 'Backend 5xx error'
    };
  }

  if (code === 429) {
    return {
      ...incident,
      tag: INCIDENT_TAGS.RATE_LIMIT,
      hint: 'Rate limit exceeded (429)'
    };
  }

  if (code >= 400 && code < 500) {
    return {
      ...incident,
      tag: INCIDENT_TAGS.CLIENT_4XX,
      hint: 'Client error / Access denied'
    };
  }

  if (code >= 300 && code < 400) {
    return {
      ...incident,
      tag: INCIDENT_TAGS.REDIRECT,
      hint: 'Redirect response'
    };
  }

  // Error message based classification
  if (err.includes('dns') || err.includes('enotfound') || err.includes('nxdomain')) {
    return {
      ...incident,
      tag: INCIDENT_TAGS.DNS,
      hint: 'DNS resolution failure'
    };
  }

  if (err.includes('network') || err.includes('timeout') || err.includes('fetch') || err.includes('econnrefused')) {
    return {
      ...incident,
      tag: INCIDENT_TAGS.NETWORK,
      hint: 'Network timeout or connection error'
    };
  }

  // URL/Name based classification
  if (name.includes('auth') || url.includes('auth') || url.includes('login')) {
    return {
      ...incident,
      tag: INCIDENT_TAGS.AUTH,
      hint: 'Authentication service'
    };
  }

  if (name.includes('api') || url.includes('api') || name.includes('ops')) {
    return {
      ...incident,
      tag: INCIDENT_TAGS.UPSTREAM,
      hint: 'Upstream service dependency'
    };
  }

  if (name.includes('privacy') || name.includes('security') || url.includes('privacy')) {
    return {
      ...incident,
      tag: INCIDENT_TAGS.SECURITY,
      hint: 'Security/Compliance page'
    };
  }

  // Default
  return {
    ...incident,
    tag: INCIDENT_TAGS.UNKNOWN,
    hint: 'Unclassified incident'
  };
}

/**
 * Get tag color
 * @param {string} tag
 * @returns {Object} - { bg, text }
 */
function getTagColor(tag) {
  return TAG_COLORS[tag] || TAG_COLORS[INCIDENT_TAGS.UNKNOWN];
}

/**
 * Get all incident tags
 * @returns {Array<string>}
 */
function getAllTags() {
  return Object.values(INCIDENT_TAGS);
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    INCIDENT_TAGS,
    TAG_COLORS,
    classifyIncident,
    getTagColor,
    getAllTags
  };
}
