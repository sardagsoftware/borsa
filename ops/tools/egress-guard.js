#!/usr/bin/env node
/**
 * 🌐 EGRESS-GUARD - Outbound Traffic Control Tool
 * ============================================================================
 * Purpose: Monitor and control outbound HTTP/HTTPS requests
 * Policy: White-Hat • Zero Mock • Audit-Ready • Deny-by-Default
 *
 * Usage:
 *   const { egressGuard, addToAllowlist } = require('./egress-guard');
 *   egressGuard.install(); // Patches http/https modules
 *
 * Features:
 * - Hash-based allowlist (domain hashes, not plaintext)
 * - Deny-by-default policy
 * - Alert on unauthorized egress attempts
 * - Audit logging
 * ============================================================================
 */

const crypto = require('crypto');
const http = require('http');
const https = require('https');

// Configuration
const CONFIG = {
  mode: process.env.EGRESS_GUARD_MODE || 'enforce', // 'monitor' or 'enforce'
  alertWebhook: process.env.EGRESS_ALERT_WEBHOOK || null,
  logFile: process.env.EGRESS_LOG_FILE || '/tmp/egress-guard.log'
};

// Allowlist (hashed domains)
const ALLOWLIST = new Set([
  // Ailydian own domains
  hashDomain('ailydian.com'),
  hashDomain('www.ailydian.com'),
  hashDomain('api.ailydian.com'),

  // Vercel infrastructure
  hashDomain('vercel.com'),
  hashDomain('vercel.app'),

  // CDN/Static assets
  hashDomain('cdn.jsdelivr.net'),
  hashDomain('fonts.googleapis.com'),
  hashDomain('fonts.gstatic.com'),

  // Monitoring/Analytics (if needed)
  // Add more as needed, but keep minimal
]);

// Blocked patterns (never allow)
const BLOCKED_PATTERNS = [
  /api\.openai\.com/i,
  /api\.anthropic\.com/i,
  /generativelanguage\.googleapis\.com/i,
  /openai\.azure\.com/i,
  /api\.cohere\.ai/i
];

/**
 * Hash a domain name
 */
function hashDomain(domain) {
  return crypto.createHash('sha256').update(domain.toLowerCase()).digest('hex');
}

/**
 * Check if domain is allowed
 */
function isAllowed(hostname) {
  const hash = hashDomain(hostname);

  // Check allowlist
  if (ALLOWLIST.has(hash)) {
    return true;
  }

  // Check blocked patterns (explicit deny)
  if (BLOCKED_PATTERNS.some(pattern => pattern.test(hostname))) {
    return false;
  }

  return false; // Deny by default
}

/**
 * Log egress attempt
 */
function logEgress(hostname, allowed, method = 'GET', path = '/') {
  const entry = {
    timestamp: new Date().toISOString(),
    hostname,
    hostnameHash: hashDomain(hostname),
    method,
    path: path.substring(0, 100), // Limit path length
    allowed,
    mode: CONFIG.mode
  };

  console.warn(`[EgressGuard] ${allowed ? 'ALLOWED' : 'BLOCKED'}: ${method} ${hostname}${path}`);

  // TODO: Write to log file
  // fs.appendFileSync(CONFIG.logFile, JSON.stringify(entry) + '\n');

  // Alert if blocked
  if (!allowed && CONFIG.alertWebhook) {
    sendAlert(entry);
  }

  return entry;
}

/**
 * Send security alert
 */
async function sendAlert(entry) {
  try {
    // TODO: Implement webhook alert
    console.error('[EgressGuard] SECURITY ALERT:', entry);
  } catch (error) {
    console.error('[EgressGuard] Failed to send alert:', error.message);
  }
}

/**
 * Patch HTTP/HTTPS modules
 */
function patchHttpModule(module, moduleName) {
  const originalRequest = module.request;

  module.request = function(...args) {
    const options = typeof args[0] === 'string' ? new URL(args[0]) : args[0];
    const hostname = options.hostname || options.host || 'unknown';
    const method = options.method || 'GET';
    const path = options.path || '/';

    const allowed = isAllowed(hostname);
    logEgress(hostname, allowed, method, path);

    if (!allowed && CONFIG.mode === 'enforce') {
      // Block the request
      const error = new Error(`Egress blocked: ${hostname} not in allowlist`);
      error.code = 'EGRESS_DENIED';
      error.hostname = hostname;

      // Return a fake request object that emits error
      const fakeRequest = {
        on: () => fakeRequest,
        once: () => fakeRequest,
        emit: () => {},
        end: () => {},
        write: () => {},
        abort: () => {}
      };

      process.nextTick(() => {
        if (args[1]) args[1](error);
      });

      return fakeRequest;
    }

    return originalRequest.apply(this, args);
  };

  module.get = function(...args) {
    return module.request(...args).end();
  };
}

/**
 * Install egress guard
 */
function install() {
  console.log('[EgressGuard] Installing... Mode:', CONFIG.mode);

  patchHttpModule(http, 'http');
  patchHttpModule(https, 'https');

  console.log('[EgressGuard] Installed successfully');
  console.log(`[EgressGuard] Allowlist size: ${ALLOWLIST.size} domains`);
}

/**
 * Add domain to allowlist
 */
function addToAllowlist(domain) {
  const hash = hashDomain(domain);
  ALLOWLIST.add(hash);
  console.log(`[EgressGuard] Added to allowlist: ${domain} (hash: ${hash.substring(0, 8)}...)`);
}

/**
 * Get allowlist for audit
 */
function getAuditInfo() {
  return {
    mode: CONFIG.mode,
    allowlistSize: ALLOWLIST.size,
    blockedPatterns: BLOCKED_PATTERNS.length
  };
}

// Auto-install if configured
if (process.env.EGRESS_GUARD_ENABLED === 'true') {
  install();
}

module.exports = {
  install,
  addToAllowlist,
  isAllowed,
  hashDomain,
  getAuditInfo,
  CONFIG
};
