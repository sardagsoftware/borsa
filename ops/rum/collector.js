// ============================================
// 📊 RUM (Real User Monitoring) Collector
// Collects Core Web Vitals from real users
// ============================================

import { onLCP, onCLS, onINP, onFCP, onTTFB } from 'web-vitals';

const CONFIG = {
    endpoint: '/api/analytics/vitals',
    batchSize: 5,
    batchTimeout: 5000, // 5 seconds
    debug: false
};

class RUMCollector {
    constructor(config = {}) {
        this.config = { ...CONFIG, ...config };
        this.queue = [];
        this.batchTimer = null;
        this.sessionId = this.generateSessionId();
        this.init();
    }

    generateSessionId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    init() {
        // Collect Core Web Vitals
        onLCP(metric => this.handleMetric(metric));
        onCLS(metric => this.handleMetric(metric));
        onINP(metric => this.handleMetric(metric));
        onFCP(metric => this.handleMetric(metric));
        onTTFB(metric => this.handleMetric(metric));

        // Send on visibility change (page hide)
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                this.flush(true); // Force flush
            }
        });

        if (this.config.debug) {
            console.log('[RUM] Collector initialized', { sessionId: this.sessionId });
        }
    }

    handleMetric(metric) {
        const payload = {
            name: metric.name,
            value: metric.value,
            rating: metric.rating,
            delta: metric.delta,
            id: metric.id,
            url: window.location.href,
            pathname: window.location.pathname,
            sessionId: this.sessionId,
            userAgent: navigator.userAgent,
            connection: this.getConnectionInfo(),
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            timestamp: new Date().toISOString()
        };

        if (this.config.debug) {
            console.log('[RUM] Metric collected:', payload);
        }

        this.queue.push(payload);

        // Auto-flush if batch size reached
        if (this.queue.length >= this.config.batchSize) {
            this.flush();
        } else {
            // Set timer for batch timeout
            this.resetBatchTimer();
        }
    }

    getConnectionInfo() {
        const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (!conn) return null;

        return {
            effectiveType: conn.effectiveType,
            downlink: conn.downlink,
            rtt: conn.rtt,
            saveData: conn.saveData
        };
    }

    resetBatchTimer() {
        if (this.batchTimer) {
            clearTimeout(this.batchTimer);
        }
        this.batchTimer = setTimeout(() => {
            this.flush();
        }, this.config.batchTimeout);
    }

    async flush(force = false) {
        if (this.queue.length === 0) return;

        const data = [...this.queue];
        this.queue = [];

        if (this.batchTimer) {
            clearTimeout(this.batchTimer);
            this.batchTimer = null;
        }

        try {
            const method = force && navigator.sendBeacon ? 'sendBeacon' : 'fetch';

            if (method === 'sendBeacon') {
                // Use sendBeacon for reliable delivery on page unload
                const success = navigator.sendBeacon(
                    this.config.endpoint,
                    JSON.stringify({ metrics: data })
                );
                if (this.config.debug) {
                    console.log('[RUM] Sent via sendBeacon:', success);
                }
            } else {
                // Use fetch for normal operation
                await fetch(this.config.endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ metrics: data }),
                    keepalive: true
                });
                if (this.config.debug) {
                    console.log('[RUM] Sent via fetch:', data.length, 'metrics');
                }
            }
        } catch (error) {
            console.error('[RUM] Failed to send metrics:', error);
            // Re-queue on failure (unless forced)
            if (!force) {
                this.queue.unshift(...data);
            }
        }
    }
}

// Auto-initialize if web-vitals library is available
if (typeof window !== 'undefined' && typeof onLCP !== 'undefined') {
    window.RUMCollector = new RUMCollector({
        debug: false // Set to true for debugging
    });
}

export default RUMCollector;
