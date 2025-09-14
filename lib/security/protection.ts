/**
 * 🛡️ AILYDIAN TRADER - ADVANCED PROTECTION SYSTEM
 * Enterprise-grade code protection and anti-piracy measures
 * © 2025 Emrah Şardağ. All rights reserved.
 * 
 * ⚠️ WARNING: This protection system is legally binding
 * Unauthorized bypass attempts constitute copyright infringement
 */

'use client';

import { useEffect, useState } from 'react';

// 🔒 Advanced Protection Configuration
const PROTECTION_CONFIG = {
  // Anti-debugging measures
  debuggerDetection: true,
  devToolsBlocking: true,
  sourceProtection: true,
  
  // Network monitoring
  downloadTracking: true,
  apiCallLogging: true,
  suspiciousActivityDetection: true,
  
  // Legal enforcement
  copyrightNotices: true,
  dmcaProtection: true,
  usageTracking: true,
  
  // Environment validation
  domainValidation: true,
  hostingValidation: true,
  licenseValidation: true
} as const;

// 🚨 Security Violation Types
enum ViolationType {
  UNAUTHORIZED_DOWNLOAD = 'UNAUTHORIZED_DOWNLOAD',
  DEBUGGER_DETECTED = 'DEBUGGER_DETECTED',
  SOURCE_EXTRACTION = 'SOURCE_EXTRACTION',
  DOMAIN_VIOLATION = 'DOMAIN_VIOLATION',
  LICENSE_VIOLATION = 'LICENSE_VIOLATION',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY'
}

// 📊 Security Event Interface
interface SecurityEvent {
  type: ViolationType;
  timestamp: Date;
  userAgent: string;
  ipAddress?: string;
  location?: GeolocationPosition;
  details: Record<string, any>;
}

// 🔐 Protection Class
class AiLydianProtection {
  private static instance: AiLydianProtection;
  private securityEvents: SecurityEvent[] = [];
  private isProtectionActive = false;
  private originalConsole: Console;
  
  constructor() {
    this.originalConsole = { ...console };
    this.initializeProtection();
  }
  
  static getInstance(): AiLydianProtection {
    if (!AiLydianProtection.instance) {
      AiLydianProtection.instance = new AiLydianProtection();
    }
    return AiLydianProtection.instance;
  }
  
  private initializeProtection(): void {
    if (typeof window === 'undefined') return;
    
    this.isProtectionActive = true;
    
    // 🚫 1. Anti-Debugging Protection
    if (PROTECTION_CONFIG.debuggerDetection) {
      this.enableDebuggerDetection();
    }
    
    // 🚫 2. DevTools Blocking
    if (PROTECTION_CONFIG.devToolsBlocking) {
      this.blockDevTools();
    }
    
    // 🚫 3. Source Code Protection
    if (PROTECTION_CONFIG.sourceProtection) {
      this.protectSourceCode();
    }
    
    // 📡 4. Network Monitoring
    if (PROTECTION_CONFIG.downloadTracking) {
      this.monitorNetworkActivity();
    }
    
    // ⚖️ 5. Legal Notices
    if (PROTECTION_CONFIG.copyrightNotices) {
      this.displayCopyrightNotices();
    }
    
    // 🌍 6. Domain Validation
    if (PROTECTION_CONFIG.domainValidation) {
      this.validateDomain();
    }
    
    // 🔄 7. Continuous Monitoring
    this.startContinuousMonitoring();
  }
  
  // 🚫 Anti-Debugging Measures
  private enableDebuggerDetection(): void {
    // Debugger detection with evasion resistance
    const detectDebugger = () => {
      const start = performance.now();
      debugger; // This will pause if debugger is open
      const end = performance.now();
      
      if (end - start > 100) {
        this.reportViolation(ViolationType.DEBUGGER_DETECTED, {
          executionTime: end - start,
          message: 'Debugger detected - unauthorized code analysis attempt'
        });
      }
    };
    
    // Random interval checking
    setInterval(detectDebugger, Math.random() * 5000 + 1000);
    
    // Console manipulation detection
    let devtools = {
      open: false,
      orientation: null as string | null
    };
    
    const threshold = 160;
    
    setInterval(() => {
      if (window.outerHeight - window.innerHeight > threshold || 
          window.outerWidth - window.innerWidth > threshold) {
        if (!devtools.open) {
          devtools.open = true;
          this.reportViolation(ViolationType.DEBUGGER_DETECTED, {
            method: 'window_size_detection',
            message: 'Developer tools opened - unauthorized inspection attempt'
          });
        }
      } else {
        devtools.open = false;
      }
    }, 500);
  }
  
  // 🚫 DevTools Blocking
  private blockDevTools(): void {
    // Disable right-click context menu
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      this.reportViolation(ViolationType.SUSPICIOUS_ACTIVITY, {
        action: 'right_click_blocked',
        element: e.target
      });
      return false;
    });
    
    // Disable common developer shortcuts
    document.addEventListener('keydown', (e) => {
      // F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U, Ctrl+Shift+C
      if (e.key === 'F12' || 
          (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
          (e.ctrlKey && e.key === 'U')) {
        e.preventDefault();
        e.stopPropagation();
        this.reportViolation(ViolationType.SUSPICIOUS_ACTIVITY, {
          action: 'developer_shortcut_blocked',
          key: e.key,
          ctrlKey: e.ctrlKey,
          shiftKey: e.shiftKey
        });
        return false;
      }
    });
    
    // Console hijacking
    if (typeof window !== 'undefined') {
      ['log', 'debug', 'info', 'warn', 'error'].forEach(method => {
        (console as any)[method] = () => {
          this.reportViolation(ViolationType.SUSPICIOUS_ACTIVITY, {
            action: 'console_access_attempt',
            method: method
          });
        };
      });
    }
  }
  
  // 🔒 Source Code Protection
  private protectSourceCode(): void {
    // Disable text selection
    document.onselectstart = () => false;
    document.ondragstart = () => false;
    
    // CSS injection for additional protection
    const style = document.createElement('style');
    style.textContent = `
      * {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
        -webkit-touch-callout: none !important;
        -webkit-tap-highlight-color: transparent !important;
      }
      
      /* Hide source in devtools */
      body::before {
        content: "© 2025 Emrah Şardağ - AiLydian Trader. Unauthorized access prohibited.";
        position: fixed;
        top: -9999px;
        left: -9999px;
        opacity: 0;
        pointer-events: none;
      }
    `;
    document.head.appendChild(style);
    
    // Obfuscate DOM structure
    this.obfuscateDOM();
  }
  
  // 🌐 Network Activity Monitoring
  private monitorNetworkActivity(): void {
    // Override fetch to monitor API calls
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      this.logNetworkActivity('fetch', args[0]);
      return originalFetch.apply(window, args);
    };
    
    // Monitor XMLHttpRequest
    if (typeof XMLHttpRequest !== 'undefined') {
      const originalOpen = XMLHttpRequest.prototype.open;
      XMLHttpRequest.prototype.open = function(method: string, url: string | URL, async: boolean = true, user?: string | null, password?: string | null) {
        AiLydianProtection.getInstance().logNetworkActivity('xhr', url);
        return originalOpen.call(this, method, url, async, user ?? undefined, password ?? undefined);
      };
    }
    
    // Monitor potential download attempts
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'A' && target.getAttribute('download')) {
        this.reportViolation(ViolationType.UNAUTHORIZED_DOWNLOAD, {
          action: 'download_attempt',
          href: target.getAttribute('href'),
          download: target.getAttribute('download')
        });
        e.preventDefault();
        return false;
      }
    });
  }
  
  // ⚖️ Copyright Notices
  private displayCopyrightNotices(): void {
    // Console copyright notice
    console.clear();
    console.log('%c🛡️ AILYDIAN TRADER - PROTECTED SOFTWARE', 'color: #ff6b6b; font-size: 18px; font-weight: bold;');
    console.log('%c© 2025 Emrah Şardağ. All rights reserved.', 'color: #4ecdc4; font-size: 14px;');
    console.log('%c⚠️  UNAUTHORIZED ACCESS PROHIBITED', 'color: #ffe66d; font-size: 12px;');
    console.log('%c🚨 This software is protected by international copyright law.', 'color: #ff8b94; font-size: 11px;');
    console.log('%cℹ️  For licensing inquiries: licensing@ailydian.com', 'color: #95e1d3; font-size: 10px;');
    
    // Document title protection
    let originalTitle = document.title;
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        document.title = '🛡️ AiLydian Trader - Protected © Emrah Şardağ';
      } else {
        document.title = originalTitle;
      }
    });
    
    // Watermark injection
    this.injectWatermark();
  }
  
  // 🌍 Domain Validation
  private validateDomain(): void {
    const allowedDomains = [
      'ailydian.com',
      'www.ailydian.com',
      'app.ailydian.com',
      'demo.ailydian.com',
      'localhost',
      '127.0.0.1'
    ];
    
    const currentDomain = window.location.hostname;
    
    if (!allowedDomains.includes(currentDomain)) {
      this.reportViolation(ViolationType.DOMAIN_VIOLATION, {
        unauthorized_domain: currentDomain,
        allowed_domains: allowedDomains,
        message: 'Application running on unauthorized domain'
      });
      
      // Redirect to official site
      setTimeout(() => {
        window.location.href = 'https://ailydian.com/unauthorized-access';
      }, 3000);
    }
  }
  
  // 🔄 Continuous Monitoring
  private startContinuousMonitoring(): void {
    // Performance monitoring for unusual activity
    let performanceBaseline = performance.now();
    
    setInterval(() => {
      const currentTime = performance.now();
      const timeDiff = currentTime - performanceBaseline;
      
      // Detect if execution is being slowed down (debugging)
      if (timeDiff > 10000) { // 10 seconds
        this.reportViolation(ViolationType.SUSPICIOUS_ACTIVITY, {
          action: 'execution_delay_detected',
          time_difference: timeDiff,
          message: 'Unusual execution delays detected - possible debugging'
        });
      }
      
      performanceBaseline = currentTime;
    }, 5000);
    
    // Memory usage monitoring
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        if (memory.usedJSHeapSize > memory.jsHeapSizeLimit * 0.9) {
          this.reportViolation(ViolationType.SUSPICIOUS_ACTIVITY, {
            action: 'high_memory_usage',
            used: memory.usedJSHeapSize,
            limit: memory.jsHeapSizeLimit
          });
        }
      }, 30000);
    }
  }
  
  // 📊 Security Event Logging
  private reportViolation(type: ViolationType, details: Record<string, any>): void {
    const event: SecurityEvent = {
      type,
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      details: {
        ...details,
        url: window.location.href,
        referrer: document.referrer,
        screenResolution: `${screen.width}x${screen.height}`,
        colorDepth: screen.colorDepth,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    };
    
    this.securityEvents.push(event);
    
    // Send to security monitoring endpoint
    this.sendSecurityAlert(event);
    
    // Local storage for persistence
    const storedEvents = JSON.parse(localStorage.getItem('ailydian_security_events') || '[]');
    storedEvents.push(event);
    localStorage.setItem('ailydian_security_events', JSON.stringify(storedEvents.slice(-50))); // Keep last 50
  }
  
  // 📡 Send Security Alert
  private async sendSecurityAlert(event: SecurityEvent): Promise<void> {
    try {
      await fetch('/api/security/alert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Security-Token': this.generateSecurityToken()
        },
        body: JSON.stringify(event)
      });
    } catch (error) {
      console.error('Failed to send security alert:', error);
    }
  }
  
  // 🔑 Generate Security Token
  private generateSecurityToken(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    return btoa(`ailydian:${timestamp}:${random}`);
  }
  
  // 💧 Watermark Injection
  private injectWatermark(): void {
    const watermark = document.createElement('div');
    watermark.innerHTML = '© 2025 Emrah Şardağ - AiLydian Trader';
    watermark.style.cssText = `
      position: fixed;
      bottom: 5px;
      right: 5px;
      font-size: 8px;
      color: rgba(255,255,255,0.1);
      z-index: 9999;
      pointer-events: none;
      user-select: none;
      font-family: monospace;
    `;
    document.body.appendChild(watermark);
  }
  
  // 🔧 DOM Obfuscation
  private obfuscateDOM(): void {
    // Add fake elements to confuse scrapers
    const fakeElements = [
      { tag: 'script', content: '// Fake analytics code - AiLydian Protection' },
      { tag: 'meta', attrs: { name: 'robots', content: 'noindex,nofollow,noarchive,nosnippet,noimageindex' } },
      { tag: 'meta', attrs: { name: 'copyright', content: '© 2025 Emrah Şardağ. All rights reserved.' } }
    ];
    
    fakeElements.forEach(({ tag, content, attrs }) => {
      const element = document.createElement(tag);
      if (content) element.textContent = content;
      if (attrs) {
        Object.entries(attrs).forEach(([key, value]) => {
          element.setAttribute(key, value);
        });
      }
      document.head.appendChild(element);
    });
  }
  
  // 📋 Network Activity Logger
  private logNetworkActivity(type: string, url: any): void {
    // Log for suspicious pattern detection
    const logEntry = {
      type,
      url: typeof url === 'string' ? url : url?.toString(),
      timestamp: new Date(),
      userAgent: navigator.userAgent
    };
    
    // Check for suspicious patterns
    const suspiciousPatterns = [
      /download/i,
      /export/i,
      /backup/i,
      /clone/i,
      /dump/i
    ];
    
    if (suspiciousPatterns.some(pattern => pattern.test(logEntry.url || ''))) {
      this.reportViolation(ViolationType.SUSPICIOUS_ACTIVITY, {
        action: 'suspicious_network_request',
        ...logEntry
      });
    }
  }
  
  // 📊 Get Security Report
  public getSecurityReport(): {
    events: SecurityEvent[];
    isProtected: boolean;
    timestamp: Date;
  } {
    return {
      events: this.securityEvents,
      isProtected: this.isProtectionActive,
      timestamp: new Date()
    };
  }
}

// 🚀 Auto-initialize protection
if (typeof window !== 'undefined') {
  const protection = AiLydianProtection.getInstance();
  
  // Make protection instance globally accessible (for debugging purposes only)
  (window as any).__AILYDIAN_PROTECTION__ = protection;
}

// 🔒 React Hook for Protection Status
export function useAiLydianProtection() {
  const [isProtected, setIsProtected] = useState(false);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const protection = AiLydianProtection.getInstance();
      const report = protection.getSecurityReport();
      
      setIsProtected(report.isProtected);
      setSecurityEvents(report.events);
      
      // Update every 30 seconds
      const interval = setInterval(() => {
        const newReport = protection.getSecurityReport();
        setSecurityEvents(newReport.events);
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, []);
  
  return {
    isProtected,
    securityEvents,
    totalViolations: securityEvents.length,
    lastViolation: securityEvents[securityEvents.length - 1]
  };
}

export default AiLydianProtection;
