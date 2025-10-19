'use client';

// 🏷️ INCIDENT CLASSIFIER - Auto-tag incidents with actionable hints
// 10 categories: DNS, Auth, Upstream, RateLimit, Network, Redirect, Client4xx, Server5xx, Security, Unknown

import type { HealthRow, ClassifiedIncident, IncidentTag } from '@/types/health';

/**
 * Classify incident based on error patterns
 */
export function classifyIncident(incident: HealthRow): ClassifiedIncident {
  const { code, err, url, name } = incident;

  // DNS errors
  if (err?.includes('ENOTFOUND') || err?.includes('getaddrinfo')) {
    return {
      ...incident,
      tag: 'DNS',
      hint: 'DNS lookup failed - check domain configuration',
    };
  }

  // Authentication errors
  if (
    code === 401 ||
    code === 403 ||
    url.includes('/auth') ||
    name.toLowerCase().includes('auth')
  ) {
    return {
      ...incident,
      tag: 'Auth',
      hint: 'Authentication/authorization issue',
    };
  }

  // Rate limiting
  if (code === 429) {
    return {
      ...incident,
      tag: 'RateLimit',
      hint: 'Rate limit exceeded - implement backoff',
    };
  }

  // Redirects
  if (code >= 300 && code < 400) {
    return {
      ...incident,
      tag: 'Redirect',
      hint: 'Redirect response - check chain',
    };
  }

  // Client 4xx errors
  if (code >= 400 && code < 500 && code !== 401 && code !== 403 && code !== 429) {
    return {
      ...incident,
      tag: 'Client4xx',
      hint: 'Client-side error - validate request',
    };
  }

  // Server 5xx errors
  if (code >= 500 && code < 600) {
    // Upstream specific
    if (code === 502 || code === 503 || code === 504) {
      return {
        ...incident,
        tag: 'Upstream',
        hint: 'Upstream service issue - check dependencies',
      };
    }

    return {
      ...incident,
      tag: 'Server5xx',
      hint: 'Backend 5xx error - check logs',
    };
  }

  // Network errors
  if (
    err?.includes('ETIMEDOUT') ||
    err?.includes('ECONNREFUSED') ||
    err?.includes('ECONNRESET') ||
    err?.includes('Network error')
  ) {
    return {
      ...incident,
      tag: 'Network',
      hint: 'Network connectivity issue',
    };
  }

  // Security (if we add WAF/firewall detection later)
  if (err?.includes('blocked') || err?.includes('forbidden')) {
    return {
      ...incident,
      tag: 'Security',
      hint: 'Security policy blocked request',
    };
  }

  // Default: Unknown
  return {
    ...incident,
    tag: 'Unknown',
    hint: 'Unclassified incident - review details',
  };
}

/**
 * Get tag color for UI
 */
export function getTagColor(tag: IncidentTag): string {
  const colors: Record<IncidentTag, string> = {
    DNS: '#8B5CF6', // Purple
    Auth: '#F59E0B', // Amber
    Upstream: '#EF4444', // Red
    RateLimit: '#F97316', // Orange
    Network: '#3B82F6', // Blue
    Redirect: '#10B981', // Emerald
    Client4xx: '#F59E0B', // Amber
    Server5xx: '#DC2626', // Red 600
    Security: '#DC2626', // Red 600
    Unknown: '#6B7280', // Gray
  };
  return colors[tag];
}

/**
 * Get tag emoji
 */
export function getTagEmoji(tag: IncidentTag): string {
  const emojis: Record<IncidentTag, string> = {
    DNS: '🌐',
    Auth: '🔐',
    Upstream: '⬆️',
    RateLimit: '⏱️',
    Network: '📡',
    Redirect: '↪️',
    Client4xx: '⚠️',
    Server5xx: '🔴',
    Security: '🛡️',
    Unknown: '❓',
  };
  return emojis[tag];
}

/**
 * Incident Tag Badge Component
 */
interface IncidentTagBadgeProps {
  tag: IncidentTag;
  className?: string;
}

export function IncidentTagBadge({ tag, className = '' }: IncidentTagBadgeProps) {
  const color = getTagColor(tag);
  const emoji = getTagEmoji(tag);

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${className}`}
      style={{
        backgroundColor: `${color}15`,
        color,
        border: `1px solid ${color}40`,
      }}
    >
      <span>{emoji}</span>
      <span>{tag}</span>
    </span>
  );
}

/**
 * Batch classify incidents
 */
export function classifyIncidents(incidents: HealthRow[]): ClassifiedIncident[] {
  return incidents.map(classifyIncident);
}

/**
 * Group incidents by tag
 */
export function groupByTag(
  incidents: ClassifiedIncident[]
): Record<IncidentTag, ClassifiedIncident[]> {
  const groups: Partial<Record<IncidentTag, ClassifiedIncident[]>> = {};

  incidents.forEach(incident => {
    if (!groups[incident.tag]) {
      groups[incident.tag] = [];
    }
    groups[incident.tag]!.push(incident);
  });

  return groups as Record<IncidentTag, ClassifiedIncident[]>;
}
