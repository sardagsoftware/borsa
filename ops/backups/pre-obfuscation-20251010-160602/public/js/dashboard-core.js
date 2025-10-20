/**
 * 🏢 ENTERPRISE DASHBOARD MASTER CONTROL CENTER
 * Core JavaScript functionality for unified management interface
 * Real-time monitoring, module switching, and system interactions
 */

class LyDianDashboard {
    constructor() {
        this.currentModule = 'overview';
        this.isLoading = false;
        this.notifications = [];
        this.websocket = null;
        this.updateInterval = null;

        this.init();
    }

    init() {
        console.log('🏢 AiLydian Enterprise Dashboard initializing...');

        // Initialize all components
        this.initModuleSwitching();
        this.initDropdowns();
        this.initNotifications();
        this.initWebSocket();
        this.initRealTimeUpdates();
        this.initKeyboardShortcuts();
        this.initSearchFunctionality();
        this.loadInitialData();

        console.log('✅ Dashboard initialized successfully');
    }

    // ========================================
    // MODULE SWITCHING SYSTEM
    // ========================================

    initModuleSwitching() {
        const navItems = document.querySelectorAll('.nav-item');
        const modules = document.querySelectorAll('.dashboard-module');

        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const moduleId = item.dataset.module;
                this.switchModule(moduleId);
            });
        });
    }

    switchModule(moduleId) {
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-module="${moduleId}"]`).classList.add('active');

        // Update modules
        document.querySelectorAll('.dashboard-module').forEach(module => {
            module.classList.remove('active');
        });
        document.getElementById(`${moduleId}-module`).classList.add('active');

        this.currentModule = moduleId;
        this.loadModuleData(moduleId);

        // Analytics tracking
        this.trackModuleSwitch(moduleId);
    }

    // ========================================
    // DROPDOWN FUNCTIONALITY
    // ========================================

    initDropdowns() {
        // Notification dropdown
        const notificationBtn = document.getElementById('notificationBtn');
        const notificationDropdown = document.getElementById('notificationDropdown');

        if (notificationBtn && notificationDropdown) {
            notificationBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleDropdown(notificationDropdown);
            });
        }

        // Profile dropdown
        const profileBtn = document.getElementById('profileBtn');
        const profileDropdown = document.getElementById('profileDropdown');

        if (profileBtn && profileDropdown) {
            profileBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleDropdown(profileDropdown);
            });
        }

        // Close dropdowns when clicking outside
        document.addEventListener('click', () => {
            this.closeAllDropdowns();
        });
    }

    toggleDropdown(dropdown) {
        const isActive = dropdown.classList.contains('active');
        this.closeAllDropdowns();

        if (!isActive) {
            dropdown.classList.add('active');
        }
    }

    closeAllDropdowns() {
        document.querySelectorAll('.notification-dropdown, .profile-dropdown').forEach(dropdown => {
            dropdown.classList.remove('active');
        });
    }

    // ========================================
    // NOTIFICATION SYSTEM
    // ========================================

    initNotifications() {
        this.updateNotificationCount();

        // Mark all as read functionality
        const markAllReadBtn = document.querySelector('.mark-all-read');
        if (markAllReadBtn) {
            markAllReadBtn.addEventListener('click', () => {
                this.markAllNotificationsRead();
            });
        }
    }

    addNotification(type, title, message) {
        const notification = {
            id: Date.now(),
            type,
            title,
            message,
            timestamp: new Date(),
            read: false
        };

        this.notifications.unshift(notification);
        this.updateNotificationDisplay();
        this.showAlert(type, `${title}: ${message}`);
    }

    updateNotificationDisplay() {
        const notificationList = document.querySelector('.notification-list');
        const notificationCount = document.querySelector('.notification-count');

        if (notificationList) {
            notificationList.innerHTML = this.notifications.slice(0, 10).map(notification => `
                <div class="notification-item ${notification.read ? '' : 'unread'}">
                    <div class="notification-icon ${notification.type}">
                        <i class="fas ${this.getNotificationIcon(notification.type)}"></i>
                    </div>
                    <div class="notification-content">
                        <h4>${notification.title}</h4>
                        <p>${notification.message}</p>
                        <span class="notification-time">${this.formatTime(notification.timestamp)}</span>
                    </div>
                </div>
            `).join('');
        }

        if (notificationCount) {
            const unreadCount = this.notifications.filter(n => !n.read).length;
            notificationCount.textContent = unreadCount;
            notificationCount.style.display = unreadCount > 0 ? 'flex' : 'none';
        }
    }

    getNotificationIcon(type) {
        const icons = {
            security: 'fa-shield-alt',
            success: 'fa-check-circle',
            warning: 'fa-exclamation-triangle',
            error: 'fa-times-circle',
            info: 'fa-info-circle'
        };
        return icons[type] || 'fa-bell';
    }

    markAllNotificationsRead() {
        this.notifications.forEach(notification => {
            notification.read = true;
        });
        this.updateNotificationDisplay();
    }

    updateNotificationCount() {
        const count = this.notifications.filter(n => !n.read).length;
        const badge = document.querySelector('.notification-count');
        if (badge) {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'flex' : 'none';
        }
    }

    // ========================================
    // WEBSOCKET CONNECTION
    // ========================================

    initWebSocket() {
        if (this.websocket) {
            this.websocket.close();
        }

        try {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${protocol}//${window.location.host}/ws`;

            this.websocket = new WebSocket(wsUrl);

            this.websocket.onopen = () => {
                console.log('✅ WebSocket connected');
                this.updateConnectionStatus(true);
            };

            this.websocket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.handleWebSocketMessage(data);
            };

            this.websocket.onclose = () => {
                console.log('❌ WebSocket disconnected');
                this.updateConnectionStatus(false);
                // Reconnect after 5 seconds
                setTimeout(() => this.initWebSocket(), 5000);
            };

            this.websocket.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.updateConnectionStatus(false);
            };
        } catch (error) {
            console.error('WebSocket initialization failed:', error);
            this.updateConnectionStatus(false);
        }
    }

    handleWebSocketMessage(data) {
        switch (data.type) {
            case 'system_status':
                this.updateSystemStatus(data.payload);
                break;
            case 'notification':
                this.addNotification(data.payload.type, data.payload.title, data.payload.message);
                break;
            case 'kpi_update':
                this.updateKPIs(data.payload);
                break;
            case 'security_alert':
                this.handleSecurityAlert(data.payload);
                break;
            case 'ai_model_status':
                this.updateAIModelStatus(data.payload);
                break;
            default:
                console.log('Unknown WebSocket message type:', data.type);
        }
    }

    updateConnectionStatus(connected) {
        const statusIndicator = document.querySelector('.status-indicator');
        const statusText = document.querySelector('.chat-status span');

        if (statusIndicator && statusText) {
            if (connected) {
                statusIndicator.className = 'status-indicator active';
                statusText.textContent = 'Çevrimiçi';
            } else {
                statusIndicator.className = 'status-indicator error';
                statusText.textContent = 'Bağlantı Kesik';
            }
        }
    }

    // ========================================
    // REAL-TIME UPDATES
    // ========================================

    initRealTimeUpdates() {
        // Update every 30 seconds
        this.updateInterval = setInterval(() => {
            this.updateDashboardData();
        }, 30000);

        // Initial update
        this.updateDashboardData();
    }

    async updateDashboardData() {
        if (this.isLoading) return;

        try {
            this.isLoading = true;

            // Fetch latest system metrics
            const response = await fetch('/api/dashboard/metrics');
            if (response.ok) {
                const data = await response.json();
                this.updateKPIs(data.kpis);
                this.updateSystemStatus(data.systemStatus);
                this.updateCharts(data.charts);
            }
        } catch (error) {
            console.error('Failed to update dashboard data:', error);
            this.addNotification('error', 'Sistem Hatası', 'Dashboard verileri güncellenemedi');
        } finally {
            this.isLoading = false;
        }
    }

    updateKPIs(kpis) {
        Object.entries(kpis).forEach(([key, value]) => {
            const kpiCard = document.querySelector(`.kpi-card.${key}`);
            if (kpiCard) {
                const valueElement = kpiCard.querySelector('.kpi-value');
                const changeElement = kpiCard.querySelector('.kpi-change span');

                if (valueElement) valueElement.textContent = value.current;
                if (changeElement) changeElement.textContent = value.change;

                // Update change indicator
                const changeContainer = kpiCard.querySelector('.kpi-change');
                if (changeContainer) {
                    changeContainer.className = `kpi-change ${value.trend}`;
                }
            }
        });
    }

    updateSystemStatus(statusData) {
        Object.entries(statusData).forEach(([system, status]) => {
            const statusCard = document.querySelector(`.status-card:has(h3:contains("${system}"))`);
            if (statusCard) {
                const indicator = statusCard.querySelector('.status-indicator');
                if (indicator) {
                    indicator.className = `status-indicator ${status.health}`;
                }

                // Update metrics
                const metrics = statusCard.querySelectorAll('.metric-value');
                if (metrics.length > 0 && status.metrics) {
                    metrics.forEach((metric, index) => {
                        if (status.metrics[index]) {
                            metric.textContent = status.metrics[index];
                        }
                    });
                }
            }
        });
    }

    // ========================================
    // SEARCH FUNCTIONALITY
    // ========================================

    initSearchFunctionality() {
        const searchInput = document.getElementById('globalSearch');
        if (searchInput) {
            let searchTimeout;

            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.performSearch(e.target.value);
                }, 300);
            });

            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.performSearch(e.target.value);
                }
            });
        }
    }

    async performSearch(query) {
        if (!query.trim()) return;

        try {
            const response = await fetch('/api/dashboard/search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ query })
            });

            if (response.ok) {
                const results = await response.json();
                this.displaySearchResults(results);
            }
        } catch (error) {
            console.error('Search failed:', error);
        }
    }

    displaySearchResults(results) {
        // Implementation for search results display
        console.log('Search results:', results);
    }

    // ========================================
    // KEYBOARD SHORTCUTS
    // ========================================

    initKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Only handle shortcuts when not in input fields
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case '1':
                        e.preventDefault();
                        this.switchModule('overview');
                        break;
                    case '2':
                        e.preventDefault();
                        this.switchModule('security');
                        break;
                    case '3':
                        e.preventDefault();
                        this.switchModule('ai-management');
                        break;
                    case '4':
                        e.preventDefault();
                        this.switchModule('trading');
                        break;
                    case '5':
                        e.preventDefault();
                        this.switchModule('maps');
                        break;
                    case '6':
                        e.preventDefault();
                        this.switchModule('weather');
                        break;
                    case 'k':
                        e.preventDefault();
                        document.getElementById('globalSearch')?.focus();
                        break;
                    case 'r':
                        e.preventDefault();
                        this.refreshCurrentModule();
                        break;
                }
            }
        });
    }

    // ========================================
    // MODULE DATA LOADING
    // ========================================

    async loadModuleData(moduleId) {
        this.showLoading();

        try {
            const response = await fetch(`/api/dashboard/modules/${moduleId}`);
            if (response.ok) {
                const data = await response.json();
                this.populateModuleData(moduleId, data);
            }
        } catch (error) {
            console.error(`Failed to load module data for ${moduleId}:`, error);
            this.addNotification('error', 'Modül Hatası', `${moduleId} modülü yüklenemedi`);
        } finally {
            this.hideLoading();
        }
    }

    populateModuleData(moduleId, data) {
        switch (moduleId) {
            case 'overview':
                this.populateOverviewData(data);
                break;
            case 'security':
                this.populateSecurityData(data);
                break;
            case 'ai-management':
                this.populateAIData(data);
                break;
            case 'trading':
                this.populateTradingData(data);
                break;
            case 'maps':
                this.populateMapsData(data);
                break;
            case 'weather':
                this.populateWeatherData(data);
                break;
        }
    }

    populateOverviewData(data) {
        // Update KPI cards with real data
        if (data.kpis) {
            this.updateKPIs(data.kpis);
        }

        // Update charts
        if (data.charts) {
            this.updateCharts(data.charts);
        }

        // Update system status
        if (data.systemStatus) {
            this.updateSystemStatus(data.systemStatus);
        }
    }

    populateSecurityData(data) {
        // Update threat level
        if (data.threatLevel) {
            const threatInfo = document.querySelector('.threat-info h3');
            if (threatInfo) {
                threatInfo.textContent = `Threat Level: ${data.threatLevel.level.toUpperCase()}`;
            }
        }

        // Update security metrics
        if (data.metrics) {
            Object.entries(data.metrics).forEach(([key, value]) => {
                const metricElement = document.querySelector(`.security-metric:has(h4:contains("${key}")) .metric-number`);
                if (metricElement) {
                    metricElement.textContent = value;
                }
            });
        }
    }

    populateAIData(data) {
        // Update AI model status
        if (data.models) {
            this.updateAIModelStatus(data.models);
        }
    }

    updateAIModelStatus(models) {
        const modelsGrid = document.querySelector('.ai-models-grid');
        if (modelsGrid && models) {
            modelsGrid.innerHTML = models.map(model => `
                <div class="ai-model-card">
                    <div class="model-header">
                        <h3>${model.name}</h3>
                        <span class="model-status ${model.status.toLowerCase()}">${model.status}</span>
                    </div>
                    <div class="model-metrics">
                        <div class="metric">
                            <span class="label">Requests/min</span>
                            <span class="value">${model.requestsPerMin}</span>
                        </div>
                        <div class="metric">
                            <span class="label">Avg Response</span>
                            <span class="value">${model.avgResponse}</span>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    }

    populateTradingData(data) {
        // Update market indices
        if (data.indices) {
            const indicesContainer = document.querySelector('.market-indices');
            if (indicesContainer) {
                indicesContainer.innerHTML = data.indices.map(index => `
                    <div class="index-card">
                        <h4>${index.name}</h4>
                        <span class="index-value">${index.value}</span>
                        <span class="index-change ${index.change >= 0 ? 'positive' : 'negative'}">
                            ${index.change >= 0 ? '+' : ''}${index.change}%
                        </span>
                    </div>
                `).join('');
            }
        }
    }

    populateMapsData(data) {
        // Initialize Azure Maps if not already done
        if (data.mapConfig) {
            this.initializeAzureMaps(data.mapConfig);
        }
    }

    populateWeatherData(data) {
        // Update weather widget
        if (data.currentWeather) {
            const weather = data.currentWeather;
            const weatherLocation = document.querySelector('.weather-location');
            const weatherTemp = document.querySelector('.weather-temp');
            const weatherDesc = document.querySelector('.weather-desc');

            if (weatherLocation) weatherLocation.textContent = weather.location;
            if (weatherTemp) weatherTemp.textContent = `${weather.temperature}°C`;
            if (weatherDesc) weatherDesc.textContent = weather.description;
        }
    }

    // ========================================
    // CHARTS MANAGEMENT
    // ========================================

    updateCharts(chartsData) {
        // Revenue chart
        if (chartsData.revenue) {
            this.updateRevenueChart(chartsData.revenue);
        }

        // User activity chart
        if (chartsData.userActivity) {
            this.updateUserActivityChart(chartsData.userActivity);
        }
    }

    updateRevenueChart(data) {
        const canvas = document.getElementById('revenueChart');
        if (canvas) {
            // Chart.js implementation would go here
            const ctx = canvas.getContext('2d');
            // Placeholder for actual chart implementation
            console.log('Revenue chart data:', data);
        }
    }

    updateUserActivityChart(data) {
        const canvas = document.getElementById('userActivityChart');
        if (canvas) {
            // Chart.js implementation would go here
            const ctx = canvas.getContext('2d');
            // Placeholder for actual chart implementation
            console.log('User activity chart data:', data);
        }
    }

    // ========================================
    // UTILITY FUNCTIONS
    // ========================================

    showLoading() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.classList.add('active');
        }
    }

    hideLoading() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.classList.remove('active');
        }
    }

    showAlert(type, message) {
        const alertContainer = document.getElementById('alertContainer');
        if (!alertContainer) return;

        const alert = document.createElement('div');
        alert.className = `alert ${type}`;
        alert.textContent = message;

        alertContainer.appendChild(alert);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            alert.remove();
        }, 5000);
    }

    refreshCurrentModule() {
        this.loadModuleData(this.currentModule);
        this.addNotification('info', 'Yenilendi', `${this.currentModule} modülü güncellendi`);
    }

    formatTime(timestamp) {
        const now = new Date();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);

        if (minutes < 1) return 'Az önce';
        if (minutes < 60) return `${minutes} dakika önce`;
        if (minutes < 1440) return `${Math.floor(minutes / 60)} saat önce`;
        return timestamp.toLocaleDateString('tr-TR');
    }

    trackModuleSwitch(moduleId) {
        // Analytics tracking
        if (typeof gtag !== 'undefined') {
            gtag('event', 'module_switch', {
                'module_name': moduleId,
                'timestamp': new Date().toISOString()
            });
        }
    }

    async loadInitialData() {
        try {
            // Load initial notifications
            const notificationsResponse = await fetch('/api/dashboard/notifications');
            if (notificationsResponse.ok) {
                const notifications = await notificationsResponse.json();
                this.notifications = notifications;
                this.updateNotificationDisplay();
            }

            // Load initial module data
            await this.loadModuleData(this.currentModule);

        } catch (error) {
            console.error('Failed to load initial data:', error);
        }
    }

    handleSecurityAlert(alertData) {
        this.addNotification('security', 'Güvenlik Uyarısı', alertData.message);

        // Play alert sound if available
        const alertSound = document.getElementById('alertSound');
        if (alertSound) {
            alertSound.play().catch(e => console.log('Could not play alert sound'));
        }
    }

    initializeAzureMaps(config) {
        // Azure Maps initialization would go here
        console.log('Initializing Azure Maps with config:', config);
    }

    // ========================================
    // CLEANUP
    // ========================================

    destroy() {
        if (this.websocket) {
            this.websocket.close();
        }

        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }

        // Remove event listeners
        document.removeEventListener('keydown', this.keyboardHandler);
        document.removeEventListener('click', this.closeAllDropdowns);
    }
}

// ========================================
// DASHBOARD INITIALIZATION
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    // Initialize dashboard
    window.ailydianDashboard = new LyDianDashboard();

    // Handle refresh button
    const refreshBtn = document.getElementById('refreshData');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            window.ailydianDashboard.refreshCurrentModule();
        });
    }

    // Handle export button
    const exportBtn = document.getElementById('exportReport');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            window.ailydianDashboard.exportReport();
        });
    }

    console.log('🏢 AiLydian Enterprise Dashboard loaded successfully');
});

// Export for external access
window.LyDianDashboard = LyDianDashboard;