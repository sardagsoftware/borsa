/* global fetch */
/**
 * AILYDIAN Visitor Info API
 * IP Geolocation, VPN Detection, Device Detection, Security
 *
 * @route GET /api/visitor/info
 * @version 2.0.0
 */

const geoip = require('geoip-lite');
const crypto = require('crypto');

// ============================================================
// 🛡️ SECURITY: Rate Limiting (in-memory for serverless)
// ============================================================
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 30; // max requests per window

function checkRateLimit(ip) {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now - record.timestamp > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { timestamp: now, count: 1 });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1 };
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0 };
  }

  record.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX - record.count };
}

// ============================================================
// 📱 DEVICE DETECTION
// ============================================================
function detectDevice(userAgent) {
  if (!userAgent) {
    return { type: 'unknown', os: 'unknown', browser: 'unknown', isMobile: false, isBot: false };
  }

  const ua = userAgent.toLowerCase();

  // Bot detection
  const botPatterns = [
    'bot',
    'crawler',
    'spider',
    'scraper',
    'curl',
    'wget',
    'python',
    'java/',
    'httpclient',
    'okhttp',
    'axios',
    'node-fetch',
    'go-http',
    'headless',
    'phantom',
    'selenium',
    'puppeteer',
    'playwright',
    'googlebot',
    'bingbot',
    'yandex',
    'baiduspider',
    'facebookexternalhit',
  ];
  const isBot = botPatterns.some(pattern => ua.includes(pattern));

  // Device type detection
  let type = 'desktop';
  let isMobile = false;

  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(userAgent)) {
    type = 'tablet';
    isMobile = true;
  } else if (
    /mobile|iphone|ipod|android.*mobile|windows phone|blackberry|bb10|mini|webos|opera mini|opera mobi/i.test(
      userAgent
    )
  ) {
    type = 'mobile';
    isMobile = true;
  } else if (/smart-?tv|googletv|appletv|hbbtv|pov_tv|netcast.tv/i.test(userAgent)) {
    type = 'smart-tv';
  } else if (/xbox|playstation|nintendo/i.test(userAgent)) {
    type = 'game-console';
  }

  // OS detection
  let os = 'unknown';
  if (/windows nt 10/i.test(userAgent)) os = 'Windows 10/11';
  else if (/windows nt 6.3/i.test(userAgent)) os = 'Windows 8.1';
  else if (/windows nt 6.2/i.test(userAgent)) os = 'Windows 8';
  else if (/windows nt 6.1/i.test(userAgent)) os = 'Windows 7';
  else if (/windows/i.test(userAgent)) os = 'Windows';
  else if (/macintosh|mac os x/i.test(userAgent)) os = 'macOS';
  else if (/iphone|ipad|ipod/i.test(userAgent)) os = 'iOS';
  else if (/android/i.test(userAgent)) os = 'Android';
  else if (/linux/i.test(userAgent)) os = 'Linux';
  else if (/cros/i.test(userAgent)) os = 'Chrome OS';

  // Browser detection
  let browser = 'unknown';
  if (/edg\//i.test(userAgent)) browser = 'Edge';
  else if (/opr\//i.test(userAgent) || /opera/i.test(userAgent)) browser = 'Opera';
  else if (/chrome/i.test(userAgent) && !/chromium/i.test(userAgent)) browser = 'Chrome';
  else if (/firefox/i.test(userAgent)) browser = 'Firefox';
  else if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) browser = 'Safari';
  else if (/msie|trident/i.test(userAgent)) browser = 'IE';

  return { type, os, browser, isMobile, isBot };
}

// ============================================================
// 🔒 SECURITY: Suspicious Activity Detection
// ============================================================
function detectSuspiciousActivity(req, device) {
  const threats = [];
  const userAgent = req.headers['user-agent'] || '';

  // 1. Bot detection
  if (device.isBot) {
    threats.push('bot_detected');
  }

  // 2. Missing or suspicious headers
  if (!userAgent || userAgent.length < 10) {
    threats.push('missing_user_agent');
  }

  // 3. SQL injection patterns in headers
  const sqlPatterns =
    /('|"|;|--|\||\bor\b|\band\b|\bunion\b|\bselect\b|\bdrop\b|\binsert\b|\bdelete\b)/i;
  const headersToCheck = ['referer', 'user-agent', 'cookie'];
  for (const header of headersToCheck) {
    if (req.headers[header] && sqlPatterns.test(req.headers[header])) {
      threats.push('sql_injection_attempt');
      break;
    }
  }

  // 4. XSS patterns
  const xssPatterns = /(<script|javascript:|on\w+\s*=|<img[^>]+onerror)/i;
  for (const header of headersToCheck) {
    if (req.headers[header] && xssPatterns.test(req.headers[header])) {
      threats.push('xss_attempt');
      break;
    }
  }

  // 5. Path traversal attempts
  if (req.url && /(\.\.|%2e%2e|%252e)/i.test(req.url)) {
    threats.push('path_traversal_attempt');
  }

  return {
    isSuspicious: threats.length > 0,
    threats,
    riskScore: Math.min(threats.length * 25, 100),
  };
}

// Datacenter/VPN IP ranges (CIDR notation)
const DATACENTER_RANGES = [
  // AWS
  { start: '3.0.0.0', end: '3.255.255.255' },
  { start: '13.0.0.0', end: '13.255.255.255' },
  { start: '18.0.0.0', end: '18.255.255.255' },
  { start: '35.0.0.0', end: '35.255.255.255' },
  { start: '52.0.0.0', end: '52.255.255.255' },
  { start: '54.0.0.0', end: '54.255.255.255' },
  // Google Cloud
  { start: '34.0.0.0', end: '34.255.255.255' },
  { start: '35.192.0.0', end: '35.207.255.255' },
  { start: '35.208.0.0', end: '35.223.255.255' },
  { start: '35.224.0.0', end: '35.239.255.255' },
  // Microsoft Azure
  { start: '13.64.0.0', end: '13.127.255.255' },
  { start: '40.74.0.0', end: '40.75.255.255' },
  { start: '40.76.0.0', end: '40.79.255.255' },
  { start: '40.112.0.0', end: '40.119.255.255' },
  // DigitalOcean
  { start: '104.131.0.0', end: '104.131.255.255' },
  { start: '104.236.0.0', end: '104.236.255.255' },
  { start: '138.68.0.0', end: '138.68.255.255' },
  { start: '159.203.0.0', end: '159.203.255.255' },
  // Linode
  { start: '45.56.0.0', end: '45.56.255.255' },
  { start: '45.79.0.0', end: '45.79.255.255' },
  { start: '50.116.0.0', end: '50.116.255.255' },
  { start: '69.164.0.0', end: '69.164.255.255' },
  // Vultr
  { start: '45.32.0.0', end: '45.32.255.255' },
  { start: '45.63.0.0', end: '45.63.255.255' },
  { start: '104.156.0.0', end: '104.156.255.255' },
  { start: '108.61.0.0', end: '108.61.255.255' },
  // OVH
  { start: '51.68.0.0', end: '51.68.255.255' },
  { start: '51.75.0.0', end: '51.75.255.255' },
  { start: '51.77.0.0', end: '51.77.255.255' },
  { start: '51.79.0.0', end: '51.79.255.255' },
  // Hetzner
  { start: '5.9.0.0', end: '5.9.255.255' },
  { start: '78.46.0.0', end: '78.46.255.255' },
  { start: '88.99.0.0', end: '88.99.255.255' },
  { start: '138.201.0.0', end: '138.201.255.255' },
];

// Country code to name mapping
const COUNTRY_NAMES = {
  TR: 'Turkiye',
  US: 'United States',
  GB: 'United Kingdom',
  DE: 'Germany',
  FR: 'France',
  NL: 'Netherlands',
  RU: 'Russia',
  CN: 'China',
  JP: 'Japan',
  KR: 'South Korea',
  IN: 'India',
  BR: 'Brazil',
  AU: 'Australia',
  CA: 'Canada',
  IT: 'Italy',
  ES: 'Spain',
  PL: 'Poland',
  UA: 'Ukraine',
  SE: 'Sweden',
  NO: 'Norway',
  FI: 'Finland',
  DK: 'Denmark',
  CH: 'Switzerland',
  AT: 'Austria',
  BE: 'Belgium',
  PT: 'Portugal',
  GR: 'Greece',
  CZ: 'Czech Republic',
  RO: 'Romania',
  HU: 'Hungary',
  IE: 'Ireland',
  IL: 'Israel',
  SA: 'Saudi Arabia',
  AE: 'United Arab Emirates',
  EG: 'Egypt',
  ZA: 'South Africa',
  MX: 'Mexico',
  AR: 'Argentina',
  CL: 'Chile',
  CO: 'Colombia',
  SG: 'Singapore',
  MY: 'Malaysia',
  TH: 'Thailand',
  VN: 'Vietnam',
  ID: 'Indonesia',
  PH: 'Philippines',
  NZ: 'New Zealand',
};

/**
 * Convert IP to numeric value for range comparison
 */
function ipToNumber(ip) {
  const parts = ip.split('.');
  if (parts.length !== 4) return 0;
  return parts.reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
}

/**
 * Check if IP is in datacenter range
 */
function isDatacenterIP(ip) {
  const ipNum = ipToNumber(ip);
  if (ipNum === 0) return false;

  for (const range of DATACENTER_RANGES) {
    const startNum = ipToNumber(range.start);
    const endNum = ipToNumber(range.end);
    if (ipNum >= startNum && ipNum <= endNum) {
      return true;
    }
  }
  return false;
}

/**
 * Detect VPN/Proxy usage
 */
function detectVPN(ip, geo) {
  // Signal 1: Datacenter IP range
  if (isDatacenterIP(ip)) {
    return { isVPN: true, reason: 'datacenter_ip' };
  }

  // Signal 2: No city data (common for VPNs)
  if (geo && !geo.city) {
    return { isVPN: true, reason: 'no_city_data' };
  }

  // Signal 3: Check for known VPN exit node patterns
  // (Missing region with country often indicates proxy)
  if (geo && geo.country && !geo.region && !geo.city) {
    return { isVPN: true, reason: 'incomplete_geo' };
  }

  return { isVPN: false, reason: null };
}

/**
 * Extract client IP from request
 */
function getClientIP(req) {
  // Vercel/Cloudflare headers
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  // Real IP header
  if (req.headers['x-real-ip']) {
    return req.headers['x-real-ip'];
  }

  // Vercel specific
  if (req.headers['x-vercel-forwarded-for']) {
    return req.headers['x-vercel-forwarded-for'].split(',')[0].trim();
  }

  // Direct connection
  return req.connection?.remoteAddress || req.socket?.remoteAddress || '127.0.0.1';
}

/**
 * Mask IP for privacy (show only first 3 octets)
 */
function maskIP(ip) {
  const parts = ip.split('.');
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.${parts[2]}.xxx`;
  }
  return 'xxx.xxx.xxx.xxx';
}

/**
 * Hash IP for logging (privacy-preserving)
 */
function hashIP(ip) {
  const salt = process.env.IP_HASH_SALT || 'LYDIAN_2026_SECURE';
  return crypto.createHash('sha256').update(`${ip}:${salt}`).digest('hex').substring(0, 16);
}

/**
 * Log visitor (async, non-blocking) - Enhanced with device & security info
 */
function logVisitor(ip, geo, userAgent, referer, isVPN, page, device, security) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    type: security?.isSuspicious
      ? 'VISITOR_SUSPICIOUS_ACTIVITY'
      : isVPN
        ? 'VISITOR_VPN_DETECTED'
        : 'VISITOR_PAGE_ACCESS',
    ipHash: hashIP(ip),
    city: geo?.city || 'Unknown',
    region: geo?.region || '',
    country: geo?.country || 'Unknown',
    isVPN,
    // Device info
    device: {
      type: device?.type || 'unknown',
      os: device?.os || 'unknown',
      browser: device?.browser || 'unknown',
      isMobile: device?.isMobile || false,
      isBot: device?.isBot || false,
    },
    // Security info
    security: {
      isSuspicious: security?.isSuspicious || false,
      threats: security?.threats || [],
      riskScore: security?.riskScore || 0,
    },
    userAgent: userAgent?.substring(0, 200) || 'Unknown',
    referer: referer?.substring(0, 200) || 'Direct',
    page: page || 'unknown',
  };

  // Log to console (captured by Vercel)
  console.log('[VISITOR_LOG]', JSON.stringify(logEntry));

  // If suspicious, log separately for security monitoring
  if (security?.isSuspicious) {
    console.warn(
      '[SECURITY_ALERT]',
      JSON.stringify({
        timestamp: logEntry.timestamp,
        ipHash: logEntry.ipHash,
        threats: security.threats,
        riskScore: security.riskScore,
        page,
      })
    );
  }
}

module.exports = async function handler(req, res) {
  // 🛡️ Security Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  try {
    // Extract client IP
    const clientIP = getClientIP(req);
    const cleanIP = clientIP.replace(/^::ffff:/, '');

    // 🛡️ Rate limiting check
    const rateLimit = checkRateLimit(cleanIP);
    res.setHeader('X-RateLimit-Remaining', rateLimit.remaining.toString());

    if (!rateLimit.allowed) {
      console.warn('[RATE_LIMIT]', {
        ipHash: hashIP(cleanIP),
        timestamp: new Date().toISOString(),
      });
      return res.status(429).json({
        success: false,
        error: 'Too many requests. Please try again later.',
        retryAfter: 60,
      });
    }

    // 📱 Device detection
    const userAgent = req.headers['user-agent'] || '';
    const device = detectDevice(userAgent);

    // 🔒 Security check
    const security = detectSuspiciousActivity(req, device);

    // 🌍 Geolocation
    const geo = geoip.lookup(cleanIP);

    // 🔍 VPN detection
    const vpnResult = detectVPN(cleanIP, geo);
    const isVPN = vpnResult.isVPN;

    // Check if blocking is enabled
    const blockVPN = process.env.BLOCK_VPN === 'true';
    const blockBots = process.env.BLOCK_BOTS === 'true';
    const blockSuspicious = process.env.BLOCK_SUSPICIOUS === 'true';

    // Determine if blocked
    let isBlocked = false;
    let blockReason = null;

    if (isVPN && blockVPN) {
      isBlocked = true;
      blockReason = 'vpn_detected';
    } else if (device.isBot && blockBots) {
      isBlocked = true;
      blockReason = 'bot_detected';
    } else if (security.isSuspicious && blockSuspicious && security.riskScore >= 50) {
      isBlocked = true;
      blockReason = 'suspicious_activity';
    }

    // Get page from referer
    const referer = req.headers.referer || '';
    let page = 'unknown';
    if (referer.includes('chat.html')) page = 'chat';
    if (referer.includes('lydian-iq.html')) page = 'lydian-iq';

    // 📝 Log visitor with all info
    logVisitor(cleanIP, geo, userAgent, referer, isVPN, page, device, security);

    // Return response
    return res.status(200).json({
      success: true,
      data: {
        // Location
        ip: maskIP(cleanIP),
        city: geo?.city || 'Unknown',
        region: geo?.region || '',
        country: geo?.country || 'Unknown',
        countryName: COUNTRY_NAMES[geo?.country] || geo?.country || 'Unknown',
        timezone: geo?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        // Device
        device: {
          type: device.type,
          os: device.os,
          browser: device.browser,
          isMobile: device.isMobile,
        },
        // Security
        isVPN,
        vpnReason: vpnResult.reason,
        isBlocked,
        blockReason,
        securityScore: 100 - security.riskScore, // Higher is better
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[VISITOR_INFO_ERR]', error.message);

    return res.status(200).json({
      success: true,
      data: {
        ip: 'xxx.xxx.xxx.xxx',
        city: 'Unknown',
        region: '',
        country: 'Unknown',
        countryName: 'Unknown',
        timezone: 'UTC',
        device: { type: 'unknown', os: 'unknown', browser: 'unknown', isMobile: false },
        isVPN: false,
        vpnReason: null,
        isBlocked: false,
        blockReason: null,
        securityScore: 100,
      },
      error: 'Location detection failed',
      timestamp: new Date().toISOString(),
    });
  }
};
