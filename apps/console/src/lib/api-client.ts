/**
 * 🔐 API Client with RBAC
 * Secure API calls with scope validation
 * 
 * @module lib/api-client
 * @white-hat Compliant
 */

export interface APIOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: any;
  headers?: Record<string, string>;
  scopes?: string[];
  timeout?: number;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
}

// RBAC: Check if user has required scopes
export function hasRequiredScopes(userScopes: string[], requiredScopes: string[]): boolean {
  if (!requiredScopes || requiredScopes.length === 0) return true;
  return requiredScopes.every(scope => userScopes.includes(scope));
}

// API Client
export async function apiFetch<T = any>(
  endpoint: string,
  options: APIOptions = {}
): Promise<APIResponse<T>> {
  const {
    method = 'GET',
    body,
    headers = {},
    scopes = [],
    timeout = 10000,
  } = options;

  try {
    // RBAC check (client-side pre-check)
    const userScopes = getUserScopes(); // From store or context
    if (!hasRequiredScopes(userScopes, scopes)) {
      return {
        success: false,
        error: `Missing required scopes: ${scopes.join(', ')}`,
        statusCode: 403,
      };
    }

    // CSRF token
    const csrfToken = await getCSRFToken();

    // Fetch with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
        ...headers,
      },
      credentials: 'include', // CSRF protection
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Handle rate limiting (429)
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After') || '60';
      return {
        success: false,
        error: `Rate limit exceeded. Retry after ${retryAfter}s`,
        statusCode: 429,
      };
    }

    // Handle errors
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.message || `HTTP ${response.status}`,
        statusCode: response.status,
      };
    }

    // Success
    const data = await response.json();
    return {
      success: true,
      data,
      statusCode: response.status,
    };

  } catch (error: any) {
    // Timeout or network error
    if (error.name === 'AbortError') {
      return {
        success: false,
        error: 'Request timeout',
        statusCode: 408,
      };
    }

    return {
      success: false,
      error: error.message || 'Network error',
    };
  }
}

// Helper: Get CSRF token
async function getCSRFToken(): Promise<string> {
  const metaTag = document.querySelector('meta[name="csrf-token"]');
  if (metaTag) {
    return metaTag.getAttribute('content') || '';
  }

  // Fetch from API
  try {
    const response = await fetch('/api/csrf-token');
    const { token } = await response.json();
    return token;
  } catch {
    return '';
  }
}

// Helper: Get user scopes (from Zustand store)
function getUserScopes(): string[] {
  // Import dynamically to avoid circular deps
  if (typeof window !== 'undefined' && (window as any).__APP_STORE__) {
    return (window as any).__APP_STORE__.getState().user.scopes;
  }
  return [];
}

// Connector-specific API calls
export const ConnectorAPI = {
  fetchHealth: (connectorId: string) =>
    apiFetch(`/api/connectors/${connectorId}/health`, {
      scopes: ['read:connectors'],
    }),

  trackShipment: (connectorId: string, trackingNo: string) =>
    apiFetch(`/api/connectors/${connectorId}/track`, {
      method: 'POST',
      body: { trackingNo },
      scopes: ['read:connectors', 'read:shipments'],
    }),

  syncPrice: (connectorId: string, params: any) =>
    apiFetch(`/api/connectors/${connectorId}/price/sync`, {
      method: 'POST',
      body: params,
      scopes: ['write:connectors', 'write:prices'],
    }),

  syncInventory: (connectorId: string) =>
    apiFetch(`/api/connectors/${connectorId}/inventory/sync`, {
      method: 'POST',
      scopes: ['write:connectors', 'write:inventory'],
    }),
};

console.log('✅ API Client with RBAC initialized');
