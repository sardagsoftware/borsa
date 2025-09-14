// Security & Authentication Services
import CryptoJS from 'crypto-js';
import jwt from 'jsonwebtoken';

export interface SecuritySettings {
  maxDailyLoss: number;
  maxSingleTradeRisk: number;
  enableTwoFactor: boolean;
  enableLiveTrading: boolean;
  apiKeyEncrypted: boolean;
  sessionTimeout: number;
  ipWhitelist: string[];
}

export interface AuthUser {
  id: string;
  email: string;
  role: 'admin' | 'trader' | 'viewer';
  permissions: string[];
  securityLevel: 'low' | 'medium' | 'high';
}

export class SecurityService {
  private static instance: SecurityService;
  private settings: SecuritySettings;
  private currentUser: AuthUser | null = null;

  private constructor() {
    this.settings = {
      maxDailyLoss: parseFloat(process.env.MAX_DAILY_LOSS_USD || '500'),
      maxSingleTradeRisk: parseFloat(process.env.MAX_SINGLE_TRADE_RISK_PCT || '1.0'),
      enableTwoFactor: process.env.ENABLE_TWO_FACTOR === 'true',
      enableLiveTrading: process.env.REQUIRE_OPTIN_FOR_LIVE !== 'true',
      apiKeyEncrypted: true,
      sessionTimeout: 3600000, // 1 hour
      ipWhitelist: [],
    };
  }

  public static getInstance(): SecurityService {
    if (!SecurityService.instance) {
      SecurityService.instance = new SecurityService();
    }
    return SecurityService.instance;
  }

  // API Key Encryption
  encryptApiKey(apiKey: string, secret: string): string {
    const encrypted = CryptoJS.AES.encrypt(apiKey, secret).toString();
    return encrypted;
  }

  decryptApiKey(encryptedKey: string, secret: string): string {
    const bytes = CryptoJS.AES.decrypt(encryptedKey, secret);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  // JWT Token Management
  generateJWT(user: AuthUser): string {
    const secret = process.env.JWT_SECRET || 'ailydian-trader-secret';
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        securityLevel: user.securityLevel,
      },
      secret,
      { expiresIn: '1h' }
    );
  }

  verifyJWT(token: string): AuthUser | null {
    try {
      const secret = process.env.JWT_SECRET || 'ailydian-trader-secret';
      const decoded = jwt.verify(token, secret) as any;
      return {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
        permissions: decoded.permissions,
        securityLevel: decoded.securityLevel,
      };
    } catch (error) {
      return null;
    }
  }

  // Permission Checks
  hasPermission(user: AuthUser, permission: string): boolean {
    if (user.role === 'admin') return true;
    return user.permissions.includes(permission);
  }

  // Trade Security Validation
  validateTradeRequest(trade: any, user: AuthUser): { 
    allowed: boolean; 
    reason?: string;
    requiresTwoFactor?: boolean; 
  } {
    // Kill switch check
    if (process.env.GLOBAL_KILL_SWITCH === 'true') {
      return { allowed: false, reason: 'Global kill switch is active' };
    }

    // Live trading permission
    if (trade.isLive && !this.hasPermission(user, 'live_trading')) {
      return { allowed: false, reason: 'Live trading not authorized for this user' };
    }

    // Risk limits
    const tradeValue = Math.abs(trade.price * trade.quantity);
    if (tradeValue > this.settings.maxSingleTradeRisk * 1000) {
      return { 
        allowed: false, 
        reason: `Trade exceeds max risk limit of ${this.settings.maxSingleTradeRisk}%` 
      };
    }

    // High-value trades require 2FA
    if (tradeValue > 1000 && this.settings.enableTwoFactor) {
      return { 
        allowed: true, 
        requiresTwoFactor: true 
      };
    }

    return { allowed: true };
  }

  // IP Whitelist Check
  isIpAllowed(ip: string): boolean {
    if (this.settings.ipWhitelist.length === 0) return true;
    return this.settings.ipWhitelist.includes(ip);
  }

  // Session Management
  createSecureSession(user: AuthUser): {
    token: string;
    expiresAt: number;
    sessionId: string;
  } {
    const sessionId = CryptoJS.lib.WordArray.random(16).toString();
    const token = this.generateJWT(user);
    const expiresAt = Date.now() + this.settings.sessionTimeout;

    return {
      token,
      expiresAt,
      sessionId,
    };
  }

  // Audit Logging
  logSecurityEvent(event: {
    type: 'login' | 'trade' | 'api_access' | 'security_violation';
    user: string;
    details: any;
    ip?: string;
    timestamp?: number;
  }) {
    const logEntry = {
      ...event,
      timestamp: event.timestamp || Date.now(),
      severity: this.getEventSeverity(event.type),
    };

    console.log('🔒 SECURITY EVENT:', JSON.stringify(logEntry));
    
    // In production, send to security monitoring system
    // await this.sendToSecurityMonitoring(logEntry);
  }

  private getEventSeverity(type: string): 'low' | 'medium' | 'high' {
    switch (type) {
      case 'login':
        return 'low';
      case 'trade':
        return 'medium';
      case 'api_access':
        return 'medium';
      case 'security_violation':
        return 'high';
      default:
        return 'low';
    }
  }

  // Settings Management
  getSettings(): SecuritySettings {
    return { ...this.settings };
  }

  updateSettings(newSettings: Partial<SecuritySettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.logSecurityEvent({
      type: 'security_violation',
      user: this.currentUser?.id || 'system',
      details: { action: 'settings_updated', changes: newSettings },
    });
  }

  // Emergency Kill Switch
  activateKillSwitch(user: AuthUser, reason: string): void {
    process.env.GLOBAL_KILL_SWITCH = 'true';
    
    this.logSecurityEvent({
      type: 'security_violation',
      user: user.id,
      details: {
        action: 'kill_switch_activated',
        reason,
        timestamp: Date.now(),
      },
    });

    console.log('🛑 KILL SWITCH ACTIVATED BY:', user.email, 'REASON:', reason);
  }

  deactivateKillSwitch(user: AuthUser): void {
    if (user.role !== 'admin') {
      throw new Error('Only admins can deactivate kill switch');
    }
    
    process.env.GLOBAL_KILL_SWITCH = 'false';
    
    this.logSecurityEvent({
      type: 'security_violation',
      user: user.id,
      details: {
        action: 'kill_switch_deactivated',
        timestamp: Date.now(),
      },
    });
  }
}

// Compliance & Risk Guards
export class ComplianceService {
  // Regional compliance checks
  checkRegionalCompliance(user: AuthUser, trade: any): {
    allowed: boolean;
    restrictions?: string[];
  } {
    // Mock regional compliance - in real implementation, check user's region
    const userRegion: string = 'US'; // From user profile or IP geolocation
    
    const restrictions = [];
    
    switch (userRegion) {
      case 'US':
        if (trade.leverage > 50) {
          restrictions.push('Leverage limited to 50x for US users');
        }
        break;
      case 'EU':
        if (trade.leverage > 30) {
          restrictions.push('Leverage limited to 30x for EU users');
        }
        break;
      case 'UK':
        if (trade.leverage > 2) {
          restrictions.push('Leverage limited to 2x for UK users');
        }
        break;
    }
    
    return {
      allowed: restrictions.length === 0,
      restrictions,
    };
  }

  // KYC/AML checks
  checkKycStatus(user: AuthUser): {
    verified: boolean;
    level: 'basic' | 'intermediate' | 'advanced';
    limits: {
      daily: number;
      monthly: number;
    };
  } {
    // Mock KYC status
    return {
      verified: true,
      level: 'advanced',
      limits: {
        daily: 10000,
        monthly: 100000,
      },
    };
  }
}
