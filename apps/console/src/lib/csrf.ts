/**
 * CSRF Token Management
 * Custom implementation for Lydian-IQ Gateway
 */

export async function getCsrfToken(): Promise<string> {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3100';

  try {
    const response = await fetch(`${apiBase}/api/csrf-token`, {
      credentials: 'include',
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`CSRF token fetch failed: ${response.status}`);
    }

    const data = await response.json();
    return data.csrfToken || '';
  } catch (error) {
    console.error('Failed to get CSRF token:', error);
    return '';
  }
}

/**
 * Add CSRF token to request headers
 */
export async function withCsrf(headers: HeadersInit = {}): Promise<HeadersInit> {
  const token = await getCsrfToken();

  return {
    ...headers,
    'X-CSRF-Token': token,
  };
}
