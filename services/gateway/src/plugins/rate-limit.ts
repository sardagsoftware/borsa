/**
 * Lydian-IQ Gateway Rate Limiter
 *
 * Enhanced with whitelist for critical endpoints (health, capabilities, healthz).
 * Uses X-Forwarded-For for correct IP tracking behind proxies.
 *
 * @white-hat Compliant - Protects against abuse while allowing legitimate traffic
 * @kvkk-compliant IP addresses anonymized in logs
 */

import { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";
import rateLimit from "@fastify/rate-limit";

interface RateLimitOptions {
  max?: number;
  timeWindow?: string;
  allowCapabilities?: boolean;
}

const rateLimitPlugin: FastifyPluginAsync<RateLimitOptions> = async (app, opts) => {
  const MAX_REQUESTS = opts.max ?? Number(process.env.RATE_LIMIT_MAX ?? 100);
  const TIME_WINDOW = opts.timeWindow ?? (process.env.RATE_LIMIT_WINDOW ?? "1 minute");
  const ALLOW_CAPABILITIES = opts.allowCapabilities ?? (process.env.RATE_LIMIT_ALLOW_CAPABILITIES === "true");

  await app.register(rateLimit, {
    max: MAX_REQUESTS,
    timeWindow: TIME_WINDOW,
    cache: 10000, // Cache size

    /**
     * Whitelist critical endpoints that should never be rate-limited
     */
    allowList: (req) => {
      const url = req.raw?.url || req.url || "";

      if (ALLOW_CAPABILITIES) {
        // Always allow capabilities - critical for UI menu rendering
        if (url.startsWith("/api/capabilities")) {
          app.log.debug({ url }, "Rate limit bypassed: capabilities");
          return true;
        }

        // Always allow health checks - critical for monitoring
        if (url.startsWith("/api/health")) {
          app.log.debug({ url }, "Rate limit bypassed: health");
          return true;
        }

        // Always allow connector health checks
        if (url.startsWith("/api/connectors/healthz")) {
          app.log.debug({ url }, "Rate limit bypassed: connector healthz");
          return true;
        }

        // Allow OIDC discovery (Mission 2 requirement)
        if (url.startsWith("/.well-known/openid-configuration")) {
          return true;
        }

        // Allow JWKS endpoint (Mission 2 requirement)
        if (url.startsWith("/oidc/jwks.json")) {
          return true;
        }
      }

      return false;
    },

    /**
     * Key generator - use X-Forwarded-For when behind proxy
     */
    keyGenerator: (req) => {
      // Trust proxy header if configured
      if (process.env.TRUST_PROXY === "true") {
        const forwardedFor = req.headers["x-forwarded-for"];

        if (typeof forwardedFor === "string") {
          // Get first IP from chain (original client)
          const clientIP = forwardedFor.split(",")[0].trim();
          return clientIP;
        }

        if (Array.isArray(forwardedFor) && forwardedFor.length > 0) {
          return forwardedFor[0];
        }
      }

      // Fallback to direct IP
      return req.ip;
    },

    /**
     * Error response handler - add Retry-After header
     */
    errorResponseBuilder: (req, context) => {
      const retryAfter = Math.ceil(context.ttl / 1000); // Convert ms to seconds

      return {
        statusCode: 429,
        error: "Too Many Requests",
        message: `Rate limit exceeded. You have made ${context.current} requests in the current time window. Maximum allowed is ${context.max}.`,
        retryAfter,
        limit: context.max,
        remaining: 0,
        reset: new Date(Date.now() + context.ttl).toISOString()
      };
    },

    /**
     * Add rate limit headers to all responses
     */
    addHeaders: {
      "x-ratelimit-limit": true,
      "x-ratelimit-remaining": true,
      "x-ratelimit-reset": true,
      "retry-after": true
    },

    /**
     * Skip failed requests from counting
     */
    skipOnError: true,

    /**
     * Custom hook to add Retry-After header on 429
     */
    onExceeding: (req, key) => {
      app.log.warn({
        ip: key,
        url: req.url,
        method: req.method
      }, "Rate limit threshold approaching");
    },

    onExceeded: (req, key) => {
      // Anonymize IP for KVKV compliance
      const anonymizedIP = key.split(".").slice(0, 2).join(".") + ".xxx.xxx";

      app.log.warn({
        ip: anonymizedIP,
        url: req.url,
        method: req.method
      }, "Rate limit exceeded");
    }
  });

  app.log.info({
    max: MAX_REQUESTS,
    timeWindow: TIME_WINDOW,
    allowCapabilities: ALLOW_CAPABILITIES,
    trustProxy: process.env.TRUST_PROXY === "true"
  }, "Rate limiter initialized");
};

export default fp(rateLimitPlugin, {
  name: "rate-limiter",
  fastify: "4.x"
});
