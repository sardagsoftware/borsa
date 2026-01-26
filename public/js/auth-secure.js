/**
 * 🔒 SECURE AUTHENTICATION MODULE
 * httpOnly Cookie-based Authentication
 * Protection against XSS token theft
 *
 * Migration from localStorage to httpOnly cookies
 * Tokens are now stored server-side, not accessible to JavaScript
 */

/* global fetch, sessionStorage, localStorage, document, window */
/* eslint-env browser */

(function (window) {
  'use strict';

  const AuthSecure = {
    /**
     * Check if user is authenticated
     * Makes a request to backend which checks httpOnly cookies
     * @returns {Promise<boolean>}
     */
    async isAuthenticated() {
      try {
        const response = await fetch('/api/auth/verify', {
          method: 'GET',
          credentials: 'include', // Send cookies
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          return data.authenticated === true;
        }

        return false;
      } catch (error) {
        console.error('Authentication check failed:', error);
        return false;
      }
    },

    /**
     * Get current user profile
     * Backend reads accessToken from httpOnly cookie
     * @returns {Promise<Object|null>}
     */
    async getCurrentUser() {
      try {
        const response = await fetch('/api/auth/me', {
          method: 'GET',
          credentials: 'include', // Send cookies
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          return await response.json();
        }

        return null;
      } catch (error) {
        console.error('Failed to get user profile:', error);
        return null;
      }
    },

    /**
     * Login with email and password
     * Backend sets httpOnly cookies on success
     * @param {string} email
     * @param {string} password
     * @param {string} recaptchaToken
     * @returns {Promise<Object>}
     */
    async login(email, password, recaptchaToken) {
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          credentials: 'include', // Allow cookies to be set
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            password,
            recaptchaToken,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Login failed');
        }

        // Tokens are now in httpOnly cookies, not returned in response
        return {
          success: true,
          user: data.user,
          message: data.message || 'Login successful',
        };
      } catch (error) {
        console.error('Login failed:', error);
        return {
          success: false,
          error: error.message,
        };
      }
    },

    /**
     * Register new user
     * Backend sets httpOnly cookies on success
     * @param {Object} userData
     * @returns {Promise<Object>}
     */
    async register(userData) {
      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          credentials: 'include', // Allow cookies to be set
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userData),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Registration failed');
        }

        return {
          success: true,
          user: data.user,
          message: data.message || 'Registration successful',
        };
      } catch (error) {
        console.error('Registration failed:', error);
        return {
          success: false,
          error: error.message,
        };
      }
    },

    /**
     * Logout user
     * Backend clears httpOnly cookies
     * @returns {Promise<boolean>}
     */
    async logout() {
      try {
        const response = await fetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'include', // Send cookies
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          // Clean up any remaining localStorage items (legacy)
          this.cleanupLegacyStorage();
          return true;
        }

        return false;
      } catch (error) {
        console.error('Logout failed:', error);
        return false;
      }
    },

    /**
     * Refresh access token using refresh token
     * Backend handles token rotation automatically
     * @returns {Promise<boolean>}
     */
    async refreshToken() {
      try {
        const response = await fetch('/api/auth/refresh', {
          method: 'POST',
          credentials: 'include', // Send refresh token cookie
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          // New tokens set as httpOnly cookies by backend
          return true;
        }

        return false;
      } catch (error) {
        console.error('Token refresh failed:', error);
        return false;
      }
    },

    /**
     * Make authenticated API request
     * Automatically includes credentials (cookies)
     * @param {string} url
     * @param {Object} options
     * @returns {Promise<Response>}
     */
    async fetch(url, options = {}) {
      const defaultOptions = {
        credentials: 'include', // Always send cookies
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      };

      const mergedOptions = { ...defaultOptions, ...options };

      try {
        let response = await fetch(url, mergedOptions);

        // If 401 and not already refreshing, try token refresh
        if (response.status === 401 && !options._retry) {
          const refreshed = await this.refreshToken();

          if (refreshed) {
            // Retry original request with new token
            return await this.fetch(url, { ...options, _retry: true });
          }

          // Refresh failed, redirect to login
          await this.logout();
          window.location.href = '/auth';
        }

        return response;
      } catch (error) {
        console.error('API request failed:', error);
        throw error;
      }
    },

    /**
     * Require authentication for current page
     * Redirects to /auth if not authenticated
     * @returns {Promise<void>}
     */
    async requireAuth() {
      const authenticated = await this.isAuthenticated();

      if (!authenticated) {
        // Save current page for redirect after login
        sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
        window.location.href = '/auth';
      }
    },

    /**
     * Redirect after successful login
     * Uses saved redirect path or defaults to /dashboard
     */
    redirectAfterLogin() {
      const redirectPath = sessionStorage.getItem('redirectAfterLogin') || '/dashboard';
      sessionStorage.removeItem('redirectAfterLogin');
      window.location.href = redirectPath;
    },

    /**
     * Clean up legacy localStorage tokens
     * Migration helper - removes old insecure storage
     */
    cleanupLegacyStorage() {
      // Remove old localStorage tokens
      const keysToRemove = [
        'accessToken',
        'refreshToken',
        'token',
        'auth_token',
        'jwt',
        'user_token',
      ];

      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key);
          sessionStorage.removeItem(key);
        } catch (error) {
          // Ignore storage errors - eslint-disable-line no-unused-vars
          console.error('Storage cleanup error:', error);
        }
      });
    },

    /**
     * Initialize auth module
     * Cleans up legacy storage on first load
     */
    init() {
      // Check if we need to migrate from localStorage
      const hasLegacyToken =
        localStorage.getItem('accessToken') || localStorage.getItem('refreshToken');

      if (hasLegacyToken) {
        console.warn('🔒 Migrating to secure httpOnly cookies...');
        this.cleanupLegacyStorage();
      }

      // Set up automatic token refresh before expiry
      this.setupAutoRefresh();
    },

    /**
     * Setup automatic token refresh
     * Refreshes token every 10 minutes (before 15min expiry)
     */
    setupAutoRefresh() {
      // Refresh every 10 minutes (token expires in 15 minutes)
      setInterval(async () => {
        const authenticated = await this.isAuthenticated();
        if (authenticated) {
          await this.refreshToken();
        }
      }, 600000); // 10 minutes
    },
  };

  // Auto-initialize on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => AuthSecure.init());
  } else {
    AuthSecure.init();
  }

  // Export to global scope
  window.AuthSecure = AuthSecure;
})(window);
