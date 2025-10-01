/**
 * 🛡️ SOC ROOM - Real-time Security Monitoring
 * 24/7 Threat Detection & Response System
 * borsa.ailydian.com - SARDAG PROTECTED
 */

// Attack pattern definitions
export const ATTACK_PATTERNS = {
  sqlInjection: [
    /(\%27)|(\')|(\-\-)|(\%23)|(#)/i,
    /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/i,
    /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i,
    /((\%27)|(\'))union/i,
    /exec(\s|\+)+(s|x)p\w+/i,
    /select.*from/i,
    /insert.*into/i,
    /delete.*from/i,
    /drop.*table/i
  ],
  xss: [
    /<script[^>]*>[\s\S]*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=\s*["'][^"']*["']/gi,
    /<iframe[^>]*>/gi,
    /onerror\s*=/gi,
    /<embed[^>]*>/gi,
    /<object[^>]*>/gi
  ],
  pathTraversal: [
    /\.\.\//g,
    /\.\.%2[fF]/g,
    /%2e%2e/gi,
    /etc\/passwd/gi,
    /\/\.env/gi,
    /\/\.git/gi,
    /\/\.ssh/gi
  ],
  commandInjection: [
    /[;&|`$]/,
    /\$\{.*\}/,
    /`.*`/,
    /\|\|/,
    /&&/,
    />\s*\/dev/gi,
    /\|\s*bash/gi
  ]
};

// Blocked user agents (security scanners/bots)
export const BLOCKED_USER_AGENTS = [
  'sqlmap',
  'nikto',
  'nmap',
  'masscan',
  'metasploit',
  'burp',
  'havij',
  'acunetix',
  'nessus',
  'openvas',
  'w3af',
  'hydra',
  'dirbuster',
  'wpscan',
  'skipfish'
];

// In-memory threat tracking (use Redis in production)
const threatLog = new Map<string, {
  count: number;
  firstSeen: number;
  lastSeen: number;
  banned: boolean;
  threats: string[];
}>();

const requestLog = new Map<string, {
  count: number;
  timestamp: number;
}>();

export interface SecurityEvent {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  ip: string;
  url: string;
  userAgent: string;
  timestamp: string;
  threat?: string;
  pattern?: string;
  action: string;
  incidentId?: string;
}

/**
 * Detect threats in request
 */
export function detectThreats(url: string, userAgent: string): {
  threat: boolean;
  type?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  pattern?: string;
} {
  // Check User-Agent blacklist
  for (const blocked of BLOCKED_USER_AGENTS) {
    if (userAgent.toLowerCase().includes(blocked.toLowerCase())) {
      return {
        threat: true,
        type: 'blocked-user-agent',
        severity: 'critical',
        pattern: blocked
      };
    }
  }

  // Check SQL Injection
  for (const pattern of ATTACK_PATTERNS.sqlInjection) {
    if (pattern.test(url)) {
      return {
        threat: true,
        type: 'sql-injection',
        severity: 'critical',
        pattern: pattern.toString()
      };
    }
  }

  // Check XSS
  for (const pattern of ATTACK_PATTERNS.xss) {
    if (pattern.test(url)) {
      return {
        threat: true,
        type: 'xss-attack',
        severity: 'critical',
        pattern: pattern.toString()
      };
    }
  }

  // Check Path Traversal
  for (const pattern of ATTACK_PATTERNS.pathTraversal) {
    if (pattern.test(url)) {
      return {
        threat: true,
        type: 'path-traversal',
        severity: 'high',
        pattern: pattern.toString()
      };
    }
  }

  // Check Command Injection
  for (const pattern of ATTACK_PATTERNS.commandInjection) {
    if (pattern.test(url)) {
      return {
        threat: true,
        type: 'command-injection',
        severity: 'critical',
        pattern: pattern.toString()
      };
    }
  }

  return { threat: false };
}

/**
 * Check rate limiting
 */
export function checkRateLimit(ip: string, maxRequestsPerMinute: number = 100): boolean {
  const now = Date.now();
  const key = `${ip}`;

  const record = requestLog.get(key);

  if (!record || (now - record.timestamp) > 60000) {
    // Reset if more than 1 minute passed
    requestLog.set(key, { count: 1, timestamp: now });
    return true;
  }

  if (record.count >= maxRequestsPerMinute) {
    return false; // Rate limit exceeded
  }

  record.count++;
  return true;
}

/**
 * Ban IP address
 */
export function banIP(ip: string, reason: string): void {
  const record = threatLog.get(ip) || {
    count: 0,
    firstSeen: Date.now(),
    lastSeen: Date.now(),
    banned: false,
    threats: []
  };

  record.banned = true;
  record.lastSeen = Date.now();
  record.threats.push(reason);

  threatLog.set(ip, record);

  logSecurityEvent({
    type: 'IP-BANNED',
    severity: 'critical',
    ip,
    url: 'N/A',
    userAgent: 'N/A',
    timestamp: new Date().toISOString(),
    threat: reason,
    action: 'PERMANENT BAN',
    incidentId: `SOC-BAN-${Date.now()}-${ip.replace(/\./g, '')}`
  });
}

/**
 * Check if IP is banned
 */
export function isIPBanned(ip: string): boolean {
  const record = threatLog.get(ip);
  return record?.banned || false;
}

/**
 * Log security event
 */
export function logSecurityEvent(event: SecurityEvent): void {
  const timestamp = new Date().toISOString();

  // Console logging with formatting
  console.log(`
🚨 SECURITY EVENT DETECTED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⏰ Time: ${timestamp}
🎯 Type: ${event.type}
⚠️  Severity: ${event.severity?.toUpperCase()}
🌐 IP: ${event.ip}
📍 URL: ${event.url}
🔍 User-Agent: ${event.userAgent}
${event.threat ? `⚠️  Threat: ${event.threat}` : ''}
${event.pattern ? `🔎 Pattern: ${event.pattern}` : ''}
${event.incidentId ? `🆔 Incident: ${event.incidentId}` : ''}
🛡️  Action: ${event.action}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `.trim());

  // TODO: In production, also log to:
  // - Database
  // - SIEM system
  // - Alert notification system
}

/**
 * Get threat statistics
 */
export function getThreatStats(): {
  totalThreats: number;
  bannedIPs: number;
  activeThreats: number;
} {
  let bannedCount = 0;
  let totalThreats = 0;

  for (const [, record] of threatLog) {
    if (record.banned) bannedCount++;
    totalThreats += record.count;
  }

  return {
    totalThreats,
    bannedIPs: bannedCount,
    activeThreats: threatLog.size
  };
}

/**
 * Clear old threat logs (cleanup)
 */
export function cleanupOldLogs(maxAgeMs: number = 24 * 60 * 60 * 1000): void {
  const now = Date.now();

  for (const [ip, record] of threatLog) {
    if (!record.banned && (now - record.lastSeen) > maxAgeMs) {
      threatLog.delete(ip);
    }
  }

  for (const [ip, record] of requestLog) {
    if ((now - record.timestamp) > maxAgeMs) {
      requestLog.delete(ip);
    }
  }
}

// Run cleanup every hour
setInterval(() => cleanupOldLogs(), 60 * 60 * 1000);
