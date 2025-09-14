import { PrismaClient } from '@prisma/client';

// Use existing prisma instance or create new one
const prisma = (globalThis as any).prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') (globalThis as any).prisma = prisma;

interface MetricData {
  name: string;
  value: number;
  timestamp: Date;
  labels?: Record<string, string>;
}

interface SpanData {
  traceId: string;
  spanId: string;
  operation: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  status: 'ok' | 'error' | 'timeout';
  tags?: Record<string, string>;
}

interface TelemetryConfig {
  otlpEndpoint?: string;
  promPushGateway?: string;
  serviceName: string;
  environment: string;
}

export class TelemetryCollector {
  private config: TelemetryConfig;
  private metrics: MetricData[] = [];
  private spans: SpanData[] = [];
  private counters: Map<string, number> = new Map();
  private gauges: Map<string, number> = new Map();

  constructor() {
    this.config = {
      otlpEndpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
      promPushGateway: process.env.PROM_PUSHGATEWAY_URL,
      serviceName: process.env.OTEL_SERVICE_NAME || 'ailydian-trader',
      environment: process.env.NODE_ENV || 'development'
    };
  }

  /**
   * Increment counter metric
   */
  incrementCounter(name: string, labels: Record<string, string> = {}, value: number = 1): void {
    const key = `${name}:${JSON.stringify(labels)}`;
    this.counters.set(key, (this.counters.get(key) || 0) + value);
    
    this.metrics.push({
      name,
      value: this.counters.get(key)!,
      timestamp: new Date(),
      labels
    });

    // Log important counters
    if (name.includes('error') || name.includes('rejected') || name.includes('failed')) {
      console.warn(`📊 Counter ${name}: ${this.counters.get(key)} ${JSON.stringify(labels)}`);
    }
  }

  /**
   * Set gauge metric
   */
  setGauge(name: string, value: number, labels: Record<string, string> = {}): void {
    const key = `${name}:${JSON.stringify(labels)}`;
    this.gauges.set(key, value);
    
    this.metrics.push({
      name,
      value,
      timestamp: new Date(),
      labels
    });

    // Log critical gauges
    if (name.includes('health') || name.includes('rtt') || name.includes('lag')) {
      console.log(`📊 Gauge ${name}: ${value} ${JSON.stringify(labels)}`);
    }
  }

  /**
   * Record span for distributed tracing
   */
  recordSpan(data: Omit<SpanData, 'duration'>): void {
    const span: SpanData = {
      ...data,
      duration: data.endTime.getTime() - data.startTime.getTime()
    };
    
    this.spans.push(span);

    // Log slow operations
    if (span.duration > 1000) {
      console.warn(`🐌 Slow operation ${span.operation}: ${span.duration}ms`);
    }
  }

  /**
   * Push metrics to Prometheus PushGateway
   */
  async pushMetrics(): Promise<boolean> {
    if (!this.config.promPushGateway) {
      return false;
    }

    try {
      const payload = this.formatPrometheusMetrics();
      
      const response = await fetch(`${this.config.promPushGateway}/metrics/job/${this.config.serviceName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: payload
      });

      if (response.ok) {
        console.log(`📤 Pushed ${this.metrics.length} metrics to Prometheus`);
        this.clearMetrics();
        return true;
      } else {
        console.error('Failed to push metrics:', response.statusText);
        return false;
      }
    } catch (error) {
      console.error('Error pushing metrics:', error);
      return false;
    }
  }

  /**
   * Send telemetry data to OTLP endpoint
   */
  async sendTraces(): Promise<boolean> {
    if (!this.config.otlpEndpoint || this.spans.length === 0) {
      return false;
    }

    try {
      const payload = {
        resourceSpans: [{
          resource: {
            attributes: [
              { key: 'service.name', value: { stringValue: this.config.serviceName } },
              { key: 'service.version', value: { stringValue: '1.0.0' } },
              { key: 'deployment.environment', value: { stringValue: this.config.environment } }
            ]
          },
          instrumentationLibrarySpans: [{
            spans: this.spans.map(span => ({
              traceId: span.traceId,
              spanId: span.spanId,
              name: span.operation,
              startTimeUnixNano: span.startTime.getTime() * 1000000,
              endTimeUnixNano: span.endTime.getTime() * 1000000,
              status: {
                code: span.status === 'ok' ? 1 : 2,
                message: span.status
              },
              attributes: Object.entries(span.tags || {}).map(([key, value]) => ({
                key,
                value: { stringValue: value }
              }))
            }))
          }]
        }]
      };

      const response = await fetch(`${this.config.otlpEndpoint}/v1/traces`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        console.log(`📤 Sent ${this.spans.length} spans to OTLP`);
        this.spans = [];
        return true;
      } else {
        console.error('Failed to send traces:', response.statusText);
        return false;
      }
    } catch (error) {
      console.error('Error sending traces:', error);
      return false;
    }
  }

  /**
   * Store telemetry event in database
   */
  async storeTelemetryEvent(eventType: string, service: string, data: any): Promise<void> {
    try {
      await prisma.telemetryEvent.create({
        data: {
          eventType,
          service,
          data,
          timestamp: new Date()
        }
      });
    } catch (error) {
      console.error('Failed to store telemetry event:', error);
    }
  }

  /**
   * Format metrics for Prometheus
   */
  private formatPrometheusMetrics(): string {
    const lines: string[] = [];
    
    // Group metrics by name
    const metricGroups = this.metrics.reduce((groups, metric) => {
      if (!groups[metric.name]) {
        groups[metric.name] = [];
      }
      groups[metric.name].push(metric);
      return groups;
    }, {} as Record<string, MetricData[]>);

    for (const [name, metrics] of Object.entries(metricGroups)) {
      // Add help and type
      lines.push(`# HELP ${name} Auto-generated metric from ${this.config.serviceName}`);
      lines.push(`# TYPE ${name} gauge`);
      
      for (const metric of metrics) {
        let line = name;
        if (metric.labels && Object.keys(metric.labels).length > 0) {
          const labelPairs = Object.entries(metric.labels)
            .map(([key, value]) => `${key}="${value}"`)
            .join(',');
          line += `{${labelPairs}}`;
        }
        line += ` ${metric.value} ${metric.timestamp.getTime()}`;
        lines.push(line);
      }
    }

    return lines.join('\n');
  }

  /**
   * Clear accumulated metrics
   */
  private clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Get current metrics summary
   */
  getMetricsSummary(): {
    totalMetrics: number;
    totalSpans: number;
    counters: Record<string, number>;
    gauges: Record<string, number>;
  } {
    return {
      totalMetrics: this.metrics.length,
      totalSpans: this.spans.length,
      counters: Object.fromEntries(this.counters),
      gauges: Object.fromEntries(this.gauges)
    };
  }

  /**
   * Health check for telemetry
   */
  healthCheck(): { status: 'healthy' | 'degraded' | 'unhealthy'; details: any } {
    const queuedMetrics = this.metrics.length;
    const queuedSpans = this.spans.length;
    
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (queuedMetrics > 1000 || queuedSpans > 100) {
      status = 'degraded';
    }
    
    if (queuedMetrics > 5000 || queuedSpans > 500) {
      status = 'unhealthy';
    }

    return {
      status,
      details: {
        config: this.config,
        queuedMetrics,
        queuedSpans,
        totalCounters: this.counters.size,
        totalGauges: this.gauges.size
      }
    };
  }
}

// Create singleton instance
export const telemetry = new TelemetryCollector();

// Common metrics helpers
export const metrics = {
  // Trading metrics
  ordersPlaced: (exchange: string, symbol: string) => 
    telemetry.incrementCounter('orders_placed_total', { exchange, symbol }),
  
  ordersRejected: (exchange: string, symbol: string, reason: string) => 
    telemetry.incrementCounter('orders_rejected_total', { exchange, symbol, reason }),
  
  ordersFilled: (exchange: string, symbol: string) => 
    telemetry.incrementCounter('orders_filled_total', { exchange, symbol }),
  
  guardTrips: (guardType: string, symbol: string) => 
    telemetry.incrementCounter('guard_trips_total', { guard_type: guardType, symbol }),
  
  breakerTrips: (reason: string) => 
    telemetry.incrementCounter('breaker_trips_total', { reason }),
  
  // System metrics
  wsRTT: (exchange: string, rtt: number) => 
    telemetry.setGauge('ws_rtt_milliseconds', rtt, { exchange }),
  
  restPing: (exchange: string, ping: number) => 
    telemetry.setGauge('rest_ping_milliseconds', ping, { exchange }),
  
  queueLag: (queue: string, lag: number) => 
    telemetry.setGauge('queue_lag_seconds', lag, { queue }),
  
  riskVaR: (userId: string, var95: number) => 
    telemetry.setGauge('risk_var_usd', var95, { user_id: userId }),
  
  lossToday: (userId: string, loss: number) => 
    telemetry.setGauge('loss_today_usd', loss, { user_id: userId }),
  
  // Bot metrics
  signalsGenerated: (symbol: string, strength: number) => 
    telemetry.incrementCounter('signals_generated_total', { symbol, strength: strength.toString() }),
  
  decisionsExecuted: (symbol: string, decision: string) => 
    telemetry.incrementCounter('decisions_executed_total', { symbol, decision }),
  
  universeSize: (size: number) => 
    telemetry.setGauge('universe_size', size),
  
  botHealth: (component: string, health: number) => 
    telemetry.setGauge('bot_health_score', health, { component })
};
