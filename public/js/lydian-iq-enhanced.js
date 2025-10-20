// ========================================
// Lydian IQ Enhanced - Iyileştirmeler
// Version: 2.0.0 - Sardag Edition
// ========================================

// Global Error Handler
class ErrorBoundary {
    constructor() {
        this.setupGlobalHandlers();
    }

    setupGlobalHandlers() {
        // JavaScript errors
        window.addEventListener('error', (e) => {
            console.error('Global error caught:', e.error);
            this.showUserFriendlyError('Bir hata oluştu. Lütfen sayfayı yenileyin.');

            // Analytics
            this.trackError({
                type: 'js_error',
                message: e.error?.message || 'Unknown error',
                stack: e.error?.stack || '',
                url: window.location.href
            });
        });

        // Promise rejections
        window.addEventListener('unhandledrejection', (e) => {
            console.error('Unhandled promise rejection:', e.reason);
            this.showUserFriendlyError('İşlem başarısız oldu. Lütfen tekrar deneyin.');

            // Analytics
            this.trackError({
                type: 'promise_rejection',
                message: e.reason?.message || String(e.reason),
                url: window.location.href
            });
        });
    }

    showUserFriendlyError(message) {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: linear-gradient(135deg, #EF4444, #DC2626);
            color: white;
            padding: 16px 24px;
            border-radius: 12px;
            font-size: 14px;
            font-weight: 600;
            box-shadow: 0 8px 24px rgba(239, 68, 68, 0.4);
            z-index: 10000;
            animation: slideInRight 0.3s ease;
        `;
        toast.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span>${message}</span>
            </div>
        `;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    }

    trackError(errorData) {
        // Send to analytics (if available)
        if (window.lydianAnalytics) {
            window.lydianAnalytics.trackError(errorData);
        }
    }
}

// LocalStorage Chat History Manager
class ChatHistoryManager {
    constructor() {
        this.storageKey = 'lydian-iq-chat-history';
        this.maxHistorySize = 50; // Max 50 conversations
    }

    saveMessage(mode, query, response) {
        try {
            // Validate response
            if (!response || typeof response !== 'string') {
                console.warn('Invalid response provided to saveMessage:', typeof response);
                return;
            }

            const history = this.getHistory();
            const message = {
                id: Date.now(),
                timestamp: new Date().toISOString(),
                mode: mode,
                query: query,
                response: response,
                responseLength: response.length
            };

            history.unshift(message);

            // Keep only last 50
            if (history.length > this.maxHistorySize) {
                history.splice(this.maxHistorySize);
            }

            localStorage.setItem(this.storageKey, JSON.stringify(history));
            console.log('💾 Chat history saved:', message.id);
        } catch (error) {
            console.error('Failed to save chat history:', error);
        }
    }

    getHistory() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Failed to load chat history:', error);
            return [];
        }
    }

    getRecentQueries(limit = 5) {
        const history = this.getHistory();
        return history.slice(0, limit).map(h => h.query);
    }

    clearHistory() {
        try {
            localStorage.removeItem(this.storageKey);
            console.log('🗑️ Chat history cleared');
        } catch (error) {
            console.error('Failed to clear chat history:', error);
        }
    }

    exportHistory() {
        const history = this.getHistory();
        const dataStr = JSON.stringify(history, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `lydian-iq-history-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        console.log('📥 Chat history exported');
    }
}

// Analytics Tracker
class LydianAnalytics {
    constructor() {
        this.events = [];
        this.sessionId = this.generateSessionId();
        this.startTime = Date.now();
    }

    generateSessionId() {
        return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    trackEvent(eventName, eventData = {}) {
        const event = {
            name: eventName,
            timestamp: new Date().toISOString(),
            sessionId: this.sessionId,
            sessionDuration: Date.now() - this.startTime,
            url: window.location.href,
            userAgent: navigator.userAgent,
            ...eventData
        };

        this.events.push(event);
        console.log('📊 Event tracked:', eventName, eventData);

        // Send to backend (optional)
        this.sendToBackend(event);
    }

    trackSearch(mode, query, responseTime, success) {
        this.trackEvent('search', {
            mode: mode,
            queryLength: query.length,
            responseTime: responseTime,
            success: success
        });
    }

    trackConnectorUsage(connectorName, country) {
        this.trackEvent('connector_used', {
            connector: connectorName,
            country: country
        });
    }

    trackError(errorData) {
        this.trackEvent('error', errorData);
    }

    getStats() {
        const stats = {
            totalEvents: this.events.length,
            sessionDuration: Date.now() - this.startTime,
            searches: this.events.filter(e => e.name === 'search').length,
            connectorUsage: this.events.filter(e => e.name === 'connector_used').length,
            errors: this.events.filter(e => e.name === 'error').length
        };

        // Mode breakdown
        const modeBreakdown = {};
        this.events.filter(e => e.name === 'search').forEach(e => {
            const mode = e.mode || 'unknown';
            modeBreakdown[mode] = (modeBreakdown[mode] || 0) + 1;
        });
        stats.modeBreakdown = modeBreakdown;

        // Popular connectors
        const connectorUsage = {};
        this.events.filter(e => e.name === 'connector_used').forEach(e => {
            const connector = e.connector || 'unknown';
            connectorUsage[connector] = (connectorUsage[connector] || 0) + 1;
        });
        stats.popularConnectors = Object.entries(connectorUsage)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, count]) => ({ name, count }));

        return stats;
    }

    async sendToBackend(event) {
        // Optional: Send events to analytics endpoint
        try {
            // Uncomment when backend endpoint is ready
            // await fetch('/api/analytics/track', {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify(event)
            // });
        } catch (error) {
            console.debug('Analytics backend not available:', error.message);
        }
    }

    exportAnalytics() {
        const data = {
            sessionId: this.sessionId,
            stats: this.getStats(),
            events: this.events
        };
        const dataStr = JSON.stringify(data, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `lydian-analytics-${this.sessionId}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        console.log('📊 Analytics exported');
    }
}

// Connector Data Loader
class ConnectorDataLoader {
    constructor() {
        this.connectorsData = null;
        this.loadingPromise = null;
    }

    async load() {
        if (this.connectorsData) {
            return this.connectorsData;
        }

        if (this.loadingPromise) {
            return this.loadingPromise;
        }

        this.loadingPromise = fetch('/data/connectors.json')
            .then(res => {
                if (!res.ok) {
                    throw new Error(`HTTP ${res.status}: Failed to load connectors`);
                }
                return res.json();
            })
            .then(data => {
                this.connectorsData = data;
                console.log(`✅ Loaded ${data.totalConnectors} connectors from ${Object.keys(data.countries).length} countries`);
                return data;
            })
            .catch(error => {
                console.error('❌ Failed to load connector data:', error);
                // Fallback to empty data
                this.connectorsData = {
                    version: '1.0.0',
                    lastUpdated: new Date().toISOString(),
                    totalConnectors: 0,
                    countries: {}
                };
                return this.connectorsData;
            });

        return this.loadingPromise;
    }

    getConnectorIcon(categoryName) {
        const icons = {
            'E-Ticaret': '🛒',
            'Kargo': '📦',
            'Yemek': '🍔',
            'Food Delivery': '🍕',
            'Market': '🛍️',
            'Grocery': '🥬',
            'Finans': '💳',
            'Seyahat': '✈️',
            'Default': '🔗'
        };

        for (let [key, icon] of Object.entries(icons)) {
            if (categoryName.includes(key)) return icon;
        }
        return icons.Default;
    }
}

// Initialize all enhancements
function initializeEnhancements() {
    // Error boundary
    window.lydianErrorBoundary = new ErrorBoundary();
    console.log('✅ Error boundary initialized');

    // Chat history
    window.lydianChatHistory = new ChatHistoryManager();
    console.log('✅ Chat history manager initialized');

    // Analytics
    window.lydianAnalytics = new LydianAnalytics();
    console.log('✅ Analytics tracker initialized');

    // Connector data loader
    window.lydianConnectorLoader = new ConnectorDataLoader();
    console.log('✅ Connector data loader initialized');

    // Track page view
    window.lydianAnalytics.trackEvent('page_view', {
        page: 'lydian-iq'
    });

    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + K: Focus search
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            document.getElementById('searchInput')?.focus();
            window.lydianAnalytics.trackEvent('keyboard_shortcut', { key: 'ctrl+k' });
        }

        // Ctrl/Cmd + H: Show history
        if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
            e.preventDefault();
            showHistoryPanel();
            window.lydianAnalytics.trackEvent('keyboard_shortcut', { key: 'ctrl+h' });
        }

        // Ctrl/Cmd + /: Show shortcuts
        if ((e.ctrlKey || e.metaKey) && e.key === '/') {
            e.preventDefault();
            showShortcutsPanel();
            window.lydianAnalytics.trackEvent('keyboard_shortcut', { key: 'ctrl+/' });
        }
    });

    console.log(`
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║      🚀 Lydian IQ Enhanced v2.0 - Active                      ║
║                                                                ║
║      ✅ Error Boundary: Active                                ║
║      ✅ Chat History: Active                                  ║
║      ✅ Analytics: Active                                     ║
║      ✅ Connector Loader: Ready                               ║
║                                                                ║
║      Keyboard Shortcuts:                                       ║
║      • Ctrl/Cmd + K: Focus Search                             ║
║      • Ctrl/Cmd + H: View History                             ║
║      • Ctrl/Cmd + /: Show Shortcuts                           ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
    `);
}

// Show history panel
function showHistoryPanel() {
    const history = window.lydianChatHistory.getHistory();

    if (history.length === 0) {
        alert('Henüz kayıtlı sohbet geçmişi yok.');
        return;
    }

    const recentQueries = history.slice(0, 10).map((h, i) =>
        `${i + 1}. [${h.mode}] ${h.query.substring(0, 60)}${h.query.length > 60 ? '...' : ''}`
    ).join('\n');

    alert(`📝 Son 10 Sorgu:\n\n${recentQueries}\n\nTüm geçmişi dışa aktarmak için konsola: window.lydianChatHistory.exportHistory()`);
}

// Show shortcuts panel
function showShortcutsPanel() {
    alert(`⌨️ Keyboard Shortcuts:

• Ctrl/Cmd + K: Search'e odaklan
• Ctrl/Cmd + H: Sohbet geçmişini göster
• Ctrl/Cmd + /: Bu yardım panelini göster
• Enter: Arama yap
• Esc: Split mode'dan çık

📊 Analytics için: window.lydianAnalytics.getStats()
💾 History için: window.lydianChatHistory.exportHistory()`);
}

// Initialize on DOM load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeEnhancements);
} else {
    initializeEnhancements();
}

// Export for global use
window.LydianEnhancements = {
    ErrorBoundary,
    ChatHistoryManager,
    LydianAnalytics,
    ConnectorDataLoader,
    showHistoryPanel,
    showShortcutsPanel
};
