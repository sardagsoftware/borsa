/**
 * 🔍 STATUS INDICATORS CLIENT-SIDE COMPONENT
 * Real-time API and WebSocket status display for UI
 * Shows health status in footer/navbar areas
 */

class StatusIndicators {
    constructor() {
        this.statusData = {
            apis: {},
            websockets: {},
            overall: 'unknown'
        };

        this.updateInterval = 15000; // 15 seconds
        this.websocket = null;
        this.retryCount = 0;
        this.maxRetries = 5;

        this.init();
    }

    async init() {
        console.log('🔍 Initializing Status Indicators...');

        this.createStatusElements();
        this.startStatusUpdates();
        this.setupWebSocketConnection();

        console.log('✅ Status Indicators initialized');
    }

    createStatusElements() {
        // Create status container for footer
        const footerStatusHTML = `
            <div class="status-indicators" id="statusIndicators">
                <div class="status-group">
                    <div class="status-item" id="apiStatus">
                        <div class="status-icon" id="apiStatusIcon">
                            <i class="fas fa-circle"></i>
                        </div>
                        <span class="status-text">API</span>
                        <div class="status-details" id="apiDetails">
                            <div class="detail-row">
                                <span>OpenAI:</span>
                                <span class="status-value" id="openai-status">-</span>
                            </div>
                            <div class="detail-row">
                                <span>Azure:</span>
                                <span class="status-value" id="azure-openai-status">-</span>
                            </div>
                            <div class="detail-row">
                                <span>Google AI:</span>
                                <span class="status-value" id="google-ai-status">-</span>
                            </div>
                            <div class="detail-row">
                                <span>Z.AI:</span>
                                <span class="status-value" id="z-ai-status">-</span>
                            </div>
                            <div class="detail-row">
                                <span>EnterpriseAI:</span>
                                <span class="status-value" id="claude-status">-</span>
                            </div>
                        </div>
                    </div>

                    <div class="status-item" id="websocketStatus">
                        <div class="status-icon" id="websocketStatusIcon">
                            <i class="fas fa-wifi"></i>
                        </div>
                        <span class="status-text">WebSocket</span>
                        <div class="status-details" id="websocketDetails">
                            <div class="detail-row">
                                <span>Chat:</span>
                                <span class="status-value" id="chat-websocket-status">-</span>
                            </div>
                            <div class="detail-row">
                                <span>AI Stream:</span>
                                <span class="status-value" id="ai-stream-status">-</span>
                            </div>
                            <div class="detail-row">
                                <span>Voice:</span>
                                <span class="status-value" id="voice-stream-status">-</span>
                            </div>
                            <div class="detail-row">
                                <span>File Upload:</span>
                                <span class="status-value" id="file-upload-status">-</span>
                            </div>
                        </div>
                    </div>

                    <div class="status-item" id="databaseStatus">
                        <div class="status-icon" id="databaseStatusIcon">
                            <i class="fas fa-database"></i>
                        </div>
                        <span class="status-text">Database</span>
                        <div class="status-details" id="databaseDetails">
                            <div class="detail-row">
                                <span>Main DB:</span>
                                <span class="status-value" id="database-status">-</span>
                            </div>
                            <div class="detail-row">
                                <span>Cache:</span>
                                <span class="status-value" id="redis-cache-status">-</span>
                            </div>
                            <div class="detail-row">
                                <span>Storage:</span>
                                <span class="status-value" id="file-storage-status">-</span>
                            </div>
                        </div>
                    </div>

                    <div class="status-item" id="overallStatus">
                        <div class="status-icon" id="overallStatusIcon">
                            <i class="fas fa-heartbeat"></i>
                        </div>
                        <span class="status-text" id="overallStatusText">System</span>
                        <div class="status-timestamp" id="statusTimestamp">-</div>
                    </div>
                </div>
            </div>
        `;

        // Add to footer if exists
        const footer = document.querySelector('footer');
        if (footer) {
            const statusContainer = document.createElement('div');
            statusContainer.innerHTML = footerStatusHTML;
            footer.appendChild(statusContainer.firstElementChild);
        }

        // Add to navbar if no footer exists
        if (!footer) {
            const navbar = document.querySelector('.navbar, .header, .top-nav');
            if (navbar) {
                const statusContainer = document.createElement('div');
                statusContainer.className = 'navbar-status';
                statusContainer.innerHTML = footerStatusHTML;
                navbar.appendChild(statusContainer.firstElementChild);
            }
        }

        this.addStatusStyles();
    }

    addStatusStyles() {
        const styles = `
            <style>
                .status-indicators {
                    display: flex;
                    align-items: center;
                    gap: 20px;
                    padding: 10px 20px;
                    background: rgba(0, 0, 0, 0.05);
                    border-top: 1px solid rgba(255, 255, 255, 0.1);
                    font-size: 12px;
                    min-height: 50px;
                }

                .status-group {
                    display: flex;
                    align-items: center;
                    gap: 20px;
                    width: 100%;
                }

                .status-item {
                    position: relative;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    cursor: pointer;
                    padding: 5px 10px;
                    border-radius: 8px;
                    transition: all 0.3s ease;
                }

                .status-item:hover {
                    background: rgba(255, 255, 255, 0.1);
                }

                .status-item:hover .status-details {
                    opacity: 1;
                    visibility: visible;
                    transform: translateY(-10px);
                }

                .status-icon {
                    width: 16px;
                    height: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .status-icon.healthy {
                    color: #10b981;
                }

                .status-icon.degraded {
                    color: #f59e0b;
                }

                .status-icon.unhealthy {
                    color: #ef4444;
                }

                .status-icon.unknown {
                    color: #6b7280;
                }

                .status-text {
                    font-weight: 500;
                    color: #374151;
                    min-width: 60px;
                }

                .status-details {
                    position: absolute;
                    bottom: calc(100% + 10px);
                    left: 50%;
                    transform: translateX(-50%) translateY(5px);
                    background: #1f2937;
                    color: white;
                    padding: 12px;
                    border-radius: 8px;
                    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
                    opacity: 0;
                    visibility: hidden;
                    transition: all 0.3s ease;
                    min-width: 200px;
                    z-index: 1000;
                }

                .status-details::after {
                    content: '';
                    position: absolute;
                    top: 100%;
                    left: 50%;
                    transform: translateX(-50%);
                    border: 6px solid transparent;
                    border-top-color: #1f2937;
                }

                .detail-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 6px;
                    font-size: 11px;
                }

                .detail-row:last-child {
                    margin-bottom: 0;
                }

                .status-value {
                    font-weight: 600;
                    text-transform: uppercase;
                }

                .status-value.healthy {
                    color: #10b981;
                }

                .status-value.degraded {
                    color: #f59e0b;
                }

                .status-value.unhealthy {
                    color: #ef4444;
                }

                .status-value.unknown {
                    color: #6b7280;
                }

                .status-timestamp {
                    font-size: 10px;
                    color: #6b7280;
                    margin-top: 2px;
                }

                #overallStatus {
                    margin-left: auto;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 20px;
                    padding: 8px 15px;
                }

                /* Navbar specific styles */
                .navbar-status .status-indicators {
                    border-top: none;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                    justify-content: flex-end;
                }

                /* Responsive design */
                @media (max-width: 768px) {
                    .status-indicators {
                        padding: 8px 15px;
                        gap: 15px;
                    }

                    .status-group {
                        gap: 15px;
                    }

                    .status-text {
                        display: none;
                    }

                    .status-details {
                        min-width: 180px;
                    }
                }

                /* Pulse animation for status updates */
                @keyframes statusPulse {
                    0% { opacity: 0.6; }
                    50% { opacity: 1; }
                    100% { opacity: 0.6; }
                }

                .status-icon.updating {
                    animation: statusPulse 1.5s ease-in-out infinite;
                }
            </style>
        `;

        document.head.insertAdjacentHTML('beforeend', styles);
    }

    startStatusUpdates() {
        // Initial update
        this.updateStatus();

        // Set up periodic updates
        setInterval(() => {
            this.updateStatus();
        }, this.updateInterval);

        console.log('🔄 Status updates started');
    }

    async updateStatus() {
        try {
            const response = await fetch('/api/health-status');
            const data = await response.json();

            this.statusData = data;
            this.updateStatusDisplay();

        } catch (error) {
            console.error('❌ Failed to fetch status:', error);
            this.handleStatusError();
        }
    }

    updateStatusDisplay() {
        const { health, websockets } = this.statusData;

        // Update API status
        if (health) {
            this.updateStatusIcon('apiStatusIcon', health.overall);

            // Update individual API statuses
            Object.entries(health.services).forEach(([name, status]) => {
                const element = document.getElementById(`${name}-status`);
                if (element) {
                    element.textContent = status.status.toUpperCase();
                    element.className = `status-value ${status.status}`;
                }
            });
        }

        // Update WebSocket status
        if (websockets) {
            this.updateStatusIcon('websocketStatusIcon', websockets.overall);

            // Update individual WebSocket statuses
            Object.entries(websockets.connections).forEach(([name, status]) => {
                const element = document.getElementById(`${name}-status`);
                if (element) {
                    element.textContent = status.status.toUpperCase();
                    element.className = `status-value ${status.status}`;
                }
            });
        }

        // Update overall status
        const overallStatus = this.determineOverallStatus();
        this.updateStatusIcon('overallStatusIcon', overallStatus);

        const overallText = document.getElementById('overallStatusText');
        if (overallText) {
            overallText.textContent = overallStatus.toUpperCase();
        }

        // Update timestamp
        const timestampElement = document.getElementById('statusTimestamp');
        if (timestampElement) {
            timestampElement.textContent = new Date().toLocaleTimeString();
        }
    }

    updateStatusIcon(iconId, status) {
        const iconElement = document.getElementById(iconId);
        if (iconElement) {
            // Remove all status classes
            iconElement.classList.remove('healthy', 'degraded', 'unhealthy', 'unknown', 'updating');

            // Add current status class
            iconElement.classList.add(status);

            // Add updating animation temporarily
            iconElement.classList.add('updating');
            setTimeout(() => {
                iconElement.classList.remove('updating');
            }, 1000);
        }
    }

    determineOverallStatus() {
        const { health, websockets } = this.statusData;

        if (!health || !websockets) return 'unknown';

        if (health.overall === 'healthy' && websockets.overall === 'healthy') {
            return 'healthy';
        } else if (health.overall === 'unhealthy' || websockets.overall === 'unhealthy') {
            return 'unhealthy';
        } else {
            return 'degraded';
        }
    }

    handleStatusError() {
        // Update all status indicators to show error state
        const statusIcons = ['apiStatusIcon', 'websocketStatusIcon', 'databaseStatusIcon', 'overallStatusIcon'];
        statusIcons.forEach(iconId => {
            this.updateStatusIcon(iconId, 'unhealthy');
        });

        // Update timestamp to show error
        const timestampElement = document.getElementById('statusTimestamp');
        if (timestampElement) {
            timestampElement.textContent = 'Error updating';
        }
    }

    setupWebSocketConnection() {
        try {
            this.websocket = new WebSocket(`ws://${window.location.host}/status-updates`);

            this.websocket.onopen = () => {
                console.log('🔌 Status WebSocket connected');
                this.retryCount = 0;
            };

            this.websocket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'status-update') {
                        this.statusData = data.data;
                        this.updateStatusDisplay();
                    }
                } catch (error) {
                    console.error('❌ Failed to parse WebSocket message:', error);
                }
            };

            this.websocket.onclose = () => {
                console.log('🔌 Status WebSocket disconnected');
                this.reconnectWebSocket();
            };

            this.websocket.onerror = (error) => {
                console.error('❌ Status WebSocket error:', error);
            };

        } catch (error) {
            console.error('❌ Failed to setup WebSocket connection:', error);
        }
    }

    reconnectWebSocket() {
        if (this.retryCount < this.maxRetries) {
            this.retryCount++;
            const delay = Math.min(1000 * Math.pow(2, this.retryCount), 30000);

            console.log(`🔄 Retrying WebSocket connection in ${delay}ms (attempt ${this.retryCount}/${this.maxRetries})`);

            setTimeout(() => {
                this.setupWebSocketConnection();
            }, delay);
        } else {
            console.error('❌ Max WebSocket retry attempts reached');
        }
    }

    destroy() {
        if (this.websocket) {
            this.websocket.close();
        }
    }
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.statusIndicators = new StatusIndicators();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StatusIndicators;
}