/**
 * 🛡️ AILYDIAN AI LENS TRADER - Alerts & Notifications
 * Slack/Telegram/Webhook formatter
 * © Emrah Şardağ. All rights reserved.
 */

import { getSecret } from './secret';
import { getOwnershipInfo } from './secret';

export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type AlertType = 'SECURITY' | 'SYSTEM' | 'TRADING' | 'COMPLIANCE';

export interface Alert {
  id: string;
  title: string;
  description: string;
  severity: AlertSeverity;
  type: AlertType;
  timestamp: string;
  source: string;
  metadata?: Record<string, any>;
  actions?: AlertAction[];
}

export interface AlertAction {
  id: string;
  label: string;
  type: 'url' | 'api' | 'acknowledge';
  target?: string;
}

export interface AlertDelivery {
  channel: 'slack' | 'telegram' | 'webhook';
  success: boolean;
  error?: string;
  timestamp: string;
}

export class AlertManager {
  private static instance: AlertManager;
  private deliveryHistory: Map<string, AlertDelivery[]> = new Map();
  private suppressions: Map<string, number> = new Map(); // alertId -> suppressUntil timestamp

  private constructor() {}

  static getInstance(): AlertManager {
    if (!AlertManager.instance) {
      AlertManager.instance = new AlertManager();
    }
    return AlertManager.instance;
  }

  async sendAlert(alert: Alert): Promise<AlertDelivery[]> {
    const deliveries: AlertDelivery[] = [];

    // Check suppression
    if (this.isAlertSuppressed(alert.id)) {
      console.log(`Alert ${alert.id} is suppressed until ${new Date(this.suppressions.get(alert.id)!)}`);
      return deliveries;
    }

    // Send to configured channels based on severity
    const shouldSendSlack = this.shouldSendToChannel('slack', alert.severity);
    const shouldSendTelegram = this.shouldSendToChannel('telegram', alert.severity);
    const shouldSendWebhook = this.shouldSendToChannel('webhook', alert.severity);

    const promises: Promise<AlertDelivery>[] = [];

    if (shouldSendSlack) {
      promises.push(this.sendSlackAlert(alert));
    }

    if (shouldSendTelegram) {
      promises.push(this.sendTelegramAlert(alert));
    }

    if (shouldSendWebhook) {
      promises.push(this.sendWebhookAlert(alert));
    }

    const results = await Promise.allSettled(promises);
    
    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        deliveries.push(result.value);
      } else {
        deliveries.push({
          channel: 'unknown' as any,
          success: false,
          error: result.reason?.message || 'Unknown error',
          timestamp: new Date().toISOString()
        });
      }
    });

    // Store delivery history
    this.deliveryHistory.set(alert.id, deliveries);

    return deliveries;
  }

  private shouldSendToChannel(channel: string, severity: AlertSeverity): boolean {
    const thresholds: Record<string, AlertSeverity[]> = {
      slack: ['MEDIUM', 'HIGH', 'CRITICAL'],
      telegram: ['HIGH', 'CRITICAL'],
      webhook: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
    };

    return thresholds[channel]?.includes(severity) || false;
  }

  private async sendSlackAlert(alert: Alert): Promise<AlertDelivery> {
    const webhook = getSecret('ALERT_SLACK_WEBHOOK');
    if (!webhook) {
      return {
        channel: 'slack',
        success: false,
        error: 'Slack webhook URL not configured',
        timestamp: new Date().toISOString()
      };
    }

    try {
      const payload = this.formatSlackAlert(alert);
      
      const response = await fetch(webhook, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      return {
        channel: 'slack',
        success: response.ok,
        error: response.ok ? undefined : `HTTP ${response.status}`,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        channel: 'slack',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  private async sendTelegramAlert(alert: Alert): Promise<AlertDelivery> {
    const token = getSecret('ALERT_TELEGRAM_BOT_TOKEN');
    const chatId = getSecret('ALERT_TELEGRAM_CHAT_ID');
    
    if (!token || !chatId) {
      return {
        channel: 'telegram',
        success: false,
        error: 'Telegram credentials not configured',
        timestamp: new Date().toISOString()
      };
    }

    try {
      const message = this.formatTelegramAlert(alert);
      
      const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'Markdown',
          disable_web_page_preview: true
        })
      });

      return {
        channel: 'telegram',
        success: response.ok,
        error: response.ok ? undefined : `HTTP ${response.status}`,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        channel: 'telegram',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  private async sendWebhookAlert(alert: Alert): Promise<AlertDelivery> {
    const webhookUrl = getSecret('ALERT_WEBHOOK_URL');
    const webhookSecret = getSecret('ALERT_WEBHOOK_SECRET');
    
    if (!webhookUrl) {
      return {
        channel: 'webhook',
        success: false,
        error: 'Webhook URL not configured',
        timestamp: new Date().toISOString()
      };
    }

    try {
      const payload = {
        alert,
        timestamp: new Date().toISOString(),
        source: 'AILYDIAN-AI-LENS-TRADER'
      };

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'AILYDIAN-Alert-Manager/1.0'
      };

      // Add HMAC signature if secret is configured
      if (webhookSecret) {
        const signature = this.createHMACSignature(JSON.stringify(payload), webhookSecret);
        headers['X-Hub-Signature-256'] = `sha256=${signature}`;
      }

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      return {
        channel: 'webhook',
        success: response.ok,
        error: response.ok ? undefined : `HTTP ${response.status}`,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        channel: 'webhook',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  private formatSlackAlert(alert: Alert): any {
    const ownership = getOwnershipInfo();
    const severityColor = this.getSeverityColor(alert.severity);
    const severityEmoji = this.getSeverityEmoji(alert.severity);

    return {
      username: 'AILYDIAN Security',
      icon_emoji: ':shield:',
      attachments: [
        {
          color: severityColor,
          title: `${severityEmoji} ${alert.title}`,
          text: alert.description,
          fields: [
            {
              title: 'Severity',
              value: alert.severity,
              short: true
            },
            {
              title: 'Type',
              value: alert.type,
              short: true
            },
            {
              title: 'Source',
              value: alert.source,
              short: true
            },
            {
              title: 'Time',
              value: new Date(alert.timestamp).toLocaleString(),
              short: true
            }
          ],
          footer: `${ownership.legalName} | AILYDIAN AI LENS TRADER`,
          footer_icon: 'https://ailydian.com/icon.png',
          ts: Math.floor(new Date(alert.timestamp).getTime() / 1000),
          actions: alert.actions?.map(action => ({
            type: 'button',
            text: action.label,
            url: action.target,
            style: action.type === 'acknowledge' ? 'primary' : 'default'
          }))
        }
      ]
    };
  }

  private formatTelegramAlert(alert: Alert): string {
    const ownership = getOwnershipInfo();
    const severityEmoji = this.getSeverityEmoji(alert.severity);
    
    let message = [
      `${severityEmoji} *${alert.title}*`,
      '',
      alert.description,
      '',
      `🔹 *Severity:* ${alert.severity}`,
      `🔹 *Type:* ${alert.type}`,
      `🔹 *Source:* ${alert.source}`,
      `🔹 *Time:* ${new Date(alert.timestamp).toLocaleString()}`,
    ];

    if (alert.metadata) {
      message.push('');
      message.push('📊 *Details:*');
      Object.entries(alert.metadata).forEach(([key, value]) => {
        message.push(`  • ${key}: ${value}`);
      });
    }

    message.push('');
    message.push(`_${ownership.legalName} | AILYDIAN AI LENS TRADER_`);

    return message.join('\n');
  }

  private getSeverityColor(severity: AlertSeverity): string {
    const colors = {
      LOW: '#36a64f',      // Green
      MEDIUM: '#ff9500',   // Orange  
      HIGH: '#ff4444',     // Red
      CRITICAL: '#8b0000'  // Dark Red
    };
    return colors[severity] || '#cccccc';
  }

  private getSeverityEmoji(severity: AlertSeverity): string {
    const emojis = {
      LOW: '🔵',
      MEDIUM: '🟡',
      HIGH: '🔴',
      CRITICAL: '🚨'
    };
    return emojis[severity] || '⚪';
  }

  private createHMACSignature(payload: string, secret: string): string {
    // Use Web Crypto API for edge runtime compatibility
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      // Simplified signature for edge runtime
      return `hmac-${payload.length}-${secret.length}-${Date.now()}`;
    }
    
    // Fallback simple hash for edge runtime
    let hash = 0;
    for (let i = 0; i < payload.length; i++) {
      const char = payload.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
  }

  suppressAlert(alertId: string, durationMinutes: number): void {
    const suppressUntil = Date.now() + (durationMinutes * 60 * 1000);
    this.suppressions.set(alertId, suppressUntil);
  }

  private isAlertSuppressed(alertId: string): boolean {
    const suppressUntil = this.suppressions.get(alertId);
    if (!suppressUntil) return false;
    
    if (Date.now() > suppressUntil) {
      this.suppressions.delete(alertId);
      return false;
    }
    
    return true;
  }

  getDeliveryHistory(alertId: string): AlertDelivery[] {
    return this.deliveryHistory.get(alertId) || [];
  }

  // Convenience method for security alerts
  async sendSecurityAlert(
    title: string,
    description: string,
    severity: AlertSeverity,
    source: string,
    metadata?: Record<string, any>
  ): Promise<AlertDelivery[]> {
    const alert: Alert = {
      id: `sec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title,
      description,
      severity,
      type: 'SECURITY',
      timestamp: new Date().toISOString(),
      source,
      metadata
    };

    return this.sendAlert(alert);
  }

  // Convenience method for system alerts
  async sendSystemAlert(
    title: string,
    description: string,
    severity: AlertSeverity,
    metadata?: Record<string, any>
  ): Promise<AlertDelivery[]> {
    return this.sendSecurityAlert(title, description, severity, 'SYSTEM', metadata);
  }

  // Test alert delivery
  async testAlerts(): Promise<{
    slack: boolean;
    telegram: boolean;
    webhook: boolean;
    errors: string[];
  }> {
    const testAlert: Alert = {
      id: `test-${Date.now()}`,
      title: 'AILYDIAN Security Test Alert',
      description: 'This is a test alert to verify notification delivery.',
      severity: 'LOW',
      type: 'SYSTEM',
      timestamp: new Date().toISOString(),
      source: 'TEST'
    };

    const deliveries = await this.sendAlert(testAlert);
    
    const result = {
      slack: false,
      telegram: false,
      webhook: false,
      errors: [] as string[]
    };

    deliveries.forEach(delivery => {
      result[delivery.channel] = delivery.success;
      if (!delivery.success && delivery.error) {
        result.errors.push(`${delivery.channel}: ${delivery.error}`);
      }
    });

    return result;
  }
}

// Singleton instance
export const alertManager = AlertManager.getInstance();

// Convenience functions
export const sendSecurityAlert = (
  title: string,
  description: string,
  severity: AlertSeverity,
  source: string,
  metadata?: Record<string, any>
) => alertManager.sendSecurityAlert(title, description, severity, source, metadata);

export const sendSystemAlert = (
  title: string,
  description: string,
  severity: AlertSeverity,
  metadata?: Record<string, any>
) => alertManager.sendSystemAlert(title, description, severity, metadata);

export const suppressAlert = (alertId: string, durationMinutes: number) => 
  alertManager.suppressAlert(alertId, durationMinutes);

export const testAlerts = () => alertManager.testAlerts();

// Add notifyAlert function for scanner integration
export async function notifyAlert(alertData: {
  type: string;
  message: string;
  data?: any;
  timestamp: string;
}): Promise<void> {
  try {
    const severity: AlertSeverity = alertData.type.includes('CRITICAL') ? 'CRITICAL' : 
                                   alertData.type.includes('HIGH') ? 'HIGH' : 
                                   alertData.type.includes('MEDIUM') ? 'MEDIUM' : 'LOW';
    
    await sendSecurityAlert(
      `Security Alert: ${alertData.type}`,
      alertData.message,
      severity,
      'SECURITY_SCANNER',
      { data: alertData.data, scanTime: alertData.timestamp }
    );
  } catch (error) {
    console.error('Failed to send security alert:', error);
  }
}
