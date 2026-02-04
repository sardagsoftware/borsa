/* global fetch */
/**
 * AILYDIAN Visitor Info API
 * IP Geolocation, VPN Detection, City Display
 *
 * @route GET /api/visitor/info
 * @version 1.0.0
 */

const geoip = require('geoip-lite');
const crypto = require('crypto');

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
 * Log visitor (async, non-blocking)
 */
function logVisitor(ip, geo, userAgent, referer, isVPN, page) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    type: isVPN ? 'VISITOR_VPN_DETECTED' : 'VISITOR_PAGE_ACCESS',
    ipHash: hashIP(ip),
    city: geo?.city || 'Unknown',
    region: geo?.region || '',
    country: geo?.country || 'Unknown',
    isVPN,
    userAgent: userAgent?.substring(0, 200) || 'Unknown',
    referer: referer?.substring(0, 200) || 'Direct',
    page: page || 'unknown',
  };

  // Log to console (captured by Vercel)
  console.log('[VISITOR_LOG]', JSON.stringify(logEntry));
}

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store, max-age=0');

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

    // Clean IP (remove IPv6 prefix if present)
    const cleanIP = clientIP.replace(/^::ffff:/, '');

    // Get geolocation
    const geo = geoip.lookup(cleanIP);

    // Detect VPN
    const vpnResult = detectVPN(cleanIP, geo);
    const isVPN = vpnResult.isVPN;

    // Check if blocking is enabled
    const blockVPN = process.env.BLOCK_VPN === 'true';
    const isBlocked = isVPN && blockVPN;

    // Get page from referer
    const referer = req.headers.referer || '';
    let page = 'unknown';
    if (referer.includes('chat.html')) page = 'chat';
    if (referer.includes('lydian-iq.html')) page = 'lydian-iq';

    // Log visitor
    logVisitor(cleanIP, geo, req.headers['user-agent'], referer, isVPN, page);

    // Return response
    return res.status(200).json({
      success: true,
      data: {
        ip: maskIP(cleanIP),
        city: geo?.city || 'Unknown',
        region: geo?.region || '',
        country: geo?.country || 'Unknown',
        countryName: COUNTRY_NAMES[geo?.country] || geo?.country || 'Unknown',
        timezone: geo?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        isVPN,
        vpnReason: vpnResult.reason,
        isBlocked,
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
        isVPN: false,
        vpnReason: null,
        isBlocked: false,
      },
      error: 'Location detection failed',
      timestamp: new Date().toISOString(),
    });
  }
};
