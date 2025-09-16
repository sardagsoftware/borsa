import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

// Use existing prisma instance or create new one
const prisma = (globalThis as any).prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') (globalThis as any).prisma = prisma;

// Production-safe database connection wrapper
async function safeDbOperation<T>(operation: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    console.warn('Database operation failed, using fallback:', error);
    return fallback;
  }
}

interface AlertRule {
  id: string;
  name: string;
  ruleType: 'signal_threshold' | 'var_limit' | 'loss_cap' | 'breaker' | 'health_degraded';
  config: any;
  isActive: boolean;
  lastTriggered?: Date;
}

interface AlertContext {
  userId?: string;
  symbol?: string;
  exchange?: string;
  value: number;
  threshold?: number;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  data?: any;
}

interface NotificationChannel {
  type: 'slack' | 'telegram' | 'webhook';
  config: any;
  isActive: boolean;
}

export class AlertsEngine {
  private rules: Map<string, AlertRule> = new Map();
  private channels: NotificationChannel[] = [];
  private rateLimiter: Map<string, number> = new Map(); // Rule ID -> last trigger time

  constructor() {
    this.initializeChannels();
    this.loadAlertRules();
  }

  /**
   * Initialize notification channels from environment
   */
  private initializeChannels(): void {
    // Slack webhook
    if (process.env.ALERT_SLACK_WEBHOOK) {
      this.channels.push({
        type: 'slack',
        config: {
          webhook: process.env.ALERT_SLACK_WEBHOOK,
          channel: '#alerts',
          username: 'AI-LENS Trader'
        },
        isActive: true
      });
    }

    // Telegram bot
    if (process.env.ALERT_TELEGRAM_BOT_TOKEN && process.env.ALERT_TELEGRAM_CHAT_ID) {
      this.channels.push({
        type: 'telegram',
        config: {
          token: process.env.ALERT_TELEGRAM_BOT_TOKEN,
          chatId: process.env.ALERT_TELEGRAM_CHAT_ID
        },
        isActive: true
      });
    }

    // Generic webhook
    if (process.env.ALERT_WEBHOOK_URL) {
      this.channels.push({
        type: 'webhook',
        config: {
          url: process.env.ALERT_WEBHOOK_URL,
          secret: process.env.ALERT_WEBHOOK_SECRET
        },
        isActive: true
      });
    }
  }

  /**
   * Load alert rules from database
   */
  private async loadAlertRules(): Promise<void> {
    await safeDbOperation(
      async () => {
        const rules = await prisma.alertRule.findMany({
          where: { isActive: true }
        });

        for (const rule of rules) {
          this.rules.set(rule.id, {
            id: rule.id,
            name: rule.name,
            ruleType: rule.ruleType as any,
            config: rule.config,
            isActive: rule.isActive,
            lastTriggered: rule.lastTriggered || undefined
          });
        }

        console.log(`✅ Loaded ${rules.length} alert rules`);
        return true;
      },
      false // fallback: no rules loaded
    );
  }

  /**
   * Create new alert rule
   */
  async createAlertRule(
    userId: string,
    name: string,
    ruleType: AlertRule['ruleType'],
    config: any
  ): Promise<string> {
    const rule = await prisma.alertRule.create({
      data: {
        userId,
        name,
        ruleType,
        config,
        isActive: true
      }
    });

    this.rules.set(rule.id, {
      id: rule.id,
      name: rule.name,
      ruleType: rule.ruleType as any,
      config: rule.config,
      isActive: true
    });

    console.log(`➕ Created alert rule: ${name} (${ruleType})`);
    return rule.id;
  }

  /**
   * Check if alert should be triggered
   */
  async checkAlert(ruleId: string, context: AlertContext): Promise<boolean> {
    const rule = this.rules.get(ruleId);
    if (!rule || !rule.isActive) return false;

    // Rate limiting - don't trigger same rule too frequently
    const lastTrigger = this.rateLimiter.get(ruleId) || 0;
    const cooldownMs = rule.config.cooldownMs || 300000; // 5 minutes default
    
    if (Date.now() - lastTrigger < cooldownMs) {
      return false;
    }

    let shouldTrigger = false;

    switch (rule.ruleType) {
      case 'signal_threshold':
        shouldTrigger = this.checkSignalThreshold(rule, context);
        break;
      case 'var_limit':
        shouldTrigger = this.checkVarLimit(rule, context);
        break;
      case 'loss_cap':
        shouldTrigger = this.checkLossCap(rule, context);
        break;
      case 'breaker':
        shouldTrigger = this.checkBreakerTrip(rule, context);
        break;
      case 'health_degraded':
        shouldTrigger = this.checkHealthDegraded(rule, context);
        break;
    }

    if (shouldTrigger) {
      await this.triggerAlert(rule, context);
      this.rateLimiter.set(ruleId, Date.now());
      
      // Update last triggered in database
      await prisma.alertRule.update({
        where: { id: ruleId },
        data: { lastTriggered: new Date() }
      });
    }

    return shouldTrigger;
  }

  /**
   * Trigger alert and send notifications
   */
  private async triggerAlert(rule: AlertRule, context: AlertContext): Promise<void> {
    console.log(`🚨 Alert triggered: ${rule.name} - ${context.message}`);

    const alert = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      rule: rule.name,
      ruleType: rule.ruleType,
      severity: context.severity,
      message: context.message,
      context
    };

    // Send to all active channels
    const promises = this.channels
      .filter(channel => channel.isActive)
      .map(channel => this.sendNotification(channel, alert));

    await Promise.allSettled(promises);
  }

  /**
   * Send notification to specific channel
   */
  private async sendNotification(channel: NotificationChannel, alert: any): Promise<void> {
    try {
      switch (channel.type) {
        case 'slack':
          await this.sendSlackNotification(channel.config, alert);
          break;
        case 'telegram':
          await this.sendTelegramNotification(channel.config, alert);
          break;
        case 'webhook':
          await this.sendWebhookNotification(channel.config, alert);
          break;
      }
      console.log(`✅ Sent ${channel.type} notification for alert ${alert.id}`);
    } catch (error) {
      console.error(`❌ Failed to send ${channel.type} notification:`, error);
    }
  }

  /**
   * Send Slack notification
   */
  private async sendSlackNotification(config: any, alert: any): Promise<void> {
    const color = alert.severity === 'critical' ? 'danger' : 
                 alert.severity === 'warning' ? 'warning' : 'good';

    const payload = {
      channel: config.channel,
      username: config.username,
      attachments: [{
        color,
        title: `🚨 ${alert.rule}`,
        text: alert.message,
        fields: [
          {
            title: 'Severity',
            value: alert.severity.toUpperCase(),
            short: true
          },
          {
            title: 'Time',
            value: new Date(alert.timestamp).toLocaleString(),
            short: true
          }
        ],
        footer: 'AI-LENS Trader',
        ts: Math.floor(new Date(alert.timestamp).getTime() / 1000)
      }]
    };

    await fetch(config.webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  }

  /**
   * Send Telegram notification
   */
  private async sendTelegramNotification(config: any, alert: any): Promise<void> {
    const emoji = alert.severity === 'critical' ? '🚨' :
                 alert.severity === 'warning' ? '⚠️' : 'ℹ️';

    const message = `${emoji} *${alert.rule}*\n\n${alert.message}\n\n⏰ ${new Date(alert.timestamp).toLocaleString()}`;

    const url = `https://api.telegram.org/bot${config.token}/sendMessage`;
    
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: config.chatId,
        text: message,
        parse_mode: 'Markdown'
      })
    });
  }

  /**
   * Send webhook notification
   */
  private async sendWebhookNotification(config: any, alert: any): Promise<void> {
    const payload = JSON.stringify(alert);
    
    let headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'AI-LENS-Trader/1.0'
    };

    // Add HMAC signature if secret is provided
    if (config.secret) {
      const signature = crypto
        .createHmac('sha256', config.secret)
        .update(payload)
        .digest('hex');
      headers['X-Signature-SHA256'] = `sha256=${signature}`;
    }

    await fetch(config.url, {
      method: 'POST',
      headers,
      body: payload
    });
  }

  // Rule check implementations
  private checkSignalThreshold(rule: AlertRule, context: AlertContext): boolean {
    const threshold = rule.config.threshold || 60;
    return Math.abs(context.value) >= threshold;
  }

  private checkVarLimit(rule: AlertRule, context: AlertContext): boolean {
    const limit = rule.config.limit || 1000;
    return Math.abs(context.value) >= limit;
  }

  private checkLossCap(rule: AlertRule, context: AlertContext): boolean {
    const cap = rule.config.cap || 500;
    return context.value <= -cap; // Loss is negative
  }

  private checkBreakerTrip(rule: AlertRule, context: AlertContext): boolean {
    return context.message.toLowerCase().includes('breaker') || 
           context.message.toLowerCase().includes('kill');
  }

  private checkHealthDegraded(rule: AlertRule, context: AlertContext): boolean {
    return context.severity === 'critical' || 
           context.message.toLowerCase().includes('degraded') ||
           context.message.toLowerCase().includes('unhealthy');
  }

  /**
   * Test alert system
   */
  async testAlerts(): Promise<boolean> {
    try {
      const testContext: AlertContext = {
        value: 100,
        message: 'Test alert from AI-LENS Trader system',
        severity: 'info',
        data: { test: true, timestamp: new Date().toISOString() }
      };

      const alert = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        rule: 'Test Alert',
        ruleType: 'test',
        severity: 'info',
        message: 'System test - all channels operational',
        context: testContext
      };

      const promises = this.channels
        .filter(channel => channel.isActive)
        .map(channel => this.sendNotification(channel, alert));

      await Promise.allSettled(promises);
      
      console.log('✅ Test alerts sent to all channels');
      return true;
    } catch (error) {
      console.error('❌ Test alerts failed:', error);
      return false;
    }
  }

  /**
   * Get rules summary
   */
  getRulesSummary(): {
    totalRules: number;
    activeRules: number;
    ruleTypes: Record<string, number>;
    channels: number;
  } {
    const activeRules = Array.from(this.rules.values()).filter(rule => rule.isActive);
    const ruleTypes = activeRules.reduce((acc, rule) => {
      acc[rule.ruleType] = (acc[rule.ruleType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalRules: this.rules.size,
      activeRules: activeRules.length,
      ruleTypes,
      channels: this.channels.filter(c => c.isActive).length
    };
  }

  /**
   * Health check for alerts system
   */
  healthCheck(): { status: 'healthy' | 'degraded' | 'unhealthy'; details: any } {
    const activeChannels = this.channels.filter(c => c.isActive).length;
    const activeRules = Array.from(this.rules.values()).filter(r => r.isActive).length;

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    if (activeChannels === 0) {
      status = 'degraded';
    }

    return {
      status,
      details: {
        activeChannels,
        activeRules,
        channelTypes: this.channels.map(c => c.type),
        rateLimiterSize: this.rateLimiter.size
      }
    };
  }
}

// Create singleton instance
export const alertsEngine = new AlertsEngine();
