// Azure API Gateway and WebSocket Integration
// Enterprise-grade API management and real-time communication for AiLydian Ultra Pro

const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const AzureConfigManager = require('./azure-config');
const AzureContainerAppsService = require('./azure-container-apps');
const AzureDevOpsService = require('./azure-devops');
const AzureMapsService = require('./azure-maps');
const AzureWeatherService = require('./azure-weather');
const AzureLoggerService = require('./azure-logger');
const { RateLimiterMemory } = require('rate-limiter-flexible');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');

class AzureAPIGateway {
    constructor() {
        this.app = express();
        this.server = null;
        this.wss = null;
        this.logger = null;
        this.services = {};
        this.rateLimiters = new Map();
        this.activeConnections = new Map();
        this.subscriptions = new Map();

        this.initialize();
    }

    /**
     * Initialize API Gateway and services
     */
    async initialize() {
        try {
            // Initialize logger first
            this.logger = new AzureLoggerService();
            await this.logger.initialize();

            // Initialize Azure services
            await this.initializeServices();

            // Setup Express middleware
            this.setupMiddleware();

            // Setup API routes
            this.setupRoutes();

            // Setup WebSocket server
            this.setupWebSocket();

            // Setup rate limiters
            this.setupRateLimiters();

            console.log('Azure API Gateway initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Azure API Gateway:', error);
            throw error;
        }
    }

    /**
     * Initialize all Azure services
     */
    async initializeServices() {
        try {
            this.services.config = new AzureConfigManager();
            this.services.containerApps = new AzureContainerAppsService();
            this.services.devOps = new AzureDevOpsService();
            this.services.maps = new AzureMapsService();
            this.services.weather = new AzureWeatherService();

            // Wait for all services to initialize
            await Promise.all([
                this.services.config.initializeCredentials(),
                this.services.containerApps.initialize(),
                this.services.devOps.initialize(),
                this.services.maps.initialize(),
                this.services.weather.initialize()
            ]);

            console.log('All Azure services initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Azure services:', error);
            throw error;
        }
    }

    /**
     * Setup Express middleware
     */
    setupMiddleware() {
        // Security middleware
        this.app.use(helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    scriptSrc: ["'self'", "'unsafe-inline'"],
                    imgSrc: ["'self'", "data:", "https:"],
                    connectSrc: ["'self'", "wss:", "https:"]
                }
            },
            hsts: {
                maxAge: 31536000,
                includeSubDomains: true,
                preload: true
            }
        }));

        // CORS configuration
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGINS || '*');
            res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

            if (req.method === 'OPTIONS') {
                res.sendStatus(200);
            } else {
                next();
            }
        });

        // Body parsing
        this.app.use(express.json({ limit: '50mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '50mb' }));

        // Request logging middleware
        this.app.use((req, res, next) => {
            const startTime = Date.now();

            res.on('finish', () => {
                const responseTime = Date.now() - startTime;
                this.logger.logApiCall(req.method, req.url, res.statusCode, responseTime, {
                    userAgent: req.get('User-Agent'),
                    ip: req.ip,
                    userId: req.user?.id,
                    sessionId: req.sessionID
                });
            });

            next();
        });

        // Error handling middleware
        this.app.use((error, req, res, next) => {
            this.logger.logError(error, {
                url: req.url,
                method: req.method,
                ip: req.ip,
                userAgent: req.get('User-Agent')
            }, 'api-gateway');

            res.status(error.status || 500).json({
                success: false,
                error: {
                    message: error.message,
                    code: error.code || 'INTERNAL_ERROR',
                    timestamp: new Date().toISOString()
                }
            });
        });
    }

    /**
     * Setup API routes
     */
    setupRoutes() {
        // Health check endpoints
        this.app.get('/health', this.handleHealthCheck.bind(this));
        this.app.get('/health/:service', this.handleServiceHealthCheck.bind(this));

        // Azure Container Apps endpoints
        this.app.post('/api/azure/container-apps', this.authenticateRequest.bind(this), this.handleCreateContainerApp.bind(this));
        this.app.get('/api/azure/container-apps', this.authenticateRequest.bind(this), this.handleListContainerApps.bind(this));
        this.app.put('/api/azure/container-apps/:name/scale', this.authenticateRequest.bind(this), this.handleScaleContainerApp.bind(this));
        this.app.delete('/api/azure/container-apps/:name', this.authenticateRequest.bind(this), this.handleDeleteContainerApp.bind(this));

        // Azure DevOps endpoints
        this.app.post('/api/azure/devops/pipelines', this.authenticateRequest.bind(this), this.handleCreatePipeline.bind(this));
        this.app.post('/api/azure/devops/pipelines/:id/run', this.authenticateRequest.bind(this), this.handleRunPipeline.bind(this));
        this.app.get('/api/azure/devops/pipelines/:id/runs', this.authenticateRequest.bind(this), this.handleGetPipelineRuns.bind(this));
        this.app.get('/api/azure/devops/project', this.authenticateRequest.bind(this), this.handleGetProjectInfo.bind(this));

        // Azure Maps endpoints
        this.app.get('/api/azure/maps/search', this.rateLimitRequest.bind(this), this.handleMapsSearch.bind(this));
        this.app.get('/api/azure/maps/route', this.rateLimitRequest.bind(this), this.handleMapsRoute.bind(this));
        this.app.get('/api/azure/maps/geocode/reverse', this.rateLimitRequest.bind(this), this.handleReverseGeocode.bind(this));
        this.app.get('/api/azure/maps/timezone', this.rateLimitRequest.bind(this), this.handleGetTimezone.bind(this));

        // Azure Weather endpoints
        this.app.get('/api/azure/weather/current', this.rateLimitRequest.bind(this), this.handleCurrentWeather.bind(this));
        this.app.get('/api/azure/weather/forecast/hourly', this.rateLimitRequest.bind(this), this.handleHourlyForecast.bind(this));
        this.app.get('/api/azure/weather/forecast/daily', this.rateLimitRequest.bind(this), this.handleDailyForecast.bind(this));
        this.app.get('/api/azure/weather/alerts', this.rateLimitRequest.bind(this), this.handleWeatherAlerts.bind(this));
        this.app.get('/api/azure/weather/summary', this.rateLimitRequest.bind(this), this.handleWeatherSummary.bind(this));

        // Configuration endpoints
        this.app.get('/api/azure/config', this.authenticateRequest.bind(this), this.handleGetConfig.bind(this));
        this.app.put('/api/azure/config', this.authenticateRequest.bind(this), this.handleUpdateConfig.bind(this));

        // Logging and monitoring endpoints
        this.app.get('/api/azure/logs/stats', this.authenticateRequest.bind(this), this.handleGetLogStats.bind(this));
        this.app.get('/api/azure/logs/export', this.authenticateRequest.bind(this), this.handleExportLogs.bind(this));
    }

    /**
     * Setup WebSocket server for real-time updates
     */
    setupWebSocket() {
        this.server = http.createServer(this.app);
        this.wss = new WebSocket.Server({
            server: this.server,
            path: '/ws',
            verifyClient: this.verifyWebSocketClient.bind(this)
        });

        this.wss.on('connection', (ws, req) => {
            const connectionId = this.generateConnectionId();

            // Store connection
            this.activeConnections.set(connectionId, {
                ws,
                id: connectionId,
                connectedAt: new Date(),
                lastActivity: new Date(),
                subscriptions: new Set(),
                ip: req.socket.remoteAddress,
                userAgent: req.headers['user-agent']
            });

            this.logger.logWebSocketEvent('connection_established', connectionId, {
                ip: req.socket.remoteAddress,
                userAgent: req.headers['user-agent']
            });

            // Setup message handlers
            ws.on('message', (message) => {
                this.handleWebSocketMessage(connectionId, message);
            });

            ws.on('close', () => {
                this.handleWebSocketClose(connectionId);
            });

            ws.on('error', (error) => {
                this.handleWebSocketError(connectionId, error);
            });

            // Send welcome message
            this.sendWebSocketMessage(connectionId, {
                type: 'connected',
                connectionId,
                timestamp: new Date().toISOString()
            });

            // Setup ping/pong for connection health
            this.setupWebSocketPing(connectionId);
        });
    }

    /**
     * Setup rate limiters for different endpoints
     */
    setupRateLimiters() {
        // General API rate limiter
        this.rateLimiters.set('api', new RateLimiterMemory({
            keyGenerator: (req) => req.ip,
            points: 100, // Number of requests
            duration: 60, // Per 60 seconds
        }));

        // Maps API rate limiter (more restrictive)
        this.rateLimiters.set('maps', new RateLimiterMemory({
            keyGenerator: (req) => req.ip,
            points: 50,
            duration: 60,
        }));

        // Weather API rate limiter
        this.rateLimiters.set('weather', new RateLimiterMemory({
            keyGenerator: (req) => req.ip,
            points: 30,
            duration: 60,
        }));

        // Admin operations rate limiter
        this.rateLimiters.set('admin', new RateLimiterMemory({
            keyGenerator: (req) => req.ip,
            points: 10,
            duration: 60,
        }));
    }

    /**
     * Authentication middleware
     */
    async authenticateRequest(req, res, next) {
        try {
            const token = req.headers.authorization?.replace('Bearer ', '');

            if (!token) {
                return res.status(401).json({
                    success: false,
                    error: { message: 'Authentication token required', code: 'AUTH_TOKEN_MISSING' }
                });
            }

            // Verify JWT token
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
            req.user = decoded;

            this.logger.logSecurityEvent('api_authenticated', {
                userId: decoded.id,
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                endpoint: req.path
            }, 'info');

            next();
        } catch (error) {
            this.logger.logSecurityEvent('authentication_failed', {
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                endpoint: req.path,
                error: error.message
            }, 'warn');

            res.status(401).json({
                success: false,
                error: { message: 'Invalid authentication token', code: 'AUTH_TOKEN_INVALID' }
            });
        }
    }

    /**
     * Rate limiting middleware
     */
    async rateLimitRequest(req, res, next) {
        try {
            const limiterType = this.getRateLimiterType(req.path);
            const limiter = this.rateLimiters.get(limiterType);

            if (limiter) {
                await limiter.consume(req.ip);
            }

            next();
        } catch (rateLimitRes) {
            this.logger.logSecurityEvent('rate_limit_exceeded', {
                ip: req.ip,
                endpoint: req.path,
                remainingPoints: rateLimitRes.remainingPoints,
                resetTime: new Date(Date.now() + rateLimitRes.msBeforeNext)
            }, 'warn');

            res.status(429).json({
                success: false,
                error: {
                    message: 'Rate limit exceeded',
                    code: 'RATE_LIMIT_EXCEEDED',
                    resetTime: new Date(Date.now() + rateLimitRes.msBeforeNext)
                }
            });
        }
    }

    /**
     * Get rate limiter type based on endpoint
     */
    getRateLimiterType(path) {
        if (path.includes('/maps/')) return 'maps';
        if (path.includes('/weather/')) return 'weather';
        if (path.includes('/config') || path.includes('/logs/')) return 'admin';
        return 'api';
    }

    /**
     * Health check handler
     */
    async handleHealthCheck(req, res) {
        try {
            const healthStatuses = await Promise.all([
                this.services.config.getHealthStatus(),
                this.services.containerApps.getHealthStatus(),
                this.services.devOps.getHealthStatus(),
                this.services.maps.getHealthStatus(),
                this.services.weather.getHealthStatus(),
                this.logger.getHealthStatus()
            ]);

            const overallStatus = healthStatuses.every(status =>
                status.status === 'healthy' || status.credentials === 'healthy'
            ) ? 'healthy' : 'degraded';

            res.json({
                success: true,
                status: overallStatus,
                timestamp: new Date().toISOString(),
                services: {
                    config: healthStatuses[0],
                    containerApps: healthStatuses[1],
                    devOps: healthStatuses[2],
                    maps: healthStatuses[3],
                    weather: healthStatuses[4],
                    logger: healthStatuses[5]
                },
                websocket: {
                    activeConnections: this.activeConnections.size,
                    subscriptions: this.subscriptions.size
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: { message: error.message, code: 'HEALTH_CHECK_FAILED' }
            });
        }
    }

    /**
     * Service-specific health check handler
     */
    async handleServiceHealthCheck(req, res) {
        try {
            const serviceName = req.params.service;
            const service = this.services[serviceName];

            if (!service || !service.getHealthStatus) {
                return res.status(404).json({
                    success: false,
                    error: { message: 'Service not found', code: 'SERVICE_NOT_FOUND' }
                });
            }

            const healthStatus = await service.getHealthStatus();
            res.json({
                success: true,
                service: serviceName,
                ...healthStatus
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: { message: error.message, code: 'SERVICE_HEALTH_CHECK_FAILED' }
            });
        }
    }

    // Container Apps handlers
    async handleCreateContainerApp(req, res) {
        try {
            const { name, configuration } = req.body;
            const result = await this.services.containerApps.createContainerApp(name, configuration);

            // Broadcast to WebSocket subscribers
            this.broadcastToSubscribers('containerApps', {
                type: 'container_app_created',
                data: result,
                timestamp: new Date().toISOString()
            });

            res.json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                error: { message: error.message, code: 'CONTAINER_APP_CREATE_FAILED' }
            });
        }
    }

    async handleListContainerApps(req, res) {
        try {
            const result = await this.services.containerApps.listContainerApps();
            res.json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                error: { message: error.message, code: 'CONTAINER_APP_LIST_FAILED' }
            });
        }
    }

    async handleScaleContainerApp(req, res) {
        try {
            const { name } = req.params;
            const scalingConfig = req.body;
            const result = await this.services.containerApps.scaleContainerApp(name, scalingConfig);

            this.broadcastToSubscribers('containerApps', {
                type: 'container_app_scaled',
                appName: name,
                data: result,
                timestamp: new Date().toISOString()
            });

            res.json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                error: { message: error.message, code: 'CONTAINER_APP_SCALE_FAILED' }
            });
        }
    }

    async handleDeleteContainerApp(req, res) {
        try {
            const { name } = req.params;
            const result = await this.services.containerApps.deleteContainerApp(name);

            this.broadcastToSubscribers('containerApps', {
                type: 'container_app_deleted',
                appName: name,
                data: result,
                timestamp: new Date().toISOString()
            });

            res.json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                error: { message: error.message, code: 'CONTAINER_APP_DELETE_FAILED' }
            });
        }
    }

    // DevOps handlers
    async handleCreatePipeline(req, res) {
        try {
            const pipelineDefinition = req.body;
            const result = await this.services.devOps.createPipeline(pipelineDefinition);

            this.broadcastToSubscribers('devOps', {
                type: 'pipeline_created',
                data: result,
                timestamp: new Date().toISOString()
            });

            res.json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                error: { message: error.message, code: 'PIPELINE_CREATE_FAILED' }
            });
        }
    }

    async handleRunPipeline(req, res) {
        try {
            const { id } = req.params;
            const parameters = req.body;
            const result = await this.services.devOps.runPipeline(id, parameters);

            this.broadcastToSubscribers('devOps', {
                type: 'pipeline_run_started',
                pipelineId: id,
                data: result,
                timestamp: new Date().toISOString()
            });

            res.json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                error: { message: error.message, code: 'PIPELINE_RUN_FAILED' }
            });
        }
    }

    async handleGetPipelineRuns(req, res) {
        try {
            const { id } = req.params;
            const count = parseInt(req.query.count) || 10;
            const result = await this.services.devOps.getBuildHistory(id, count);
            res.json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                error: { message: error.message, code: 'PIPELINE_RUNS_FETCH_FAILED' }
            });
        }
    }

    async handleGetProjectInfo(req, res) {
        try {
            const result = await this.services.devOps.getProjectInfo();
            res.json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                error: { message: error.message, code: 'PROJECT_INFO_FETCH_FAILED' }
            });
        }
    }

    // Maps handlers
    async handleMapsSearch(req, res) {
        try {
            const { query, lat, lon, limit } = req.query;
            const options = { lat: parseFloat(lat), lon: parseFloat(lon), limit: parseInt(limit) };
            const result = await this.services.maps.searchPlaces(query, options);
            res.json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                error: { message: error.message, code: 'MAPS_SEARCH_FAILED' }
            });
        }
    }

    async handleMapsRoute(req, res) {
        try {
            const { waypoints, travelMode } = req.query;
            const parsedWaypoints = JSON.parse(waypoints);
            const options = { travelMode };
            const result = await this.services.maps.getRoute(parsedWaypoints, options);
            res.json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                error: { message: error.message, code: 'MAPS_ROUTE_FAILED' }
            });
        }
    }

    async handleReverseGeocode(req, res) {
        try {
            const { lat, lon } = req.query;
            const result = await this.services.maps.reverseGeocode(parseFloat(lat), parseFloat(lon));
            res.json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                error: { message: error.message, code: 'REVERSE_GEOCODE_FAILED' }
            });
        }
    }

    async handleGetTimezone(req, res) {
        try {
            const { lat, lon } = req.query;
            const result = await this.services.maps.getTimezone(parseFloat(lat), parseFloat(lon));
            res.json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                error: { message: error.message, code: 'TIMEZONE_FETCH_FAILED' }
            });
        }
    }

    // Weather handlers
    async handleCurrentWeather(req, res) {
        try {
            const { lat, lon, language, unit } = req.query;
            const options = { language, unit };
            const result = await this.services.weather.getCurrentConditions(parseFloat(lat), parseFloat(lon), options);
            res.json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                error: { message: error.message, code: 'CURRENT_WEATHER_FAILED' }
            });
        }
    }

    async handleHourlyForecast(req, res) {
        try {
            const { lat, lon, hours, language } = req.query;
            const options = { language };
            const result = await this.services.weather.getHourlyForecast(
                parseFloat(lat),
                parseFloat(lon),
                parseInt(hours) || 12,
                options
            );
            res.json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                error: { message: error.message, code: 'HOURLY_FORECAST_FAILED' }
            });
        }
    }

    async handleDailyForecast(req, res) {
        try {
            const { lat, lon, days, language } = req.query;
            const options = { language };
            const result = await this.services.weather.getDailyForecast(
                parseFloat(lat),
                parseFloat(lon),
                parseInt(days) || 5,
                options
            );
            res.json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                error: { message: error.message, code: 'DAILY_FORECAST_FAILED' }
            });
        }
    }

    async handleWeatherAlerts(req, res) {
        try {
            const { lat, lon, language } = req.query;
            const options = { language };
            const result = await this.services.weather.getSevereWeatherAlerts(parseFloat(lat), parseFloat(lon), options);
            res.json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                error: { message: error.message, code: 'WEATHER_ALERTS_FAILED' }
            });
        }
    }

    async handleWeatherSummary(req, res) {
        try {
            const { lat, lon, language } = req.query;
            const options = { language };
            const result = await this.services.weather.getWeatherSummary(parseFloat(lat), parseFloat(lon), options);
            res.json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                error: { message: error.message, code: 'WEATHER_SUMMARY_FAILED' }
            });
        }
    }

    // Configuration handlers
    async handleGetConfig(req, res) {
        try {
            const healthStatus = await this.services.config.getHealthStatus();
            res.json({
                success: true,
                configuration: healthStatus
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: { message: error.message, code: 'CONFIG_FETCH_FAILED' }
            });
        }
    }

    async handleUpdateConfig(req, res) {
        try {
            const { key, value } = req.body;
            const result = await this.services.config.setConfig(key, value);

            this.logger.logAuditEvent('config_updated', key, req.user?.id, {
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });

            res.json({
                success: true,
                message: `Configuration ${key} updated successfully`
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: { message: error.message, code: 'CONFIG_UPDATE_FAILED' }
            });
        }
    }

    // Logging handlers
    async handleGetLogStats(req, res) {
        try {
            const stats = await this.logger.getLogStatistics();
            res.json({
                success: true,
                statistics: stats
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: { message: error.message, code: 'LOG_STATS_FAILED' }
            });
        }
    }

    async handleExportLogs(req, res) {
        try {
            const { service, startDate, endDate, format } = req.query;
            const start = new Date(startDate);
            const end = new Date(endDate);

            const logs = await this.logger.exportLogs(service, start, end, format);

            if (format === 'csv') {
                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', `attachment; filename=${service}-logs-${startDate}-${endDate}.csv`);
                res.send(logs);
            } else {
                res.json({
                    success: true,
                    logs
                });
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                error: { message: error.message, code: 'LOG_EXPORT_FAILED' }
            });
        }
    }

    // WebSocket handlers
    verifyWebSocketClient(info) {
        // Add WebSocket authentication logic here
        return true; // For now, allow all connections
    }

    handleWebSocketMessage(connectionId, message) {
        try {
            const connection = this.activeConnections.get(connectionId);
            if (!connection) return;

            connection.lastActivity = new Date();
            const data = JSON.parse(message);

            this.logger.logWebSocketEvent('message_received', connectionId, {
                type: data.type,
                dataSize: message.length
            });

            switch (data.type) {
                case 'subscribe':
                    this.handleWebSocketSubscription(connectionId, data.service);
                    break;
                case 'unsubscribe':
                    this.handleWebSocketUnsubscription(connectionId, data.service);
                    break;
                case 'ping':
                    this.sendWebSocketMessage(connectionId, { type: 'pong', timestamp: new Date().toISOString() });
                    break;
                default:
                    this.sendWebSocketMessage(connectionId, {
                        type: 'error',
                        message: 'Unknown message type',
                        timestamp: new Date().toISOString()
                    });
            }
        } catch (error) {
            this.logger.logError(error, { connectionId }, 'websocket');
            this.sendWebSocketMessage(connectionId, {
                type: 'error',
                message: 'Invalid message format',
                timestamp: new Date().toISOString()
            });
        }
    }

    handleWebSocketSubscription(connectionId, service) {
        const connection = this.activeConnections.get(connectionId);
        if (!connection) return;

        connection.subscriptions.add(service);

        if (!this.subscriptions.has(service)) {
            this.subscriptions.set(service, new Set());
        }
        this.subscriptions.get(service).add(connectionId);

        this.logger.logWebSocketEvent('subscription_added', connectionId, { service });

        this.sendWebSocketMessage(connectionId, {
            type: 'subscribed',
            service,
            timestamp: new Date().toISOString()
        });
    }

    handleWebSocketUnsubscription(connectionId, service) {
        const connection = this.activeConnections.get(connectionId);
        if (!connection) return;

        connection.subscriptions.delete(service);

        if (this.subscriptions.has(service)) {
            this.subscriptions.get(service).delete(connectionId);
            if (this.subscriptions.get(service).size === 0) {
                this.subscriptions.delete(service);
            }
        }

        this.logger.logWebSocketEvent('subscription_removed', connectionId, { service });

        this.sendWebSocketMessage(connectionId, {
            type: 'unsubscribed',
            service,
            timestamp: new Date().toISOString()
        });
    }

    handleWebSocketClose(connectionId) {
        const connection = this.activeConnections.get(connectionId);
        if (!connection) return;

        // Remove from all subscriptions
        for (const service of connection.subscriptions) {
            if (this.subscriptions.has(service)) {
                this.subscriptions.get(service).delete(connectionId);
                if (this.subscriptions.get(service).size === 0) {
                    this.subscriptions.delete(service);
                }
            }
        }

        this.activeConnections.delete(connectionId);

        this.logger.logWebSocketEvent('connection_closed', connectionId, {
            duration: Date.now() - connection.connectedAt.getTime()
        });
    }

    handleWebSocketError(connectionId, error) {
        this.logger.logError(error, { connectionId }, 'websocket');
        this.handleWebSocketClose(connectionId);
    }

    sendWebSocketMessage(connectionId, message) {
        const connection = this.activeConnections.get(connectionId);
        if (!connection || connection.ws.readyState !== WebSocket.OPEN) return;

        try {
            connection.ws.send(JSON.stringify(message));
        } catch (error) {
            this.logger.logError(error, { connectionId }, 'websocket');
            this.handleWebSocketClose(connectionId);
        }
    }

    broadcastToSubscribers(service, message) {
        const subscribers = this.subscriptions.get(service);
        if (!subscribers) return;

        for (const connectionId of subscribers) {
            this.sendWebSocketMessage(connectionId, message);
        }
    }

    setupWebSocketPing(connectionId) {
        const connection = this.activeConnections.get(connectionId);
        if (!connection) return;

        const pingInterval = setInterval(() => {
            if (!this.activeConnections.has(connectionId)) {
                clearInterval(pingInterval);
                return;
            }

            const timeSinceLastActivity = Date.now() - connection.lastActivity.getTime();
            if (timeSinceLastActivity > 30000) { // 30 seconds
                this.sendWebSocketMessage(connectionId, {
                    type: 'ping',
                    timestamp: new Date().toISOString()
                });
            }
        }, 30000);
    }

    generateConnectionId() {
        return `ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Start the API Gateway server
     */
    start(port = process.env.PORT || 3000) {
        return new Promise((resolve, reject) => {
            try {
                this.server.listen(port, () => {
                    console.log(`Azure API Gateway running on port ${port}`);
                    console.log(`WebSocket server available at ws://localhost:${port}/ws`);

                    this.logger.createLogEntry('info', 'Azure API Gateway started', {
                        port,
                        services: Object.keys(this.services),
                        rateLimiters: Array.from(this.rateLimiters.keys())
                    });

                    resolve(port);
                });
            } catch (error) {
                this.logger.logError(error, { port }, 'api-gateway');
                reject(error);
            }
        });
    }

    /**
     * Stop the API Gateway server
     */
    stop() {
        return new Promise((resolve) => {
            if (this.server) {
                this.server.close(() => {
                    console.log('Azure API Gateway stopped');
                    this.logger.createLogEntry('info', 'Azure API Gateway stopped');
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }
}

module.exports = AzureAPIGateway;