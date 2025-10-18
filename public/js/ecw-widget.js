/**
 * ECW Floating Widget for Ailydian Chat
 * Premium Dark Theme - Real-time ethics scores during AI conversations
 * Version: 2.0 - Dark Mode with Premium Icons
 */

class ECWWidget {
    constructor() {
        this.widget = null;
        this.isMinimized = localStorage.getItem('ecw_widget_minimized') === 'true';
        this.autoTrack = localStorage.getItem('ecw_auto_track') !== 'false'; // default true
    }

    /**
     * Initialize and inject widget into page
     */
    async init() {
        await this.createWidget();
        await this.updateStats();

        // Auto-update every 10 seconds if not minimized
        if (!this.isMinimized) {
            setInterval(() => this.updateStats(), 10000);
        }
    }

    /**
     * Create widget HTML with Dark Theme
     */
    async createWidget() {
        const widget = document.createElement('div');
        widget.id = 'ecw-widget';
        widget.innerHTML = `
            <style>
                #ecw-widget {
                    position: fixed;
                    top: 80px;
                    right: 24px;
                    z-index: 9998;
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                }

                #ecw-widget.minimized .widget-body {
                    display: none;
                }

                #ecw-widget.minimized .widget-container {
                    width: auto;
                }

                .widget-container {
                    background: rgba(26, 26, 26, 0.95);
                    backdrop-filter: blur(12px);
                    border-radius: 16px;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    overflow: hidden;
                    width: 320px;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .widget-header {
                    background: linear-gradient(135deg, #10A37F 0%, #0D8F6E 100%);
                    color: white;
                    padding: 14px 16px;
                    cursor: pointer;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    user-select: none;
                    transition: all 0.2s;
                }

                .widget-header:hover {
                    background: linear-gradient(135deg, #13C896 0%, #10A37F 100%);
                }

                .widget-header-title {
                    font-size: 13px;
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    letter-spacing: 0.3px;
                }

                .widget-icon {
                    width: 18px;
                    height: 18px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .widget-pulse {
                    width: 8px;
                    height: 8px;
                    background: rgba(255, 255, 255, 0.9);
                    border-radius: 50%;
                    animation: pulse 2s infinite;
                }

                @keyframes pulse {
                    0%, 100% {
                        opacity: 1;
                        transform: scale(1);
                    }
                    50% {
                        opacity: 0.6;
                        transform: scale(1.2);
                    }
                }

                .widget-header-actions {
                    display: flex;
                    gap: 6px;
                }

                .widget-btn {
                    background: rgba(255, 255, 255, 0.15);
                    border: none;
                    color: white;
                    width: 28px;
                    height: 28px;
                    border-radius: 6px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 14px;
                    transition: all 0.2s;
                    padding: 0;
                }

                .widget-btn:hover {
                    background: rgba(255, 255, 255, 0.25);
                    transform: translateY(-1px);
                }

                .widget-btn:active {
                    transform: translateY(0);
                }

                .widget-btn svg {
                    width: 14px;
                    height: 14px;
                    fill: currentColor;
                }

                .widget-body {
                    padding: 16px;
                    background: rgba(26, 26, 26, 0.98);
                }

                .widget-stats {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 10px;
                    margin-bottom: 12px;
                }

                .widget-stat {
                    background: rgba(255, 255, 255, 0.05);
                    padding: 12px;
                    border-radius: 10px;
                    text-align: center;
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    transition: all 0.2s;
                }

                .widget-stat:hover {
                    background: rgba(255, 255, 255, 0.08);
                    border-color: rgba(16, 163, 127, 0.3);
                }

                .widget-stat-label {
                    font-size: 10px;
                    color: rgba(255, 255, 255, 0.6);
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.8px;
                    margin-bottom: 6px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 4px;
                }

                .widget-stat-value {
                    font-size: 22px;
                    font-weight: 800;
                    color: #10A37F;
                    text-shadow: 0 0 10px rgba(16, 163, 127, 0.3);
                }

                .widget-stat.negative .widget-stat-value {
                    color: #FF6B4A;
                    text-shadow: 0 0 10px rgba(255, 107, 74, 0.3);
                }

                .widget-stat.positive .widget-stat-value {
                    color: #13C896;
                    text-shadow: 0 0 10px rgba(19, 200, 150, 0.3);
                }

                .widget-balance {
                    background: rgba(16, 163, 127, 0.1);
                    border: 1px solid rgba(16, 163, 127, 0.2);
                    padding: 12px;
                    border-radius: 10px;
                    text-align: center;
                    margin-bottom: 12px;
                    transition: all 0.3s;
                }

                .widget-balance:hover {
                    background: rgba(16, 163, 127, 0.15);
                    border-color: rgba(16, 163, 127, 0.3);
                }

                .widget-balance-label {
                    font-size: 11px;
                    color: rgba(255, 255, 255, 0.7);
                    font-weight: 600;
                    margin-bottom: 6px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .widget-balance-value {
                    font-size: 18px;
                    font-weight: 800;
                    color: #13C896;
                    text-shadow: 0 0 10px rgba(19, 200, 150, 0.3);
                }

                .widget-balance.negative {
                    background: rgba(255, 107, 74, 0.1);
                    border-color: rgba(255, 107, 74, 0.2);
                }

                .widget-balance.negative .widget-balance-value {
                    color: #FF6B4A;
                    text-shadow: 0 0 10px rgba(255, 107, 74, 0.3);
                }

                .widget-balance.positive {
                    background: rgba(19, 200, 150, 0.1);
                    border-color: rgba(19, 200, 150, 0.2);
                }

                .widget-balance.positive .widget-balance-value {
                    color: #13C896;
                }

                .widget-last-tx {
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.06);
                    padding: 10px;
                    border-radius: 8px;
                    font-size: 11px;
                    color: rgba(255, 255, 255, 0.6);
                    margin-bottom: 12px;
                    line-height: 1.5;
                }

                .widget-last-tx strong {
                    color: rgba(255, 255, 255, 0.9);
                    font-weight: 600;
                }

                .widget-footer {
                    display: flex;
                    gap: 8px;
                }

                .widget-footer button {
                    flex: 1;
                    padding: 10px 12px;
                    background: linear-gradient(135deg, #10A37F 0%, #0D8F6E 100%);
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-size: 11px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .widget-footer button:hover {
                    background: linear-gradient(135deg, #13C896 0%, #10A37F 100%);
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(16, 163, 127, 0.3);
                }

                .widget-footer button:active {
                    transform: translateY(0);
                }

                .widget-footer button.secondary {
                    background: rgba(255, 255, 255, 0.08);
                    color: rgba(255, 255, 255, 0.9);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }

                .widget-footer button.secondary:hover {
                    background: rgba(255, 255, 255, 0.12);
                    border-color: rgba(255, 255, 255, 0.2);
                    box-shadow: 0 4px 12px rgba(255, 255, 255, 0.1);
                }

                /* Mobile responsive */
                @media (max-width: 768px) {
                    .widget-container {
                        width: 280px;
                    }

                    #ecw-widget {
                        top: auto;
                        bottom: 80px;
                        right: 16px;
                    }
                }

                /* Animations */
                @keyframes slideInRight {
                    from {
                        opacity: 0;
                        transform: translateX(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }

                #ecw-widget {
                    animation: slideInRight 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                }
            </style>

            <div class="widget-container">
                <div class="widget-header" onclick="ecwWidget.toggle()">
                    <div class="widget-header-title">
                        <span class="widget-pulse"></span>
                        <svg class="widget-icon" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                        </svg>
                        <span>Ethics Tracker</span>
                    </div>
                    <div class="widget-header-actions">
                        <button class="widget-btn" onclick="event.stopPropagation(); ecwWidget.refresh()" title="Yenile">
                            <svg viewBox="0 0 24 24">
                                <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
                            </svg>
                        </button>
                        <button class="widget-btn" onclick="event.stopPropagation(); ecwWidget.toggle()" title="Küçült/Aç">
                            <svg viewBox="0 0 24 24">
                                ${this.isMinimized ?
                                    '<path d="M7 14l5-5 5 5z"/>' :
                                    '<path d="M7 10l5 5 5-5z"/>'
                                }
                            </svg>
                        </button>
                    </div>
                </div>

                <div class="widget-body">
                    <div class="widget-stats">
                        <div class="widget-stat">
                            <div class="widget-stat-label">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                </svg>
                                Etik (Ω)
                            </div>
                            <div class="widget-stat-value" id="widget-ethics">-</div>
                        </div>
                        <div class="widget-stat">
                            <div class="widget-stat-label">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
                                </svg>
                                Etki (Φ)
                            </div>
                            <div class="widget-stat-value" id="widget-impact">-</div>
                        </div>
                    </div>

                    <div class="widget-balance" id="widget-co2-box">
                        <div class="widget-balance-label">
                            <svg style="display: inline; width: 14px; height: 14px; vertical-align: middle; margin-right: 4px;" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.34C7.31 20.84 9 22 11.06 22c2.54 0 3.89-1.83 4.74-3.07.47-.7.85-1.27 1.35-1.52.32-.16.62-.27.92-.37.34-.12.88-.31 1.34-.64 1.13-.81 1.59-2.14 1.59-3.4 0-2.76-2.24-5-5-5zm-5.5 5c-.83 0-1.5-.67-1.5-1.5S10.67 10 11.5 10s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
                            </svg>
                            CO₂ Dengesi
                        </div>
                        <div class="widget-balance-value" id="widget-co2">- kg</div>
                    </div>

                    <div class="widget-last-tx" id="widget-last-tx">
                        <svg style="display: inline; width: 12px; height: 12px; vertical-align: middle; margin-right: 4px; opacity: 0.6;" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                        </svg>
                        Son işlem bekleniyor...
                    </div>

                    <div class="widget-footer">
                        <button onclick="ecwWidget.openFull()">
                            <svg style="display: inline; width: 12px; height: 12px; vertical-align: middle; margin-right: 4px;" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/>
                            </svg>
                            Detay
                        </button>
                        <button class="secondary" onclick="ecwWidget.toggleAutoTrack()">
                            ${this.autoTrack ?
                                '<svg style="display: inline; width: 12px; height: 12px; vertical-align: middle; margin-right: 4px;" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg> Oto' :
                                '<svg style="display: inline; width: 12px; height: 12px; vertical-align: middle; margin-right: 4px;" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="8"/></svg> Manuel'
                            }
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(widget);
        this.widget = widget;

        if (this.isMinimized) {
            widget.classList.add('minimized');
        }
    }

    /**
     * Update widget stats
     */
    async updateStats() {
        if (!window.ecwIntegration || !window.ecwIntegration.initialized) {
            return;
        }

        try {
            const userId = localStorage.getItem('ailydian_user_id');
            if (!userId) return;

            const stats = await window.ecwIntegration.getWalletStats(userId);
            const transactions = await window.ecwIntegration.getTransactionHistory(userId, 1);

            document.getElementById('widget-ethics').textContent = Math.round(stats.ethicsScore);
            document.getElementById('widget-impact').textContent = Math.round(stats.impactScore);
            document.getElementById('widget-co2').textContent = stats.balanceCO2.toFixed(3) + ' kg';

            const co2Box = document.getElementById('widget-co2-box');
            co2Box.className = 'widget-balance ' + (stats.balanceCO2 < 0 ? 'negative' : 'positive');

            if (transactions.length > 0) {
                const lastTx = transactions[0];
                const timeAgo = this.getTimeAgo(new Date(lastTx.createdAt));
                document.getElementById('widget-last-tx').innerHTML = `
                    <svg style="display: inline; width: 12px; height: 12px; vertical-align: middle; margin-right: 4px; opacity: 0.6;" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                    </svg>
                    <strong>Son İşlem:</strong> ${lastTx.type === 'credit' ? '+' : '-'}${lastTx.amount.toFixed(3)} ${lastTx.metric} · ${timeAgo}
                `;
            }
        } catch (error) {
            console.error('Widget stats update error:', error);
        }
    }

    /**
     * Toggle widget minimize/maximize
     */
    toggle() {
        this.isMinimized = !this.isMinimized;
        localStorage.setItem('ecw_widget_minimized', this.isMinimized);

        if (this.isMinimized) {
            this.widget.classList.add('minimized');
        } else {
            this.widget.classList.remove('minimized');
            this.updateStats(); // Refresh when opening
        }

        // Update toggle button
        const toggleBtn = this.widget.querySelector('.widget-header-actions button:last-child');
        toggleBtn.innerHTML = this.isMinimized ?
            '<svg viewBox="0 0 24 24"><path d="M7 14l5-5 5 5z"/></svg>' :
            '<svg viewBox="0 0 24 24"><path d="M7 10l5 5 5-5z"/></svg>';
    }

    /**
     * Toggle auto-tracking
     */
    toggleAutoTrack() {
        this.autoTrack = !this.autoTrack;
        localStorage.setItem('ecw_auto_track', this.autoTrack);

        // Update button
        const btn = this.widget.querySelector('.widget-footer button.secondary');
        btn.innerHTML = this.autoTrack ?
            '<svg style="display: inline; width: 12px; height: 12px; vertical-align: middle; margin-right: 4px;" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg> Oto' :
            '<svg style="display: inline; width: 12px; height: 12px; vertical-align: middle; margin-right: 4px;" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="8"/></svg> Manuel';

        // Show notification
        this.showNotification(this.autoTrack ? 'Otomatik takip aktif' : 'Manuel mod aktif');
    }

    /**
     * Refresh stats
     */
    async refresh() {
        const btn = this.widget.querySelector('.widget-header-actions button:first-child');
        const originalHTML = btn.innerHTML;
        btn.innerHTML = '<svg viewBox="0 0 24 24" style="animation: spin 1s linear infinite;"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>';

        // Add spin animation
        const style = document.createElement('style');
        style.textContent = '@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }';
        document.head.appendChild(style);

        await this.updateStats();

        setTimeout(() => {
            btn.innerHTML = originalHTML;
            style.remove();
        }, 500);
    }

    /**
     * Open full view
     */
    openFull() {
        window.open('http://localhost:3210/index.html', '_blank');
    }

    /**
     * Show temporary notification
     */
    showNotification(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 370px;
            background: linear-gradient(135deg, #10A37F 0%, #0D8F6E 100%);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 600;
            z-index: 10000;
            box-shadow: 0 8px 24px rgba(16, 163, 127, 0.4);
            animation: slideInRight 0.3s ease-out;
            border: 1px solid rgba(255, 255, 255, 0.2);
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 2000);
    }

    /**
     * Get time ago string
     */
    getTimeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);

        if (seconds < 60) return 'Az önce';
        if (seconds < 3600) return Math.floor(seconds / 60) + ' dk önce';
        if (seconds < 86400) return Math.floor(seconds / 3600) + ' sa önce';
        return Math.floor(seconds / 86400) + ' gün önce';
    }
}

// Global widget instance
window.ecwWidget = new ECWWidget();

// Auto-initialize after ECW integration is ready
window.addEventListener('DOMContentLoaded', async () => {
    // Wait for ECW integration to initialize
    const checkECW = setInterval(async () => {
        if (window.ecwIntegration && window.ecwIntegration.initialized) {
            clearInterval(checkECW);
            await window.ecwWidget.init();
            console.log('✓ ECW Widget initialized (Dark Mode)');
        }
    }, 500);

    // Timeout after 10 seconds
    setTimeout(() => clearInterval(checkECW), 10000);
});
