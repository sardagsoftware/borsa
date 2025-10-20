/**
 * LYDIAN-IQ OUTBOUND REQUEST GUARD
 *
 * Purpose: SSRF (Server-Side Request Forgery) protection for outbound API calls
 * Compliance: OWASP API Security Top 10 (API8:2023 Security Misconfiguration)
 *
 * Security Features:
 * - Block file:// protocol (local file access)
 * - Block localhost/127.0.0.1 (local services)
 * - Block link-local addresses (169.254.0.0/16)
 * - Block private IP ranges (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16)
 * - Domain allowlist enforcement
 * - Per-vendor request signing
 *
 * Usage:
 * ```typescript
 * import { validateOutboundURL, secureFetch } from '@/lib/security/outbound-guard';
 *
 * // Validate URL before making request
 * validateOutboundURL('https://api.trendyol.com/products');
 *
 * // Use secure fetch wrapper
 * const response = await secureFetch('https://api.trendyol.com/products', {
 *   vendor: 'trendyol',
 *   method: 'GET'
 * });
 * ```
 */

import dns from "dns/promises";
import crypto from "crypto";

/**
 * SSRF error codes
 */
export enum SSRFErrorCode {
  BLOCKED_PROTOCOL = "BLOCKED_PROTOCOL",
  BLOCKED_HOSTNAME = "BLOCKED_HOSTNAME",
  BLOCKED_IP = "BLOCKED_IP",
  NOT_IN_ALLOWLIST = "NOT_IN_ALLOWLIST",
  DNS_RESOLUTION_FAILED = "DNS_RESOLUTION_FAILED",
  INVALID_URL = "INVALID_URL"
}

/**
 * SSRF protection error
 */
export class SSRFError extends Error {
  constructor(
    public code: SSRFErrorCode,
    message: string,
    public url?: string
  ) {
    super(message);
    this.name = "SSRFError";
  }
}

/**
 * Blocked URL patterns (file://, localhost, private IPs)
 */
const BLOCKED_PATTERNS = [
  /^file:\/\//i,                          // Block file:// protocol
  /^https?:\/\/(localhost|127\.0\.0\.1)/i, // Block localhost
  /^https?:\/\/169\.254\./,                // Block link-local (AWS metadata)
  /^https?:\/\/10\./,                      // Block private IP 10.0.0.0/8
  /^https?:\/\/192\.168\./,                // Block private IP 192.168.0.0/16
  /^https?:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\./, // Block private IP 172.16.0.0/12
  /^https?:\/\/0\.0\.0\.0/,                // Block 0.0.0.0
  /^https?:\/\/\[::1\]/,                   // Block IPv6 localhost
  /^https?:\/\/\[fe80:/,                   // Block IPv6 link-local
];

/**
 * Domain allowlist (production vendor API endpoints)
 * Add new vendors here as they are approved
 */
const ALLOWED_DOMAINS = new Set([
  // TR (Turkey)
  "api.trendyol.com",
  "developers.trendyol.com",
  "developers.hepsiburada.com",
  "api.hepsiburada.com",
  "partner.getir.com",
  "api.getir.com",
  "partner.trendyolyemek.com",
  "restaurantpartner.yemeksepeti.com",
  "api.migros.com.tr",
  "developers.sahibinden.com",
  "partner.arabam.com",
  "seller.temu.com",

  // TR Logistics (Cargo/Shipping)
  "api.araskargo.com.tr",
  "www.araskargo.com.tr",
  "api.yurticikargo.com",
  "developer.yurticikargo.com",
  "onlinetools.ups.com",
  "developer.ups.com",
  "api.hepsijet.com",
  "hepsijet.com",
  "api.mngkargo.com.tr",
  "www.mngkargo.com.tr",
  "api.suratkargo.com.tr",
  "www.suratkargo.com.tr",

  // AZ (Azerbaijan)
  "partner.tap.az",
  "partner.turbo.az",
  "partner.wolt.com",
  "api.wolt.com",
  "partner.bolt.eu",
  "api.bolt.eu",

  // QA (Qatar)
  "partners.talabat.com",
  "api.talabat.com",
  "partner.snoonu.com",
  "partners.carrefour.qa",
  "api.luluhypermarket.com",

  // SA (Saudi Arabia)
  "partner.noon.com",
  "api.noon.com",
  "haraj.com.sa",
  "vendors.hungerstation.com",
  "vendors.mrsool.co",
  "partner.nana.sa",

  // CY (Cyprus)
  "www.bazaraki.com",
  "partner.foody.com.cy",
  "partner.wolt.com",
  "partner.alphamega.com.cy",

  // RU (Russia) - sandbox only
  "seller.wildberries.ru",
  "api-seller.ozon.ru",
  "seller.ozon.ru",
  "partner.market.yandex.ru",
  "developers.avito.ru",
  "eda.yandex.ru",

  // DE (Germany)
  "partner.zalando.com",
  "api.otto.market",
  "partner.lieferando.de",
  "partner.rewe.de",
  "partner.check24.de",

  // BG (Bulgaria)
  "marketplace.emag.bg",
  "www.olx.bg",
  "partner.glovoapp.com",
  "partner.ebag.bg",

  // AT (Austria)
  "www.willhaben.at",
  "partner.lieferando.at",
  "partner.foodora.at",
  "partner.billa.at",
  "partner.gurkerl.at",
  "partner.shoepping.at",

  // NL (Netherlands)
  "partnerplatform.bol.com",
  "www.coolblue.nl",
  "www.marktplaats.nl",
  "partner.thuisbezorgd.nl",
  "partner.ah.nl",
  "partner.picnic.app",

  // Cloud Providers (for AI/Storage)
  "api.openai.com",
  "api.anthropic.com",
  "*.azure.com",
  "*.azurewebsites.net",
  "*.blob.core.windows.net",
  "*.openai.azure.com"
]);

/**
 * Check if hostname is in allowlist (supports wildcards)
 */
function isHostnameAllowed(hostname: string): boolean {
  // Direct match
  if (ALLOWED_DOMAINS.has(hostname)) {
    return true;
  }

  // Wildcard match (e.g., *.azure.com)
  for (const allowed of ALLOWED_DOMAINS) {
    if (allowed.startsWith("*.")) {
      const domain = allowed.slice(2); // Remove "*."
      if (hostname.endsWith(domain) || hostname === domain) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Check if IP address is private/blocked
 */
function isPrivateIP(ip: string): boolean {
  // IPv4 private ranges
  const ipv4Patterns = [
    /^10\./,                    // 10.0.0.0/8
    /^192\.168\./,              // 192.168.0.0/16
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // 172.16.0.0/12
    /^127\./,                   // 127.0.0.0/8 (localhost)
    /^169\.254\./,              // 169.254.0.0/16 (link-local)
    /^0\.0\.0\.0$/,             // 0.0.0.0
  ];

  // IPv6 private ranges
  const ipv6Patterns = [
    /^::1$/,                    // localhost
    /^fe80:/,                   // link-local
    /^fc00:/,                   // unique local
    /^fd00:/,                   // unique local
  ];

  return ipv4Patterns.some(p => p.test(ip)) || ipv6Patterns.some(p => p.test(ip));
}

/**
 * Validate outbound URL against SSRF protection rules
 *
 * @param url - URL to validate
 * @param skipDNS - Skip DNS resolution (faster, less secure)
 * @throws SSRFError if URL is blocked
 */
export async function validateOutboundURL(url: string, skipDNS = false): Promise<void> {
  // Parse URL
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch (error) {
    throw new SSRFError(
      SSRFErrorCode.INVALID_URL,
      `Invalid URL: ${url}`,
      url
    );
  }

  // Check blocked patterns
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(url)) {
      throw new SSRFError(
        SSRFErrorCode.BLOCKED_PROTOCOL,
        `Blocked outbound URL (SSRF protection): ${url}`,
        url
      );
    }
  }

  const hostname = parsed.hostname;

  // Check hostname allowlist
  if (!isHostnameAllowed(hostname)) {
    throw new SSRFError(
      SSRFErrorCode.NOT_IN_ALLOWLIST,
      `Hostname not in allowlist (SSRF protection): ${hostname}`,
      url
    );
  }

  // DNS resolution check (detect DNS rebinding attacks)
  if (!skipDNS) {
    try {
      const addresses = await dns.resolve4(hostname);

      // Check if resolved IP is private
      for (const ip of addresses) {
        if (isPrivateIP(ip)) {
          throw new SSRFError(
            SSRFErrorCode.BLOCKED_IP,
            `Hostname resolves to private IP (SSRF protection): ${hostname} → ${ip}`,
            url
          );
        }
      }
    } catch (error) {
      // DNS resolution failed or IP is private
      if (error instanceof SSRFError) {
        throw error;
      }
      // DNS resolution failure is not always an error (e.g., IPv6-only hosts)
      // Log warning but don't block
      console.warn(`DNS resolution failed for ${hostname}:`, error);
    }
  }
}

/**
 * Secure fetch wrapper with SSRF protection and request signing
 *
 * @param url - URL to fetch
 * @param options - Fetch options with vendor metadata
 * @returns Fetch response
 */
export async function secureFetch(
  url: string,
  options: RequestInit & {
    vendor?: string;
    signRequest?: boolean;
    skipSSRFCheck?: boolean;
  } = {}
): Promise<Response> {
  const { vendor, signRequest = false, skipSSRFCheck = false, ...fetchOptions } = options;

  // SSRF protection
  if (!skipSSRFCheck) {
    await validateOutboundURL(url);
  }

  // Add vendor-specific request signing if enabled
  if (signRequest && vendor) {
    const headers = new Headers(fetchOptions.headers);
    const body = fetchOptions.body ? JSON.stringify(fetchOptions.body) : "";
    const timestamp = Date.now();
    const nonce = crypto.randomBytes(16).toString("hex");

    // Sign request (vendor-specific signing logic)
    const signature = signVendorRequest(vendor, url, body, timestamp, nonce);

    headers.set("X-Vendor", vendor);
    headers.set("X-Signature", signature);
    headers.set("X-Timestamp", timestamp.toString());
    headers.set("X-Nonce", nonce);

    fetchOptions.headers = headers;
  }

  // Make request with timeout (30s default)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal
    });

    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Sign vendor request (per-vendor signing logic)
 *
 * @param vendor - Vendor identifier
 * @param url - Request URL
 * @param body - Request body
 * @param timestamp - Unix timestamp
 * @param nonce - Unique nonce
 * @returns HMAC-SHA256 signature
 */
function signVendorRequest(
  vendor: string,
  url: string,
  body: string,
  timestamp: number,
  nonce: string
): string {
  // Get vendor secret from environment
  const secretKey = process.env[`${vendor.toUpperCase().replace(/-/g, "_")}_API_SECRET`];

  if (!secretKey) {
    throw new Error(`Missing API secret for vendor: ${vendor}`);
  }

  // Construct signed message: timestamp.nonce.url.body
  const signedMessage = `${timestamp}.${nonce}.${url}.${body}`;

  // Compute HMAC-SHA256 signature
  const signature = crypto
    .createHmac("sha256", secretKey)
    .update(signedMessage)
    .digest("hex");

  return signature;
}

/**
 * Add domain to allowlist (for testing or dynamic vendor registration)
 *
 * @param domain - Domain to add
 */
export function addToAllowlist(domain: string): void {
  ALLOWED_DOMAINS.add(domain);
}

/**
 * Get current allowlist (for debugging)
 *
 * @returns Array of allowed domains
 */
export function getAllowlist(): string[] {
  return Array.from(ALLOWED_DOMAINS);
}
